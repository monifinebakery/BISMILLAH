// Safari iOS detection and compatibility utilities
import { logger } from './logger';

/**
 * Deteksi Safari iOS dengan akurat
 */
export const detectSafariIOS = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);
  
  return {
    isIOS,
    isSafari,
    isSafariIOS: isIOS && isSafari,
    userAgent,
    version: getSafariVersion(userAgent)
  };
};

/**
 * Mendapatkan versi Safari dari user agent
 */
const getSafariVersion = (userAgent: string): string | null => {
  const match = userAgent.match(/Version\/(\d+\.\d+)/);
  return match ? match[1] : null;
};

/**
 * Cek apakah Safari iOS memerlukan workaround khusus
 */
export const needsSafariWorkaround = (): boolean => {
  const detection = detectSafariIOS();
  
  if (!detection.isSafariIOS) return false;
  
  // Safari iOS versi lama (< 14) memerlukan workaround lebih banyak
  if (detection.version) {
    const majorVersion = parseInt(detection.version.split('.')[0]);
    return majorVersion < 16; // Safari 16+ lebih stabil
  }
  
  // Jika tidak bisa detect versi, assume perlu workaround
  return true;
};

/**
 * Konfigurasi timeout khusus untuk Safari iOS
 */
export const getSafariTimeout = (baseTimeout: number = 15000): number => {
  const detection = detectSafariIOS();
  
  if (!detection.isSafariIOS) return baseTimeout;
  
  // Safari iOS butuh timeout lebih lama
  let multiplier = 2;
  
  if (detection.version) {
    const majorVersion = parseInt(detection.version.split('.')[0]);
    if (majorVersion < 14) multiplier = 3; // Versi lama lebih lambat
    else if (majorVersion < 16) multiplier = 2.5;
  }
  
  const safariTimeout = Math.min(baseTimeout * multiplier, 60000);
  
  logger.debug('Safari iOS timeout calculated:', {
    baseTimeout,
    multiplier,
    safariTimeout,
    version: detection.version
  });
  
  return safariTimeout;
};

/**
 * Cek apakah service worker harus di-bypass untuk Safari iOS
 */
export const shouldBypassServiceWorker = (): boolean => {
  const detection = detectSafariIOS();
  
  if (!detection.isSafariIOS) return false;
  
  // Bypass service worker untuk Safari iOS versi lama yang bermasalah
  if (detection.version) {
    const majorVersion = parseInt(detection.version.split('.')[0]);
    return majorVersion < 15; // Safari 15+ support SW lebih baik
  }
  
  return false; // Default tidak bypass
};

/**
 * Mendapatkan delay yang direkomendasikan untuk Safari iOS
 */
export const getSafariDelay = (baseDelay: number = 3000): number => {
  const detection = detectSafariIOS();
  
  if (!detection.isSafariIOS) {
    return 0; // Tidak perlu delay untuk browser lain
  }
  
  // Safari iOS versi lama memerlukan delay lebih lama
  if (detection.version) {
    const majorVersion = parseInt(detection.version.split('.')[0]);
    if (majorVersion < 14) return baseDelay * 2; // Versi lama
    if (majorVersion < 16) return baseDelay * 1.5; // Versi menengah
  }
  
  return baseDelay; // Versi terbaru atau tidak diketahui
};

/**
 * Implementasi delay khusus untuk Safari iOS
 */
export const safariDelay = (ms: number = 1000): Promise<void> => {
  const detection = detectSafariIOS();
  
  if (!detection.isSafariIOS) {
    return Promise.resolve();
  }
  
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

/**
 * Log informasi Safari iOS untuk debugging
 */
export const logSafariInfo = () => {
  const detection = detectSafariIOS();
  
  if (detection.isSafariIOS) {
    logger.info('Safari iOS detected:', {
      version: detection.version,
      userAgent: detection.userAgent,
      needsWorkaround: needsSafariWorkaround(),
      shouldBypassSW: shouldBypassServiceWorker(),
      recommendedTimeout: getSafariTimeout()
    });
  }
};

/**
 * Fallback authentication untuk Safari iOS
 */
export const safariAuthFallback = async <T>(
  primaryMethod: () => Promise<T>,
  fallbackMethod: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> => {
  const detection = detectSafariIOS();
  
  if (!detection.isSafariIOS) {
    return primaryMethod();
  }
  
  logger.warn('Safari iOS: Using auth fallback strategy');
  
  try {
    // Coba method utama dengan timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Safari iOS auth timeout')), timeoutMs);
    });
    
    return await Promise.race([primaryMethod(), timeoutPromise]);
  } catch (error) {
    logger.warn('Safari iOS: Primary auth method failed, trying fallback:', error);
    
    // Coba fallback method
    try {
      return await fallbackMethod();
    } catch (fallbackError) {
      logger.error('Safari iOS: Both auth methods failed:', { error, fallbackError });
      throw fallbackError;
    }
  }
};

/**
 * Inisialisasi Safari iOS utilities
 */
export const initSafariUtils = () => {
  logSafariInfo();
  
  const detection = detectSafariIOS();
  
  if (detection.isSafariIOS) {
    // Set global flag untuk komponen lain
    (window as any).__SAFARI_IOS_DETECTED__ = true;
    (window as any).__SAFARI_IOS_VERSION__ = detection.version;
    
    logger.warn('Safari iOS compatibility mode enabled');
  }
};