// src/utils/mobileOptimizations.ts - MOBILE PERFORMANCE OPTIMIZATIONS
import { logger } from './logger';

/**
 * Mobile device detection dengan performance hints
 */
export const detectMobileCapabilities = () => {
  const userAgent = navigator.userAgent;
  const capabilities = {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isSlowDevice: false,
    isLowMemory: false,
    networkType: 'unknown',
    estimatedSpeed: 'fast'
  };

  // Detect slow devices
  capabilities.isSlowDevice = (
    userAgent.includes('Android 4') ||
    userAgent.includes('iPhone OS 10') ||
    userAgent.includes('iPhone OS 11') ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4)
  );

  // Detect low memory devices
  if ('deviceMemory' in navigator) {
    const deviceMemory = (navigator as any).deviceMemory;
    capabilities.isLowMemory = deviceMemory <= 2; // 2GB or less
  }

  // Network capabilities
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    capabilities.networkType = connection.effectiveType || 'unknown';
    
    // Estimate speed based on connection type
    if (['slow-2g', '2g'].includes(connection.effectiveType)) {
      capabilities.estimatedSpeed = 'very-slow';
    } else if (connection.effectiveType === '3g') {
      capabilities.estimatedSpeed = 'slow';
    } else if (connection.effectiveType === '4g') {
      capabilities.estimatedSpeed = 'fast';
    }
  }

  logger.debug('Mobile capabilities detected:', capabilities);
  return capabilities;
};

/**
 * Get optimized timeouts based on device capabilities
 */
export const getMobileOptimizedTimeout = (
  baseTimeout: number,
  operation: 'auth' | 'api' | 'component-load' = 'api'
) => {
  const capabilities = detectMobileCapabilities();
  let timeout = baseTimeout;

  // Base mobile adjustment - mobile needs MORE time for auth, not less
  if (capabilities.isMobile) {
    timeout *= 1.5; // 50% longer for mobile auth (was reducing by 20%)
  }

  // Device-specific adjustments
  if (capabilities.isSlowDevice) {
    timeout *= capabilities.isMobile ? 1.3 : 2;
  }

  if (capabilities.isLowMemory) {
    timeout *= 1.2;
  }

  // Network-specific adjustments for mobile auth
  switch (capabilities.estimatedSpeed) {
    case 'very-slow':
      timeout *= capabilities.isMobile ? 4 : 4; // Increased mobile multiplier
      break;
    case 'slow':
      timeout *= capabilities.isMobile ? 3 : 2; // Increased mobile multiplier
      break;
    case 'fast':
      timeout *= capabilities.isMobile ? 1.2 : 0.9; // Still longer for mobile even on fast network
      break;
  }

  // Operation-specific limits - increased for mobile compatibility
  const maxTimeouts = {
    auth: capabilities.isMobile ? 45000 : 20000, // Increased from 12s to 45s for mobile auth
    api: capabilities.isMobile ? 15000 : 15000, // Increased from 8s to 15s
    'component-load': capabilities.isMobile ? 5000 : 5000 // Increased from 3s to 5s
  };

  const finalTimeout = Math.min(timeout, maxTimeouts[operation]);
  
  logger.debug(`Mobile optimized timeout for ${operation}:`, {
    base: baseTimeout,
    final: finalTimeout,
    capabilities
  });

  return finalTimeout;
};

/**
 * Mobile-optimized setTimeout dengan automatic cleanup
 */
export const setMobileOptimizedTimeout = (
  callback: () => void,
  baseDelay: number,
  priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
) => {
  const capabilities = detectMobileCapabilities();
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
 * Non-blocking task execution untuk mobile
 */
export const executeMobileOptimizedTask = async (
  task: () => Promise<void> | void,
  priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
) => {
  const capabilities = detectMobileCapabilities();
  
  if (!capabilities.isMobile || priority === 'critical') {
    // Execute immediately for desktop or critical tasks
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
        requestAnimationFrame(executeTask);
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
 * Mobile-friendly loading states
 */
export const getMobileLoadingComponent = (
  stage: 'auth' | 'app' | 'component' | 'feature',
  isMobile: boolean
) => {
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
 * Performance monitor untuk mobile debugging
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

  return {
    start: (operation: string) => {
      startTimes.set(operation, performance.now());
      logger.debug(`📊 [Mobile Perf] Started: ${operation}`);
    },

    end: (operation: string) => {
      const startTime = startTimes.get(operation);
      if (startTime) {
        const duration = performance.now() - startTime;
        startTimes.delete(operation);
        
        // Store in metrics
        if (operation.includes('auth')) metrics.authTime = duration;
        else if (operation.includes('provider')) metrics.providerLoadTime = duration;
        else if (operation.includes('render')) metrics.firstRenderTime = duration;
        
        logger.debug(`📊 [Mobile Perf] Completed: ${operation} in ${duration.toFixed(2)}ms`);
        
        // Alert for slow operations on mobile
        const thresholds = {
          auth: capabilities.isMobile ? 8000 : 15000,
          provider: capabilities.isMobile ? 3000 : 5000,
          render: capabilities.isMobile ? 1000 : 2000
        };
        
        const threshold = Object.entries(thresholds).find(([key]) => 
          operation.toLowerCase().includes(key)
        )?.[1] || 5000;
        
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
        timestamp: new Date().toISOString()
      };
      
      logger.info('📊 [Mobile Perf] Performance Report:', report);
      
      // Store in localStorage for debugging
      if (capabilities.isMobile) {
        try {
          localStorage.setItem('mobile-perf-report', JSON.stringify(report));
        } catch (e) {
          // Ignore storage errors
        }
      }
      
      return report;
    }
  };
};

// Global performance monitor instance
export const mobilePerf = createMobilePerformanceMonitor();