// src/hooks/useNetworkOptimization.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';
import { safeDom } from '@/utils/browserApiSafeWrappers';


interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  priority?: 'low' | 'normal' | 'high';
}

interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duplicateRequests: number;
  retriedRequests: number;
  averageResponseTime: number;
  cacheHits: number;
  networkErrors: number;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  config: RequestConfig;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx errors, and specific 4xx errors
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429;
  }
};

export const useNetworkOptimization = () => {
  const [stats, setStats] = useState<NetworkStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    duplicateRequests: 0,
    retriedRequests: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    networkErrors: 0
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [requestQueue, setRequestQueue] = useState<RequestConfig[]>([]);

  // Request deduplication cache
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());
  const responseCache = useRef<Map<string, { data: any; timestamp: number; ttl: number }>>(new Map());
  const requestTimes = useRef<number[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Generate unique key for request deduplication
  const generateRequestKey = useCallback((config: RequestConfig): string => {
    const { url, method = 'GET', body } = config;
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyStr}`;
  }, []);

  // Check if response is cached and still valid
  const getCachedResponse = useCallback((key: string) => {
    const cached = responseCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setStats(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
      return cached.data;
    }
    if (cached) {
      responseCache.current.delete(key);
    }
    return null;
  }, []);

  // Cache response with TTL
  const cacheResponse = useCallback((key: string, data: any, ttl: number = 300000) => {
    responseCache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, []);

  // Exponential backoff calculation
  const calculateDelay = useCallback((attempt: number, config: RetryConfig): number => {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt),
      config.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, []);

  // Sleep utility for delays
  const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Intelligent retry mechanism
  const retryRequest = useCallback(async (
    requestFn: () => Promise<any>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    requestKey: string
  ): Promise<any> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setStats(prev => ({ ...prev, retriedRequests: prev.retriedRequests + 1 }));
          const delay = calculateDelay(attempt - 1, config);
          logger.info(`Retrying request ${requestKey}, attempt ${attempt}, delay: ${delay}ms`);
          await sleep(delay);
        }

        const result = await requestFn();
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!config.retryCondition || !config.retryCondition(error)) {
          throw error;
        }
        
        // Don't retry if we've reached max attempts
        if (attempt === config.maxRetries) {
          throw error;
        }
        
        logger.warn(`Request ${requestKey} failed, attempt ${attempt + 1}:`, error.message);
      }
    }
    
    throw lastError;
  }, [calculateDelay]);

  // Main request function with deduplication and retry
  const makeRequest = useCallback(async <T = any>(
    config: RequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    const requestKey = generateRequestKey(config);
    const startTime = Date.now();
    
    // Update stats
    setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));

    try {
      // Check cache first for GET requests
      if (config.method === 'GET' || !config.method) {
        const cached = getCachedResponse(requestKey);
        if (cached) {
          return cached;
        }
      }

      // Check for pending duplicate request
      const pending = pendingRequests.current.get(requestKey);
      if (pending) {
        setStats(prev => ({ ...prev, duplicateRequests: prev.duplicateRequests + 1 }));
        logger.info(`Deduplicating request: ${requestKey}`);
        return await pending.promise;
      }

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllers.current.set(requestKey, abortController);

      // Create the actual request function
      const requestFn = async () => {
        const fetchConfig: RequestInit = {
          method: config.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          },
          signal: abortController.signal
        };

        if (config.body && config.method !== 'GET') {
          fetchConfig.body = typeof config.body === 'string' 
            ? config.body 
            : JSON.stringify(config.body);
        }

        // Add timeout
        const timeoutId = config.timeout ? setTimeout(() => {
          abortController.abort();
        }, config.timeout) : null;

        try {
          const response = await fetch(config.url, fetchConfig);
          
          if (timeoutId) clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }
      };

      // Create promise with retry logic
      const requestPromise = retryRequest(
        requestFn,
        { ...DEFAULT_RETRY_CONFIG, ...retryConfig },
        requestKey
      );

      // Store pending request
      pendingRequests.current.set(requestKey, {
        promise: requestPromise,
        timestamp: Date.now(),
        config
      });

      // Execute request
      const result = await requestPromise;
      
      // Clean up
      pendingRequests.current.delete(requestKey);
      abortControllers.current.delete(requestKey);
      
      // Cache GET responses
      if (config.method === 'GET' || !config.method) {
        cacheResponse(requestKey, result);
      }
      
      // Update stats
      const responseTime = Date.now() - startTime;
      requestTimes.current.push(responseTime);
      if (requestTimes.current.length > 100) {
        requestTimes.current = requestTimes.current.slice(-100);
      }
      
      setStats(prev => ({
        ...prev,
        successfulRequests: prev.successfulRequests + 1,
        averageResponseTime: requestTimes.current.reduce((a, b) => a + b, 0) / requestTimes.current.length
      }));
      
      return result;
      
    } catch (error: any) {
      // Clean up
      pendingRequests.current.delete(requestKey);
      abortControllers.current.delete(requestKey);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        failedRequests: prev.failedRequests + 1,
        networkErrors: !error.response ? prev.networkErrors + 1 : prev.networkErrors
      }));
      
      logger.error(`Request failed: ${requestKey}`, error as Error);
      throw error;
    }
  }, [generateRequestKey, getCachedResponse, cacheResponse, retryRequest]);

  // Cancel specific request
  const cancelRequest = useCallback((config: RequestConfig) => {
    const requestKey = generateRequestKey(config);
    const abortController = abortControllers.current.get(requestKey);
    if (abortController) {
      abortController.abort();
      abortControllers.current.delete(requestKey);
      pendingRequests.current.delete(requestKey);
      logger.info(`Cancelled request: ${requestKey}`);
    }
  }, [generateRequestKey]);

  // Cancel all pending requests
  const cancelAllRequests = useCallback(() => {
    abortControllers.current.forEach((controller, key) => {
      controller.abort();
      logger.info(`Cancelled request: ${key}`);
    });
    abortControllers.current.clear();
    pendingRequests.current.clear();
  }, []);

  // Queue request for offline handling
  const queueRequest = useCallback((config: RequestConfig) => {
    setRequestQueue(prev => [...prev, config]);
    logger.info(`Queued request for offline: ${config.url}`);
  }, []);

  // Process queued requests when online
  const processQueuedRequests = useCallback(async () => {
    if (!isOnline || requestQueue.length === 0) return;
    
    logger.info(`Processing ${requestQueue.length} queued requests`);
    
    const requests = [...requestQueue];
    setRequestQueue([]);
    
    for (const config of requests) {
      try {
        await makeRequest(config);
        logger.info(`Successfully processed queued request: ${config.url}`);
      } catch (error) {
        logger.error(`Failed to process queued request: ${config.url}`, error);
        // Re-queue failed requests
        queueRequest(config);
      }
    }
  }, [isOnline, requestQueue, makeRequest, queueRequest]);

  // Clear all caches
  const clearCaches = useCallback(() => {
    responseCache.current.clear();
    pendingRequests.current.clear();
    setStats(prev => ({ ...prev, cacheHits: 0 }));
    logger.info('Cleared all network caches');
  }, []);

  // Reset stats
  const resetStats = useCallback(() => {
    setStats({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      duplicateRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      networkErrors: 0
    });
    requestTimes.current = [];
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Network connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Network connection lost');
    };
    
    safeDom.addEventListener(safeDom, window, 'online', handleOnline);
    safeDom.addEventListener(safeDom, window, 'offline', handleOffline);
    
    // Detect connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      safeDom.addEventListener(connection, 'change', handleConnectionChange);
      
      return () => {
        safeDom.removeEventListener(safeDom, window, 'online', handleOnline);
        safeDom.removeEventListener(safeDom, window, 'offline', handleOffline);
        safeDom.removeEventListener(connection, 'change', handleConnectionChange);
      };
    }
    
    return () => {
      safeDom.removeEventListener(safeDom, window, 'online', handleOnline);
      safeDom.removeEventListener(safeDom, window, 'offline', handleOffline);
    };
  }, []);

  // Process queued requests when coming online
  useEffect(() => {
    if (isOnline) {
      processQueuedRequests();
    }
  }, [isOnline, processQueuedRequests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllRequests();
    };
  }, [cancelAllRequests]);

  return {
    // Main functions
    makeRequest,
    cancelRequest,
    cancelAllRequests,
    queueRequest,
    processQueuedRequests,
    
    // Cache management
    clearCaches,
    getCachedResponse: (config: RequestConfig) => getCachedResponse(generateRequestKey(config)),
    
    // Stats and monitoring
    stats,
    resetStats,
    isOnline,
    connectionType,
    requestQueue,
    pendingRequestsCount: pendingRequests.current.size,
    
    // Utilities
    generateRequestKey
  };
};

// Specialized hooks for common use cases
export const useApiRequest = () => {
  const { makeRequest, ...rest } = useNetworkOptimization();
  
  const get = useCallback(<T = any>(url: string, config?: Partial<RequestConfig>) => {
    return makeRequest<T>({ url, method: 'GET', ...config });
  }, [makeRequest]);
  
  const post = useCallback(<T = any>(url: string, data?: any, config?: Partial<RequestConfig>) => {
    return makeRequest<T>({ url, method: 'POST', body: data, ...config });
  }, [makeRequest]);
  
  const put = useCallback(<T = any>(url: string, data?: any, config?: Partial<RequestConfig>) => {
    return makeRequest<T>({ url, method: 'PUT', body: data, ...config });
  }, [makeRequest]);
  
  const del = useCallback(<T = any>(url: string, config?: Partial<RequestConfig>) => {
    return makeRequest<T>({ url, method: 'DELETE', ...config });
  }, [makeRequest]);
  
  return {
    get,
    post,
    put,
    delete: del,
    makeRequest,
    ...rest
  };
};

export const useRequestDeduplication = () => {
  const { makeRequest, stats, pendingRequestsCount } = useNetworkOptimization();
  
  return {
    makeRequest,
    duplicateRequests: stats.duplicateRequests,
    pendingRequestsCount,
    deduplicationRate: stats.totalRequests > 0 
      ? (stats.duplicateRequests / stats.totalRequests) * 100 
      : 0
  };
};

export const useIntelligentRetry = () => {
  const { makeRequest, stats } = useNetworkOptimization();
  
  const makeRequestWithRetry = useCallback(<T = any>(
    config: RequestConfig,
    retryConfig?: Partial<RetryConfig>
  ) => {
    return makeRequest<T>(config, retryConfig);
  }, [makeRequest]);
  
  return {
    makeRequest: makeRequestWithRetry,
    retriedRequests: stats.retriedRequests,
    failedRequests: stats.failedRequests,
    successRate: stats.totalRequests > 0 
      ? (stats.successfulRequests / stats.totalRequests) * 100 
      : 0
  };
};

export default useNetworkOptimization;