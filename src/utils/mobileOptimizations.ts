// src/utils/mobileOptimizations.ts - MOBILE PERFORMANCE OPTIMIZATIONS
import { logger } from './logger';

/**
 * ✅ SSR-safe mobile device detection dengan performance hints
 */
export const detectMobileCapabilities = () => {
  // ✅ FIX 1: SSR safety - guard against server-side rendering
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isSlowDevice: false,
      isLowMemory: false,
      networkType: 'unknown' as const,
      estimatedSpeed: 'fast' as const,
      ssrMode: true
    };
  }

  const userAgent = navigator.userAgent;
  const capabilities = {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isSlowDevice: false,
    isLowMemory: false,
    networkType: 'unknown' as 'slow-2g' | '2g' | '3g' | '4g' | 'unknown',
    estimatedSpeed: 'fast' as 'very-slow' | 'slow' | 'fast',
    ssrMode: false
  };

  // ✅ FIX 2: Better device detection - prioritize hardware specs over User Agent
  // Detect slow devices based on hardware capabilities first
  if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency) {
    capabilities.isSlowDevice = navigator.hardwareConcurrency < 4;
  } else {
    // Fallback to limited User Agent checks (more reliable patterns)
    capabilities.isSlowDevice = (
      /Android\s[1-4]\./i.test(userAgent) || // Android 1-4
      /iPhone\sOS\s[89]_/i.test(userAgent) || // iPhone iOS 8-9
      /CPU.*OS\s[89]_/i.test(userAgent) // iPad iOS 8-9
    );
  }

  // ✅ Better memory detection with fallback
  if ('deviceMemory' in navigator) {
    const deviceMemory = (navigator as any).deviceMemory;
    capabilities.isLowMemory = deviceMemory <= 2; // 2GB or less
  } else {
    // Fallback: assume slow devices have low memory
    capabilities.isLowMemory = capabilities.isSlowDevice;
  }

  // ✅ FIX 3: Network detection with iOS Safari fallback
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection.effectiveType) {
      capabilities.networkType = connection.effectiveType;
      
      // Estimate speed based on connection type
      if (['slow-2g', '2g'].includes(connection.effectiveType)) {
        capabilities.estimatedSpeed = 'very-slow';
      } else if (connection.effectiveType === '3g') {
        capabilities.estimatedSpeed = 'slow';
      } else if (connection.effectiveType === '4g') {
        capabilities.estimatedSpeed = 'fast';
      }
    }
  } else {
    // ✅ FIX: Fallback for iOS Safari - estimate based on device age
    if (capabilities.isMobile) {
      if (capabilities.isSlowDevice) {
        capabilities.estimatedSpeed = 'slow';
        capabilities.networkType = '3g'; // Conservative estimate
      } else {
        capabilities.estimatedSpeed = 'fast';
        capabilities.networkType = '4g'; // Modern device assumption
      }
    }
  }

  logger.debug('Mobile capabilities detected:', capabilities);
  return capabilities;
};

/**
 * ✅ FIX 3: Better timeout strategy - shorter timeout with retry, not single long wait
 */
export const getMobileOptimizedTimeout = (
  baseTimeout: number,
  operation: 'auth' | 'api' | 'component-load' = 'api',
  attempt: number = 1
) => {
  const capabilities = detectMobileCapabilities();
  
  // ✅ SSR safety
  if (capabilities.ssrMode) {
    return baseTimeout;
  }

  let timeout = baseTimeout;

  // ✅ IMPROVED STRATEGY: Moderate base increase, rely on retry logic
  if (capabilities.isMobile) {
    timeout *= 1.3; // Moderate 30% increase (was 50%)
  }

  // Device-specific adjustments
  if (capabilities.isSlowDevice) {
    timeout *= capabilities.isMobile ? 1.2 : 1.5; // Reduced multipliers
  }

  if (capabilities.isLowMemory) {
    timeout *= 1.1; // Reduced from 1.2
  }

  // Network-specific adjustments - more conservative
  switch (capabilities.estimatedSpeed) {
    case 'very-slow':
      timeout *= capabilities.isMobile ? 2 : 2.5; // Reduced from 4x
      break;
    case 'slow':
      timeout *= capabilities.isMobile ? 1.5 : 1.8; // Reduced from 3x
      break;
    case 'fast':
      timeout *= capabilities.isMobile ? 1.1 : 1.0;
      break;
  }

  // ✅ FIX 3: Reasonable operation limits with retry strategy
  const maxTimeouts = {
    auth: capabilities.isMobile ? 15000 : 12000, // Reduced from 45s to 15s - rely on retries
    api: capabilities.isMobile ? 8000 : 6000,    // Reduced from 15s to 8s
    'component-load': capabilities.isMobile ? 3000 : 2000 // Reduced from 5s to 3s
  };

  // ✅ Exponential backoff for retries (attempt 2+ gets longer timeout)
  if (attempt > 1) {
    const retryMultiplier = Math.min(attempt * 1.5, 3); // Cap at 3x for attempt 3+
    timeout *= retryMultiplier;
  }

  const finalTimeout = Math.min(timeout, maxTimeouts[operation] * Math.min(attempt, 3));
  
  logger.debug(`Mobile optimized timeout for ${operation} (attempt ${attempt}):`, {
    base: baseTimeout,
    final: finalTimeout,
    attempt,
    capabilities
  });

  return finalTimeout;
};

/**
 * ✅ NEW: Retry-enabled timeout with exponential backoff
 */
export const getMobileTimeoutWithRetry = (
  baseTimeout: number,
  operation: 'auth' | 'api' | 'component-load' = 'api'
) => {
  const capabilities = detectMobileCapabilities();
  const maxRetries = capabilities.isMobile ? 3 : 2;
  
  return {
    getTimeout: (attempt: number = 1) => getMobileOptimizedTimeout(baseTimeout, operation, attempt),
    maxRetries,
    shouldRetry: (error: Error) => {
      const msg = error.message.toLowerCase();
      return msg.includes('timeout') || msg.includes('network') || msg.includes('fetch');
    },
    getRetryDelay: (attempt: number) => {
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Cap at 5s
      const jitter = Math.random() * 0.3 * baseDelay; // ±30% jitter
      return baseDelay + jitter;
    }
  };
};

/**
 * ✅ SSR-safe mobile-optimized setTimeout dengan automatic cleanup
 */
export const setMobileOptimizedTimeout = (
  callback: () => void,
  baseDelay: number,
  priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
) => {
  const capabilities = detectMobileCapabilities();
  
  // ✅ SSR safety
  if (capabilities.ssrMode) {
    return setTimeout(callback, baseDelay);
  }

  let delay = baseDelay;

  // Priority-based delays untuk mobile
  if (capabilities.isMobile) {
    const priorityMultipliers = {
      critical: 0.5,  // 50% faster
      high: 0.7,      // 30% faster
      medium: 1.0,    // same
      low: 1.5        // 50% slower
    };
    delay *= priorityMultipliers[priority];
  }

  // Device capability adjustments
  if (capabilities.isSlowDevice) {
    delay *= capabilities.isMobile ? 1.2 : 1.5;
  }

  if (capabilities.isLowMemory) {
    delay *= 1.1;
  }

  const finalDelay = Math.max(delay, 16); // Minimum 16ms (1 frame)
  
  return setTimeout(callback, finalDelay);
};

/**
 * ✅ SSR-safe non-blocking task execution untuk mobile
 */
export const executeMobileOptimizedTask = async (
  task: () => Promise<void> | void,
  priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
) => {
  const capabilities = detectMobileCapabilities();
  
  // ✅ SSR safety or immediate execution for critical tasks
  if (capabilities.ssrMode || !capabilities.isMobile || priority === 'critical') {
    return await task();
  }

  // For mobile, use different strategies based on priority
  return new Promise<void>((resolve, reject) => {
    const executeTask = async () => {
      try {
        await task();
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    switch (priority) {
      case 'high':
        // Use requestAnimationFrame for high priority
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(executeTask);
        } else {
          setTimeout(executeTask, 16);
        }
        break;
        
      case 'medium':
        // Use setTimeout with short delay
        setTimeout(executeTask, 16);
        break;
        
      case 'low':
        // Use requestIdleCallback if available
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(executeTask, { timeout: 5000 });
        } else {
          setTimeout(executeTask, 100);
        }
        break;
        
      default:
        executeTask();
    }
  });
};

/**
 * ✅ SSR-safe mobile-friendly loading states
 */
export const getMobileLoadingComponent = (
  stage: 'auth' | 'app' | 'component' | 'feature',
  isMobile?: boolean
) => {
  // ✅ Auto-detect mobile if not provided, with SSR safety
  if (isMobile === undefined) {
    const capabilities = detectMobileCapabilities();
    isMobile = capabilities.isMobile;
  }

  const sizes = {
    auth: isMobile ? 'w-12 h-12' : 'w-16 h-16',
    app: isMobile ? 'w-10 h-10' : 'w-14 h-14',
    component: isMobile ? 'w-8 h-8' : 'w-12 h-12',
    feature: isMobile ? 'w-6 h-6' : 'w-8 h-8'
  };

  const messages = {
    auth: isMobile ? 'Verifikasi...' : 'Memverifikasi autentikasi...',
    app: isMobile ? 'Memuat...' : 'Memuat aplikasi...',
    component: isMobile ? 'Loading...' : 'Memuat komponen...',
    feature: isMobile ? 'Siap...' : 'Menyiapkan fitur...'
  };

  return {
    spinnerClass: `${sizes[stage]} border-4 border-orange-500 border-t-transparent rounded-full animate-spin`,
    message: messages[stage],
    textClass: isMobile ? 'text-sm' : 'text-base'
  };
};

/**
 * ✅ SSR-safe performance monitor dengan storage quota limits
 */
export const createMobilePerformanceMonitor = () => {
  const capabilities = detectMobileCapabilities();
  const startTimes = new Map<string, number>();
  const metrics = {
    authTime: 0,
    providerLoadTime: 0,
    firstRenderTime: 0,
    totalLoadTime: 0
  };

  // ✅ FIX 5: Storage quota management
  const STORAGE_KEY = 'mobile-perf-report';
  const MAX_REPORTS = 5; // Keep only last 5 reports to prevent quota issues

  const manageStorageQuota = (newReport: any) => {
    if (capabilities.ssrMode || typeof localStorage === 'undefined') {
      return;
    }

    try {
      // Get existing reports
      const existing = localStorage.getItem(STORAGE_KEY);
      let reports: any[] = [];
      
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          reports = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          reports = [];
        }
      }
      
      // Add new report and limit to MAX_REPORTS
      reports.push(newReport);
      if (reports.length > MAX_REPORTS) {
        reports = reports.slice(-MAX_REPORTS); // Keep last N reports
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      // ✅ Handle quota exceeded gracefully
      logger.debug('📊 [Mobile Perf] Storage quota exceeded, clearing old reports');
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newReport]));
      } catch {
        // Give up on storage if still failing
        logger.debug('📊 [Mobile Perf] Storage unavailable, report not persisted');
      }
    }
  };

  return {
    start: (operation: string) => {
      if (capabilities.ssrMode || typeof performance === 'undefined') {
        return;
      }
      startTimes.set(operation, performance.now());
      logger.debug(`📊 [Mobile Perf] Started: ${operation}`);
    },

    end: (operation: string) => {
      if (capabilities.ssrMode || typeof performance === 'undefined') {
        return;
      }
      
      const startTime = startTimes.get(operation);
      if (startTime) {
        const duration = performance.now() - startTime;
        startTimes.delete(operation);
        
        // Store in metrics
        if (operation.includes('auth')) metrics.authTime = duration;
        else if (operation.includes('provider')) metrics.providerLoadTime = duration;
        else if (operation.includes('render')) metrics.firstRenderTime = duration;
        
        logger.debug(`📊 [Mobile Perf] Completed: ${operation} in ${duration.toFixed(2)}ms`);
        
        // Alert for slow operations on mobile - adjusted thresholds for retry strategy
        const thresholds = {
          auth: capabilities.isMobile ? 5000 : 8000, // Reduced since we use retries
          provider: capabilities.isMobile ? 2000 : 3000,
          render: capabilities.isMobile ? 800 : 1500
        };
        
        const threshold = Object.entries(thresholds).find(([key]) => 
          operation.toLowerCase().includes(key)
        )?.[1] || 3000;
        
        if (duration > threshold) {
          logger.warn(`⚠️ [Mobile Perf] Slow ${operation}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`, {
            capabilities,
            operation,
            duration
          });
        }
      }
    },

    getMetrics: () => ({
      ...metrics,
      capabilities,
      totalLoadTime: metrics.authTime + metrics.providerLoadTime + metrics.firstRenderTime
    }),

    report: () => {
      const report = {
        ...metrics,
        capabilities,
        timestamp: new Date().toISOString(),
        sessionId: Date.now() // Simple session identifier
      };
      
      logger.info('📊 [Mobile Perf] Performance Report:', report);
      
      // ✅ Store with quota management
      if (capabilities.isMobile && !capabilities.ssrMode) {
        manageStorageQuota(report);
      }
      
      return report;
    },

    // ✅ NEW: Clear old reports manually
    clearReports: () => {
      if (capabilities.ssrMode || typeof localStorage === 'undefined') {
        return;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
        logger.debug('📊 [Mobile Perf] Performance reports cleared');
      } catch {
        logger.debug('📊 [Mobile Perf] Could not clear reports');
      }
    }
  };
};

// Global performance monitor instance
export const mobilePerf = createMobilePerformanceMonitor();