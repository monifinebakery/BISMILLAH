// src/utils/networkErrorHandler.ts
// Global network error handler untuk menyembunyikan 'Fetch failed loading' di production

import { safeStorageGet, safeStorageRemove, safeStorageSet } from '@/utils/auth/safeStorage';

import { logger } from './logger';

const FORCE_NETWORK_LOGS_KEY = 'FORCE_NETWORK_LOGS';

let storageAvailableForNetworkLogs = true;
let forceNetworkLogsFallback = false;

const markStorageUnavailable = (): void => {
  if (!storageAvailableForNetworkLogs) {
    return;
  }

  storageAvailableForNetworkLogs = false;
  logger.warn('[NETWORK] Storage tidak tersedia, menggunakan fallback in-memory untuk FORCE_NETWORK_LOGS.');
};

const isStorageUsable = (): boolean => {
  if (!storageAvailableForNetworkLogs) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Akses property untuk memastikan storage tersedia
    void window.localStorage;
    return true;
  } catch (error) {
    markStorageUnavailable();
    logger.warn('[NETWORK] Gagal mengakses window.localStorage, fallback digunakan untuk konfigurasi network logs.', error);
    return false;
  }
};

const isForceNetworkLogsEnabled = (): boolean => {
  if (!isStorageUsable()) {
    return forceNetworkLogsFallback;
  }

  const storedValue = safeStorageGet(FORCE_NETWORK_LOGS_KEY);

  if (storedValue === 'true') {
    forceNetworkLogsFallback = true;
    return true;
  }

  if (storedValue === 'false') {
    forceNetworkLogsFallback = false;
    return false;
  }

  return forceNetworkLogsFallback;
};

const updateForceNetworkLogs = (enabled: boolean): void => {
  forceNetworkLogsFallback = enabled;

  if (!isStorageUsable()) {
    return;
  }

  const operation = enabled
    ? safeStorageSet(FORCE_NETWORK_LOGS_KEY, 'true')
    : safeStorageRemove(FORCE_NETWORK_LOGS_KEY);

  void operation.catch(() => {
    markStorageUnavailable();
  });
};

// Environment detection
const IS_PRODUCTION = window.location.hostname === 'kalkulator.monifine.my.id' || 
                     window.location.hostname === 'www.kalkulator.monifine.my.id';

// Network error patterns yang akan disembunyikan di production
const NETWORK_ERROR_PATTERNS = [
  'fetch failed loading',
  'failed to fetch',
  'network error',
  'net::err_',
  'loading chunk failed',
  'loading css chunk failed',
  'loading js chunk failed',
  'script error',
  'network request failed',
  'connection refused',
  'timeout',
  'cors error'
];

// Function untuk mengecek apakah error adalah network error
function isNetworkError(error: string | Error): boolean {
  const errorMessage = typeof error === 'string' ? error.toLowerCase() : error.message?.toLowerCase() || '';
  return NETWORK_ERROR_PATTERNS.some(pattern => errorMessage.includes(pattern));
}

// Function untuk menyembunyikan network error di production
function shouldSuppressError(error: string | Error): boolean {
  if (!IS_PRODUCTION) return false;
  return isNetworkError(error);
}

// Global error handler untuk window errors
function handleWindowError(event: ErrorEvent): boolean {
  const error = event.error || event.message;
  
  if (shouldSuppressError(error)) {
    // Silent di production, tapi log untuk debugging jika diperlukan
    if (isForceNetworkLogsEnabled()) {
      logger.debug('[NETWORK] Suppressed error:', error);
    }
    return true; // Prevent default browser error handling
  }
  
  // Log error normal untuk non-network errors
  logger.error('[GLOBAL] Unhandled error:', error);
  return false;
}

// Global handler untuk unhandled promise rejections
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const error = event.reason;
  
  if (shouldSuppressError(error)) {
    // Silent di production
    if (isForceNetworkLogsEnabled()) {
      logger.debug('[NETWORK] Suppressed promise rejection:', error);
    }
    event.preventDefault(); // Prevent default browser handling
    return;
  }
  
  // Log error normal untuk non-network errors
  logger.error('[GLOBAL] Unhandled promise rejection:', error);
}

// Fetch interceptor untuk menangani network errors
const originalFetch = window.fetch;
window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
  try {
    const response = await originalFetch.apply(this, args);
    return response;
  } catch (error) {
    if (shouldSuppressError(error as Error)) {
      // Silent di production, tapi tetap throw error untuk handling aplikasi
      if (isForceNetworkLogsEnabled()) {
        logger.debug('[FETCH] Network error suppressed:', error);
      }
    } else {
      logger.error('[FETCH] Network error:', error);
    }
    throw error; // Tetap throw untuk handling aplikasi
  }
};

// Console interceptor untuk menyembunyikan console errors di production
if (IS_PRODUCTION) {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (isNetworkError(message)) {
      // Silent di production
      if (isForceNetworkLogsEnabled()) {
        originalConsoleError.apply(console, ['[SUPPRESSED]', ...args]);
      }
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    if (isNetworkError(message)) {
      // Silent di production
      if (isForceNetworkLogsEnabled()) {
        originalConsoleWarn.apply(console, ['[SUPPRESSED]', ...args]);
      }
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Initialize global error handlers
export function initializeNetworkErrorHandler(): void {
  // Window error handler
  window.addEventListener('error', handleWindowError);
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  // Resource loading error handler (images, scripts, etc)
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      const tagName = target.tagName?.toLowerCase();
      
      if (['img', 'script', 'link', 'iframe'].includes(tagName)) {
        if (shouldSuppressError('resource loading failed')) {
          if (isForceNetworkLogsEnabled()) {
            logger.debug(`[RESOURCE] Failed to load ${tagName}:`, target);
          }
          event.preventDefault();
          return;
        }
        logger.warn(`[RESOURCE] Failed to load ${tagName}:`, target);
      }
    }
  }, true); // Use capture phase
  
  logger.info('[NETWORK] Error handler initialized', {
    production: IS_PRODUCTION,
    suppressNetworkErrors: IS_PRODUCTION
  });
}

// Cleanup function
export function cleanupNetworkErrorHandler(): void {
  window.removeEventListener('error', handleWindowError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
}

// Debug functions untuk development
export const networkErrorDebug = {
  // Force show network logs di production
  enableNetworkLogs: () => {
    updateForceNetworkLogs(true);
    logger.info('[DEBUG] Network error logging enabled');
  },

  // Disable network logs
  disableNetworkLogs: () => {
    updateForceNetworkLogs(false);
    logger.info('[DEBUG] Network error logging disabled');
  },
  
  // Test network error suppression
  testNetworkError: () => {
    console.error('Test: Fetch failed loading');
    console.warn('Test: Network error occurred');
    logger.info('[DEBUG] Network error test completed');
  },
  
  // Show current configuration
  showConfig: () => {
    logger.info('[DEBUG] Network error handler config:', {
      isProduction: IS_PRODUCTION,
      forceNetworkLogs: isForceNetworkLogsEnabled(),
      storageFallback: !storageAvailableForNetworkLogs,
      suppressedPatterns: NETWORK_ERROR_PATTERNS
    });
  }
};

// Export untuk debugging di development
if (!IS_PRODUCTION) {
  (window as any).networkErrorDebug = networkErrorDebug;
}