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
  
  // Safari iOS butuh timeout lebih lama - tingkatkan multiplier
  let multiplier = 3; // Increased from 2
  
  if (detection.version) {
    const majorVersion = parseInt(detection.version.split('.')[0]);
    if (majorVersion < 14) multiplier = 4; // Increased from 3
    else if (majorVersion < 16) multiplier = 3.5; // Increased from 2.5
  }
  
  const safariTimeout = Math.min(baseTimeout * multiplier, 90000); // Increased max from 60000
  
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
export const getSafariDelay = (baseDelay: number = 5000): number => { // Increased default from 3000
  const detection = detectSafariIOS();
  
  if (!detection.isSafariIOS) {
    return 0; // Tidak perlu delay untuk browser lain
  }
  
  // Safari iOS versi lama memerlukan delay lebih lama
  if (detection.version) {
    const majorVersion = parseInt(detection.version.split('.')[0]);
    if (majorVersion < 14) return baseDelay * 2.5; // Increased from 2
    if (majorVersion < 16) return baseDelay * 2; // Increased from 1.5
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
 * Preload critical resources for Safari iOS
 */
const preloadCriticalResources = () => {
  // ✅ Preload stylesheet Safari tanpa memicu MIME error
  const safariCss = new URL('../styles/safari-optimizations.css', import.meta.url).href;
  const styleLink = document.createElement('link');
  styleLink.rel = 'preload';
  styleLink.as = 'style';
  styleLink.href = safariCss;
  document.head.appendChild(styleLink);

  // DNS prefetch dan preconnect untuk mempercepat koneksi
  const origin = window.location.origin;

  const dnsLink = document.createElement('link');
  dnsLink.rel = 'dns-prefetch';
  dnsLink.href = origin;
  document.head.appendChild(dnsLink);

  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = origin;
  preconnect.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect);

  logger.debug('Safari iOS: Critical resources preloaded');
};

/**
 * Optimize Safari iOS performance to match other browsers
 */
const optimizeSafariPerformance = () => {
  // Disable heavy animations for Safari iOS
  document.documentElement.style.setProperty('--safari-reduce-motion', 'true');
  
  // Optimize viewport for Safari iOS
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
  
  // Force hardware acceleration for Safari iOS
  document.documentElement.style.setProperty('transform', 'translateZ(0)');
  document.documentElement.style.setProperty('backface-visibility', 'hidden');
  
  // Optimize touch events for Safari iOS
  document.documentElement.style.setProperty('-webkit-touch-callout', 'none');
  document.documentElement.style.setProperty('-webkit-tap-highlight-color', 'transparent');
  
  logger.debug('Safari iOS: Performance optimizations applied');
};

/**
 * Apply Safari iOS specific fixes to match other browsers
 */
const applySafariFixes = () => {
  // Fix Safari iOS scrolling issues
  document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
  
  // Fix Safari iOS input zoom
  const style = document.createElement('style');
  style.textContent = `
    @media screen and (-webkit-min-device-pixel-ratio: 0) {
      select, textarea, input[type="text"], input[type="password"], 
      input[type="datetime"], input[type="datetime-local"], 
      input[type="date"], input[type="month"], input[type="time"], 
      input[type="week"], input[type="number"], input[type="email"], 
      input[type="url"], input[type="search"], input[type="tel"], 
      input[type="color"] {
        font-size: 16px !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Fix Safari iOS memory management
  if ('serviceWorker' in navigator) {
    // Reduce service worker cache size for Safari iOS
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'SAFARI_OPTIMIZE',
          payload: { reduceCacheSize: true }
        });
      }
    }).catch(() => {
      // Ignore service worker errors on Safari iOS
    });
  }
  
  logger.debug('Safari iOS: Browser-specific fixes applied');
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
    
    logger.info('Safari iOS utilities initialized - applying performance optimizations', {
      version: detection.version,
      needsWorkaround: needsSafariWorkaround()
    });
    
    // Apply comprehensive Safari iOS optimizations
    optimizeSafariPerformance();
    applySafariFixes();
    
    // Preload critical resources for faster loading
    preloadCriticalResources();
    
    // Additional optimizations for older Safari versions
    if (needsSafariWorkaround()) {
      document.documentElement.style.setProperty('--safari-optimization', 'true');
      document.documentElement.style.setProperty('--safari-legacy-mode', 'true');
      
      // Reduce JavaScript execution complexity for older versions
      window.requestIdleCallback = window.requestIdleCallback || ((cb) => {
        const start = Date.now();
        return setTimeout(() => {
          cb({
            didTimeout: false,
            timeRemaining() {
              return Math.max(0, 50 - (Date.now() - start));
            }
          });
        }, 1);
      });
    }
    
    logger.info('Safari iOS: All optimizations applied - performance should now match other browsers');
  }
};