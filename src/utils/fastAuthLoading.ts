// Fast authentication loading optimizations
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export interface FastAuthResult {
  session: Session | null;
  loadTime: number;
  source: 'cache' | 'fresh' | 'timeout';
  success: boolean;
  error?: string;
}

// Cache for very fast initial loading
let sessionCache: {
  session: Session | null;
  timestamp: number;
  validated: boolean;
} | null = null;

const FAST_CACHE_DURATION = 5000; // 5 seconds cache for speed

// Mobile-specific performance improvements
export const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isSlowMobileDevice = (): boolean => {
  const ua = navigator.userAgent;
  return (
    // Old Android versions
    /Android [1-7]\./.test(ua) ||
    // Old iOS versions
    /iPhone OS [1-9]_/.test(ua) ||
    // Known slow devices
    /SM-J[1-3]/.test(ua) || // Samsung Galaxy J series
    /SM-A[0-2]/.test(ua) || // Some Samsung A series
    // WebView browsers (often slower)
    ua.includes('wv') ||
    ua.includes('FB') || // Facebook
    ua.includes('Instagram')
  );
};

// Pre-warm authentication (call this early in app lifecycle)
export const preWarmAuth = async (): Promise<void> => {
  if (!isMobileDevice()) {
    return; // Only optimize for mobile
  }

  try {
    logger.debug('FastAuth: Pre-warming authentication...');
    
    // Start the session fetch early (don't await)
    const sessionPromise = supabase.auth.getSession();
    
    // For slow devices, give less time
    const timeout = isSlowMobileDevice() ? 3000 : 2000;
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Pre-warm timeout')), timeout)
    );

    try {
      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (!error && data?.session) {
        sessionCache = {
          session: data.session,
          timestamp: Date.now(),
          validated: false
        };
        logger.success('FastAuth: Pre-warm successful', {
          userId: data.session.user?.id?.substring(0, 8) + '...',
          cached: true
        });
      }
    } catch (preWarmError) {
      logger.debug('FastAuth: Pre-warm failed (non-critical)', preWarmError);
      // Continue in background
      sessionPromise.then(({ data, error }) => {
        if (!error && data?.session) {
          sessionCache = {
            session: data.session,
            timestamp: Date.now(),
            validated: false
          };
          logger.debug('FastAuth: Background pre-warm completed');
        }
      }).catch(() => {
        // Ignore background errors
      });
    }
  } catch (error) {
    logger.debug('FastAuth: Pre-warm setup failed', error);
  }
};

// Fast session retrieval with progressive enhancement
export const getFastSession = async (
  maxWaitMs: number = 2000
): Promise<FastAuthResult> => {
  const startTime = Date.now();
  
  // First, check cache for instant loading
  if (sessionCache && (Date.now() - sessionCache.timestamp) < FAST_CACHE_DURATION) {
    logger.debug('FastAuth: Returning cached session (instant)');
    
    // Start background validation but don't wait for it
    if (!sessionCache.validated) {
      validateCachedSessionInBackground();
    }
    
    return {
      session: sessionCache.session,
      loadTime: Date.now() - startTime,
      source: 'cache',
      success: true
    };
  }

  // For mobile devices, use progressive loading
  if (isMobileDevice()) {
    const mobileTimeout = isSlowMobileDevice() ? maxWaitMs * 1.5 : maxWaitMs;
    
    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Mobile auth timeout')), mobileTimeout)
      );

      const { data, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      const loadTime = Date.now() - startTime;
      
      if (error) {
        return {
          session: null,
          loadTime,
          source: 'timeout',
          success: false,
          error: error.message
        };
      }

      // Update cache
      sessionCache = {
        session: data.session,
        timestamp: Date.now(),
        validated: true
      };

      logger.success('FastAuth: Fresh session loaded', {
        loadTime: `${loadTime}ms`,
        hasSession: !!data.session
      });

      return {
        session: data.session,
        loadTime,
        source: 'fresh',
        success: true
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      logger.warn('FastAuth: Mobile session fetch failed', {
        error: error instanceof Error ? error.message : 'Unknown',
        loadTime: `${loadTime}ms`
      });
      
      return {
        session: null,
        loadTime,
        source: 'timeout',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Desktop fallback - standard approach
  try {
    const { data, error } = await supabase.auth.getSession();
    const loadTime = Date.now() - startTime;
    
    if (error) {
      return {
        session: null,
        loadTime,
        source: 'fresh',
        success: false,
        error: error.message
      };
    }

    return {
      session: data.session,
      loadTime,
      source: 'fresh',
      success: true
    };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    return {
      session: null,
      loadTime,
      source: 'timeout',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Background validation of cached session
const validateCachedSessionInBackground = async (): Promise<void> => {
  if (!sessionCache) return;

  try {
    // Check if session is still valid
    if (sessionCache.session?.expires_at && 
        sessionCache.session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.debug('FastAuth: Cached session expired, clearing cache');
      sessionCache = null;
      return;
    }

    // Try to validate with getUser() call
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || user.id !== sessionCache.session?.user?.id) {
      logger.debug('FastAuth: Cached session validation failed, clearing cache');
      sessionCache = null;
    } else {
      sessionCache.validated = true;
      logger.debug('FastAuth: Cached session validated successfully');
    }
  } catch (error) {
    logger.debug('FastAuth: Background validation failed', error);
    // Don't clear cache on network errors
  }
};

// Clear cache (useful for logout)
export const clearFastAuthCache = (): void => {
  logger.debug('FastAuth: Clearing session cache');
  sessionCache = null;
};

// Get cache info for debugging
export const getFastAuthCacheInfo = () => {
  if (!sessionCache) {
    return { cached: false };
  }

  const age = Date.now() - sessionCache.timestamp;
  return {
    cached: true,
    ageMs: age,
    ageSeconds: Math.round(age / 1000),
    validated: sessionCache.validated,
    userId: sessionCache.session?.user?.id?.substring(0, 8) + '...',
    expiresAt: sessionCache.session?.expires_at,
    isValid: age < FAST_CACHE_DURATION
  };
};

// Mobile-specific optimizations
export const optimizeMobileAuth = (): void => {
  if (!isMobileDevice()) {
    return;
  }

  logger.debug('FastAuth: Applying mobile optimizations');

  // Reduce network timeout for mobile
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    // Only apply to Supabase auth endpoints
    const url = input instanceof Request ? input.url : input.toString();
    if (url.includes('supabase') && url.includes('auth')) {
      const mobileTimeout = isSlowMobileDevice() ? 8000 : 5000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), mobileTimeout);
      
      const enhancedInit = {
        ...init,
        signal: controller.signal
      };
      
      return originalFetch.call(this, input, enhancedInit).finally(() => {
        clearTimeout(timeoutId);
      });
    }
    
    return originalFetch.call(this, input, init);
  };

  // Pre-warm storage for faster access
  try {
    localStorage.setItem('__mobile_auth_test__', 'test');
    localStorage.removeItem('__mobile_auth_test__');
  } catch (error) {
    logger.debug('FastAuth: localStorage not available');
  }
};

// Initialize fast auth optimizations
export const initializeFastAuth = (): void => {
  if (isMobileDevice()) {
    logger.info('FastAuth: Initializing mobile auth optimizations', {
      isMobile: true,
      isSlowDevice: isSlowMobileDevice(),
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    });
    
    optimizeMobileAuth();
    
    // Pre-warm with delay to not block initial render
    setTimeout(() => {
      preWarmAuth();
    }, 100);
  }
};

// Progressive loading states for better UX
export const getProgressiveLoadingMessage = (elapsedMs: number): string => {
  if (elapsedMs < 1000) {
    return 'Memuat...';
  } else if (elapsedMs < 3000) {
    return 'Memverifikasi sesi...';
  } else if (elapsedMs < 5000) {
    return 'Mengoptimalkan koneksi...';
  } else if (elapsedMs < 8000) {
    return 'Hampir siap...';
  } else {
    return 'Memproses koneksi...';
  }
};