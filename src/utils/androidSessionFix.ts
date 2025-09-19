// Android-specific session persistence fixes
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Session, User } from '@supabase/supabase-js';

export interface AndroidSessionFixResult {
  success: boolean;
  shouldRetry?: boolean;
  requiresRelogin?: boolean;
  message?: string;
  session?: Session | null;
}

// Detect problematic Android conditions
export const detectProblematicAndroid = () => {
  const userAgent = navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  
  if (!isAndroid) return { isProblematic: false };

  // Detect conditions that cause session persistence issues
  const androidVersion = userAgent.match(/Android\s+([\d.]+)/i)?.[1];
  const chromeVersion = userAgent.match(/Chrome\/([\d.]+)/i)?.[1];
  
  const isProblematic = 
    // Old Android versions
    (androidVersion && parseFloat(androidVersion) < 8.0) ||
    // Old Chrome versions
    (chromeVersion && parseFloat(chromeVersion) < 85) ||
    // WebView issues
    userAgent.includes('wv') ||
    // Samsung Internet (known session issues)
    userAgent.includes('SamsungBrowser') ||
    // Other problematic browsers
    userAgent.includes('FB') || // Facebook in-app browser
    userAgent.includes('Instagram') ||
    userAgent.includes('TikTok');

  return {
    isProblematic,
    androidVersion,
    chromeVersion,
    browserIssues: {
      isWebView: userAgent.includes('wv'),
      isSamsungBrowser: userAgent.includes('SamsungBrowser'),
      isFacebookBrowser: userAgent.includes('FB'),
      isOldChrome: chromeVersion && parseFloat(chromeVersion) < 85,
      isOldAndroid: androidVersion && parseFloat(androidVersion) < 8.0
    }
  };
};

// Force session refresh with Android-specific handling
export const forceAndroidSessionRefresh = async (
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<AndroidSessionFixResult> => {
  const detection = detectProblematicAndroid();
  
  logger.info('Android: Forcing session refresh', { 
    detection, 
    maxRetries, 
    delayMs,
    timestamp: new Date().toISOString()
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.debug(`Android: Session refresh attempt ${attempt + 1}/${maxRetries}`);

      // Clear any potentially corrupted storage first
      try {
        // Clear potential corrupted auth state
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('supabase.auth.token') ||
            key.includes('auth-token') ||
            key.includes('sb-') ||
            key.includes('supabase.auth')
          )) {
            keysToRemove.push(key);
          }
        }
        
        if (keysToRemove.length > 0) {
          logger.debug('Android: Clearing potentially corrupted auth keys', keysToRemove);
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      } catch (storageError) {
        logger.debug('Android: Storage cleanup failed (expected)', storageError);
      }

      // Wait before retry (except first attempt)
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }

      // Try to get session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Android session timeout')), 10000)
      );

      const { data, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        logger.warn(`Android: Session refresh attempt ${attempt + 1} failed`, error);
        
        // If it's the last attempt, check if we should suggest relogin
        if (attempt === maxRetries - 1) {
          if (error.message?.includes('network') || error.message?.includes('timeout')) {
            return {
              success: false,
              shouldRetry: true,
              message: 'Network issue detected. Please check your connection and try again.'
            };
          } else {
            return {
              success: false,
              requiresRelogin: true,
              message: 'Session could not be refreshed. Please login again.'
            };
          }
        }
        continue;
      }

      const session = data?.session;
      
      if (session && session.user && session.user.id && session.user.id !== 'null') {
        // Validate session is not expired
        if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
          logger.warn('Android: Retrieved session is expired');
          continue;
        }

        // Validate essential session properties
        if (!session.access_token || !session.refresh_token) {
          logger.warn('Android: Retrieved session missing essential tokens');
          continue;
        }

        logger.success(`Android: Session refresh successful on attempt ${attempt + 1}`, {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at,
          hasAccessToken: !!session.access_token
        });

        return {
          success: true,
          session,
          message: `Session refreshed successfully (attempt ${attempt + 1})`
        };
      } else {
        logger.warn(`Android: Session refresh attempt ${attempt + 1} returned invalid session`, {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        });
      }
    } catch (error) {
      logger.error(`Android: Session refresh attempt ${attempt + 1} error`, error);
      
      // If it's the last attempt, return appropriate result
      if (attempt === maxRetries - 1) {
        return {
          success: false,
          requiresRelogin: true,
          message: 'Session refresh failed after multiple attempts. Please login again.'
        };
      }
    }
  }

  return {
    success: false,
    requiresRelogin: true,
    message: 'All session refresh attempts failed. Please login again.'
  };
};

// Android-specific session validation
export const validateAndroidSession = async (
  session: Session | null
): Promise<AndroidSessionFixResult> => {
  const detection = detectProblematicAndroid();
  
  if (!detection.isProblematic) {
    return { success: true, session };
  }

  logger.debug('Android: Validating session on problematic device', detection);

  if (!session) {
    logger.debug('Android: No session to validate');
    return { success: false, requiresRelogin: true, message: 'No session found' };
  }

  // Check session expiry
  if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
    logger.debug('Android: Session is expired');
    return { success: false, requiresRelogin: true, message: 'Session expired' };
  }

  // Check user validity
  if (!session.user || !session.user.id || session.user.id === 'null') {
    logger.debug('Android: Session has invalid user');
    return { success: false, requiresRelogin: true, message: 'Invalid user in session' };
  }

  // Check tokens
  if (!session.access_token || !session.refresh_token) {
    logger.debug('Android: Session missing tokens');
    return { success: false, requiresRelogin: true, message: 'Session missing tokens' };
  }

  // For problematic devices, try to validate session actually works
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || user.id !== session.user.id) {
      logger.debug('Android: Session validation failed', { error, userId: user?.id, sessionUserId: session.user.id });
      return { success: false, requiresRelogin: true, message: 'Session validation failed' };
    }

    logger.success('Android: Session validated successfully');
    return { success: true, session };
  } catch (error) {
    logger.error('Android: Session validation error', error);
    return { success: false, requiresRelogin: true, message: 'Session validation error' };
  }
};

// Android-specific storage cleanup
export const cleanupAndroidStorage = () => {
  const detection = detectProblematicAndroid();
  
  if (!detection.isProblematic) {
    return;
  }

  logger.info('Android: Cleaning up storage for problematic device', detection);

  try {
    // Clean localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('temp') ||
        key.includes('cache') ||
        key.includes('__test__') ||
        (key.startsWith('sb-') && key.includes('auth-token') && 
         localStorage.getItem(key) === 'null')
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        logger.debug(`Android: Removed problematic storage key: ${key}`);
      } catch (error) {
        logger.debug(`Android: Failed to remove key ${key}:`, error);
      }
    });

    // Clean sessionStorage
    try {
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('temp') || key.includes('cache'))) {
          sessionKeysToRemove.push(key);
        }
      }

      sessionKeysToRemove.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          logger.debug(`Android: Failed to remove session key ${key}:`, error);
        }
      });
    } catch (error) {
      logger.debug('Android: sessionStorage cleanup failed:', error);
    }

    logger.success('Android: Storage cleanup completed');
  } catch (error) {
    logger.debug('Android: Storage cleanup failed:', error);
  }
};

// Pre-login Android optimization
export const preOptimizeAndroidLogin = () => {
  const detection = detectProblematicAndroid();
  
  if (!detection.isProblematic) {
    return;
  }

  logger.info('Android: Pre-optimizing for login on problematic device');

  // Clean up storage
  cleanupAndroidStorage();

  // Pre-warm storage if needed
  try {
    localStorage.setItem('__android_login_test__', Date.now().toString());
    localStorage.removeItem('__android_login_test__');
  } catch (error) {
    logger.warn('Android: localStorage not available for optimization');
  }

  // Force garbage collection if available
  if ('gc' in window && detection.browserIssues.isOldAndroid) {
    try {
      (window as any).gc();
    } catch (error) {
      // Ignore - not available in production
    }
  }
};