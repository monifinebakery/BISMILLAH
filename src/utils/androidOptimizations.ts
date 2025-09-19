// Android-specific performance optimizations
import { logger } from '@/utils/logger';

export interface AndroidDetectionResult {
  isAndroid: boolean;
  version?: string;
  isSlowDevice: boolean;
  networkType: string;
  hasWebKit: boolean;
  chromeVersion?: string;
  userAgent: string;
}

export const detectAndroid = (): AndroidDetectionResult => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  
  const androidMatch = userAgent.match(/Android\s+([\d.]+)/i);
  const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/i);
  
  const isAndroid = /Android/i.test(userAgent);
  const version = androidMatch?.[1] || '';
  const chromeVersion = chromeMatch?.[1] || '';
  
  // Detect slow Android devices
  const isSlowDevice = 
    version && parseFloat(version) < 8.0 || // Android < 8.0
    userAgent.includes('Android 4') ||
    userAgent.includes('Android 5') ||
    userAgent.includes('Android 6') ||
    userAgent.includes('Android 7') ||
    /SM-J[1-3]/.test(userAgent) || // Samsung Galaxy J series (low-end)
    /SM-A[0-2]/.test(userAgent) || // Samsung Galaxy A series (some low-end)
    userAgent.includes('Go Edition') ||
    chromeVersion && parseFloat(chromeVersion) < 90;

  const hasWebKit = userAgent.includes('WebKit');
  
  let networkType = 'unknown';
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    networkType = connection?.effectiveType || 'unknown';
  }

  return {
    isAndroid,
    version,
    isSlowDevice,
    networkType,
    hasWebKit,
    chromeVersion,
    userAgent
  };
};

export const getAndroidOptimizedTimeout = (baseTimeout: number = 12000): number => {
  const androidInfo = detectAndroid();
  
  if (!androidInfo.isAndroid) {
    return baseTimeout;
  }

  let timeout = baseTimeout;

  // Slow device adjustments
  if (androidInfo.isSlowDevice) {
    timeout *= 2.5; // Increase by 250% for slow Android devices
    logger.debug('Android: Slow device detected, increasing timeout', {
      originalTimeout: baseTimeout,
      newTimeout: timeout,
      version: androidInfo.version,
      chromeVersion: androidInfo.chromeVersion
    });
  }

  // Network-based adjustments
  if (androidInfo.networkType === 'slow-2g' || androidInfo.networkType === '2g') {
    timeout *= 3;
    logger.debug('Android: Very slow network detected', { networkType: androidInfo.networkType, timeout });
  } else if (androidInfo.networkType === '3g') {
    timeout *= 1.8;
    logger.debug('Android: 3G network detected', { networkType: androidInfo.networkType, timeout });
  }

  // Chrome version adjustments
  if (androidInfo.chromeVersion && parseFloat(androidInfo.chromeVersion) < 90) {
    timeout *= 1.5;
    logger.debug('Android: Old Chrome version detected', { 
      chromeVersion: androidInfo.chromeVersion, 
      timeout 
    });
  }

  // Cap maximum timeout
  const maxTimeout = 45000; // 45 seconds max for Android
  timeout = Math.min(timeout, maxTimeout);

  logger.info('Android: Optimized timeout calculated', {
    baseTimeout,
    finalTimeout: timeout,
    androidVersion: androidInfo.version,
    networkType: androidInfo.networkType,
    isSlowDevice: androidInfo.isSlowDevice
  });

  return timeout;
};

export const preOptimizeAndroidAuth = (): void => {
  const androidInfo = detectAndroid();
  
  if (!androidInfo.isAndroid) {
    return;
  }

  logger.info('Android: Pre-optimizing authentication environment', androidInfo);

  // Preload critical resources for Android
  try {
    // Pre-warm localStorage
    localStorage.setItem('__android_preload__', Date.now().toString());
    localStorage.removeItem('__android_preload__');

    // Pre-warm sessionStorage
    sessionStorage.setItem('__android_preload__', Date.now().toString());
    sessionStorage.removeItem('__android_preload__');

    // Pre-warm IndexedDB if available
    if ('indexedDB' in window) {
      const request = indexedDB.open('__android_preload__', 1);
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase('__android_preload__');
      };
      request.onerror = () => {
        logger.debug('Android: IndexedDB preload failed (expected on some devices)');
      };
    }

    logger.debug('Android: Storage pre-warming completed');
  } catch (error) {
    logger.debug('Android: Storage pre-warming failed', error);
  }

  // Force garbage collection hint for memory-constrained devices
  if (androidInfo.isSlowDevice && 'gc' in window) {
    try {
      (window as any).gc();
      logger.debug('Android: Garbage collection hint sent');
    } catch (error) {
      // Ignore - gc not available in production builds
    }
  }
};

export const androidAuthFallback = async <T>(
  primaryAuth: () => Promise<T>,
  fallbackAuth: () => Promise<T>,
  timeout: number
): Promise<T> => {
  const androidInfo = detectAndroid();
  
  if (!androidInfo.isAndroid) {
    return await primaryAuth();
  }

  logger.info('Android: Using Android-specific auth fallback strategy', {
    timeout,
    androidVersion: androidInfo.version,
    isSlowDevice: androidInfo.isSlowDevice
  });

  // For slow Android devices, try fallback first
  if (androidInfo.isSlowDevice) {
    logger.debug('Android: Slow device - trying fallback auth first');
    try {
      const result = await Promise.race([
        fallbackAuth(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Android fallback timeout')), timeout * 0.7)
        )
      ]);
      
      logger.success('Android: Fallback auth succeeded on slow device');
      return result;
    } catch (fallbackError) {
      logger.warn('Android: Fallback auth failed, trying primary', { error: fallbackError });
      
      try {
        const result = await Promise.race([
          primaryAuth(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Android primary timeout')), timeout * 0.3)
          )
        ]);
        
        logger.success('Android: Primary auth succeeded after fallback failure');
        return result;
      } catch (primaryError) {
        logger.error('Android: Both auth methods failed on slow device', {
          fallbackError,
          primaryError
        });
        throw primaryError;
      }
    }
  }

  // For normal Android devices, try primary with shorter timeout
  logger.debug('Android: Normal device - trying primary auth with timeout');
  try {
    const result = await Promise.race([
      primaryAuth(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Android primary timeout')), timeout * 0.6)
      )
    ]);
    
    logger.success('Android: Primary auth succeeded');
    return result;
  } catch (primaryError) {
    logger.warn('Android: Primary auth timed out, trying fallback', { error: primaryError });
    
    const result = await Promise.race([
      fallbackAuth(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Android fallback timeout')), timeout * 0.4)
      )
    ]);
    
    logger.success('Android: Fallback auth succeeded after primary timeout');
    return result;
  }
};

export const androidMemoryCleanup = (): void => {
  const androidInfo = detectAndroid();
  
  if (!androidInfo.isAndroid || !androidInfo.isSlowDevice) {
    return;
  }

  logger.debug('Android: Performing memory cleanup for slow device');

  // Clear temporary caches
  try {
    // Clear any temporary data
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('temp') || key.includes('cache') || key.includes('__test__'))) {
        localStorage.removeItem(key);
      }
    }

    // Clear session storage temporary data
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('temp') || key.includes('cache') || key.includes('__test__'))) {
        sessionStorage.removeItem(key);
      }
    }

    logger.debug('Android: Memory cleanup completed');
  } catch (error) {
    logger.debug('Android: Memory cleanup failed', error);
  }
};