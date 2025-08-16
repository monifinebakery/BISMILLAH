import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { withTimeout, withSoftTimeout } from '@/utils/asyncUtils';

// ✅ Import from authUtils untuk konsistensi
import { 
  validateAuthSession, 
  checkSessionExists, 
  refreshSessionSafely,
  debugAuthState,
  cleanupAuthState 
} from '@/lib/authUtils';

// ✅ Menggunakan fungsi yang sama dari authUtils
const detectDeviceCapabilities = () => {
  const capabilities = {
    hasLocalStorage: false,
    hasSessionStorage: false,
    networkType: 'unknown',
    isSlowDevice: false,
    userAgent: navigator.userAgent || 'unknown',
  };

  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    capabilities.hasLocalStorage = true;
  } catch {
    logger.warn('localStorage not available or restricted');
  }

  try {
    sessionStorage.setItem('__test__', 'test');
    sessionStorage.removeItem('__test__');
    capabilities.hasSessionStorage = true;
  } catch {
    logger.warn('sessionStorage not available or restricted');
  }

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    capabilities.networkType = connection.effectiveType || 'unknown';
  }

  const isSlowDevice = capabilities.userAgent.includes('Android 4') || 
                      capabilities.userAgent.includes('iPhone OS 10') ||
                      !capabilities.hasLocalStorage;
  capabilities.isSlowDevice = isSlowDevice;

  return capabilities;
};

// ✅ Adaptive timeout - sama dengan authUtils
const getAdaptiveTimeout = (baseTimeout = 15000) => {
  const capabilities = detectDeviceCapabilities();
  let timeout = baseTimeout;

  if (capabilities.isSlowDevice) {
    timeout *= 2;
    logger.debug('AuthContext: Slow device detected, doubling timeout:', timeout);
  }

  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
    timeout *= 3;
    logger.debug('AuthContext: Slow network detected, tripling timeout:', timeout);
  } else if (capabilities.networkType === '3g') {
    timeout *= 1.5;
    logger.debug('AuthContext: 3G network detected, increasing timeout:', timeout);
  }

  return Math.min(timeout, 60000); // Max 60 seconds - sama dengan authUtils
};

// ✅ User sanitization dengan validasi yang lebih ketat
const sanitizeUser = (user: User | null): User | null => {
  if (!user) {
    logger.debug('No user provided for sanitization');
    return null;
  }

  // ✅ Enhanced validation - sama dengan authUtils
  if (user.id === 'null' || user.id === 'undefined' || !user.id) {
    logger.error('AuthContext: Invalid user ID detected:', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
      fullUser: user,
    });
    return null;
  }

  // ✅ Validate user ID format - sama dengan authUtils
  if (typeof user.id !== 'string' || user.id.length < 10) {
    logger.error('AuthContext: Invalid user ID format:', {
      userId: user.id,
      userIdType: typeof user.id,
      userIdLength: user.id?.length || 0,
      email: user.email,
    });
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user.id)) {
    logger.error('AuthContext: Invalid UUID format in user.id:', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
    });
    return null;
  }

  logger.debug('AuthContext: User sanitization passed:', {
    userId: user.id,
    userIdType: typeof user.id,
    email: user.email,
  });

  return user;
};

// ✅ Session validation dengan expiry check
const validateSession = (session: Session | null): { session: Session | null; user: User | null } => {
  if (!session) {
    logger.debug('No session provided');
    return { session: null, user: null };
  }

  // ✅ Check session expiry - sama dengan authUtils
  if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
    logger.warn('AuthContext: Session expired during validation');
    return { session: null, user: null };
  }

  const sanitizedUser = sanitizeUser(session.user);
  if (!sanitizedUser) {
    logger.warn('AuthContext: Session has invalid user after sanitization', { userId: session.user?.id });
    return { session: null, user: null };
  }

  logger.debug('AuthContext: Session validated', { userId: sanitizedUser.id });
  return { session, user: sanitizedUser };
};

// ✅ Safe timeout wrapper yang konsisten dengan authUtils
const safeWithTimeout = async <T,>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage: string,
  retryCount = 0
): Promise<{ data: T | null; error: Error | null }> => {
  const maxRetries = 2;
  
  try {
    const result = await withTimeout(promise, timeoutMs, timeoutMessage);
    return { data: result, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.warn('AuthContext: Timeout or error in safeWithTimeout:', {
      timeoutMs,
      timeoutMessage,
      error: errorMessage,
      retryCount
    });

    // ✅ Retry logic untuk network errors - sama dengan authUtils
    if (retryCount < maxRetries && (
      errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('Failed to fetch')
    )) {
      logger.warn(`🔄 Network error detected, retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return safeWithTimeout(promise, timeoutMs, timeoutMessage, retryCount + 1);
    }
    
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  refreshUser: () => Promise<void>;
  triggerRedirectCheck: () => void;
  // ✅ Expose utility functions dari authUtils
  validateSession: () => Promise<boolean>;
  debugAuth: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const refreshUser = async () => {
    try {
      logger.context('AuthContext', 'Manual user refresh triggered');
      const adaptiveTimeout = getAdaptiveTimeout(10000);

      // ✅ FIX: Use safe timeout wrapper with retry
      const { data: sessionResult, error: timeoutError } = await safeWithTimeout(
        supabase.auth.getSession(),
        adaptiveTimeout,
        'AuthContext refresh timeout'
      );

      if (timeoutError) {
        logger.error('AuthContext refresh timeout/error:', timeoutError);
        
        // ✅ Fallback: coba gunakan refreshSessionSafely dari authUtils
        const refreshSuccess = await refreshSessionSafely();
        if (!refreshSuccess) {
          logger.warn('AuthContext: Both getSession and refreshSession failed');
          return;
        }
        
        // Retry setelah refresh
        const { data: retryResult } = await safeWithTimeout(
          supabase.auth.getSession(),
          adaptiveTimeout,
          'AuthContext refresh retry'
        );
        
        if (retryResult) {
          const { data: { session }, error } = retryResult as any;
          if (!error) {
            const { session: validSession, user: validUser } = validateSession(session);
            setSession(validSession);
            setUser(validUser);
            return;
          }
        }
        return;
      }

      const { data: { session }, error } = sessionResult as any;

      if (error) {
        logger.error('AuthContext refresh error:', error);
        return;
      }

      const { session: validSession, user: validUser } = validateSession(session);
      setSession(validSession);
      setUser(validUser);

      logger.context('AuthContext', 'Manual refresh completed:', {
        hasSession: !!validSession,
        hasValidUser: !!validUser,
        userEmail: validUser?.email || 'none',
        userId: validUser?.id || 'none',
      });
    } catch (error) {
      logger.error('AuthContext refresh failed:', error);
    }
  };

  const triggerRedirectCheck = () => {
    if (isReady && user && window.location.pathname === '/auth') {
      logger.info('AuthContext: Manual redirect trigger - user authenticated on auth page');
      window.location.href = '/';
    }
  };

  // ✅ Expose validateSession dari authUtils
  const validateSessionWrapper = async (): Promise<boolean> => {
    try {
      return await validateAuthSession();
    } catch (error) {
      logger.error('AuthContext: Error validating session:', error);
      return false;
    }
  };

  // ✅ Expose debugAuth dari authUtils
  const debugAuthWrapper = async () => {
    try {
      return await debugAuthState();
    } catch (error) {
      logger.error('AuthContext: Error debugging auth:', error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.context('AuthContext', 'Initializing auth...');
        const adaptiveTimeout = getAdaptiveTimeout(15000);
        logger.debug('AuthContext: Using adaptive timeout:', adaptiveTimeout);

        // ✅ Enhanced initialization dengan fallback
        const { data: sessionResult, error: timeoutError } = await safeWithTimeout(
          supabase.auth.getSession(),
          adaptiveTimeout,
          'Auth initialization timeout'
        );

        if (!mounted) return;

        if (timeoutError) {
          logger.error('AuthContext initialization timeout/error:', timeoutError);
          
          // ✅ Fallback strategy untuk slow devices
          const capabilities = detectDeviceCapabilities();
          if (capabilities.isSlowDevice || capabilities.networkType === '2g' || capabilities.networkType === '3g') {
            logger.warn('AuthContext: Slow device/network detected, trying checkSessionExists fallback...');
            
            const sessionExists = await checkSessionExists();
            if (sessionExists) {
              logger.info('AuthContext: Session exists via fallback, will wait for auth state change');
              // Don't set session to null, wait for onAuthStateChange
              setIsLoading(false);
              setIsReady(true);
              return;
            }
          }
          
          setSession(null);
          setUser(null);
          setIsLoading(false);
          setIsReady(true);
          return;
        }

        const { data: { session } } = sessionResult as any;
        const { session: validSession, user: validUser } = validateSession(session);
        
        logger.context('AuthContext', 'Initial session loaded and validated:', {
          hasSession: !!validSession,
          hasValidUser: !!validUser,
          userEmail: validUser?.email || 'none',
          userId: validUser?.id || 'none',
          originalSessionValid: !!session,
          wasUserSanitized: !!session?.user && !validUser,
          adaptiveTimeout,
        });

        setSession(validSession);
        setUser(validUser);

        // ✅ Handle invalid session - consistent dengan authUtils
        if (session && !validSession) {
          logger.warn('AuthContext: Invalid session detected, cleaning up...');
          try {
            cleanupAuthState(); // Gunakan dari authUtils
            await supabase.auth.signOut();
          } catch (signOutError) {
            logger.error('AuthContext: Failed to sign out invalid session:', signOutError);
          }
        }
      } catch (error) {
        logger.error('AuthContext initialization failed:', error);

        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
          logger.context('AuthContext', 'Auth initialization completed');
        }
      }
    };

    // ✅ Enhanced unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || '';
      if (reason.includes('Auth initialization timeout') || 
          reason.includes('AuthContext refresh timeout') ||
          reason.includes('Session validation timeout')) {
        logger.warn('AuthContext: Caught unhandled timeout promise rejection:', event.reason);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        logger.context('AuthContext', `Auth state changed: ${event}`, {
          hasSession: !!session,
          userEmail: session?.user?.email || 'none',
          userId: session?.user?.id || 'none',
          userIdType: typeof session?.user?.id,
          event,
          currentPath: window.location.pathname,
        });

        const { session: validSession, user: validUser } = validateSession(session);
        setSession(validSession);
        setUser(validUser);

        // ✅ Handle invalid session dalam auth state change
        if (session && !validSession) {
          logger.error('AuthContext: Auth state change contained invalid session/user, cleaning up');
          try {
            cleanupAuthState(); // Gunakan dari authUtils
            await supabase.auth.signOut();
            logger.info('AuthContext: Signed out due to invalid session');
          } catch (signOutError) {
            logger.error('AuthContext: Failed to sign out invalid session:', signOutError);
          }
          return;
        }

        logger.context('AuthContext', 'Auth state updated, letting AuthGuard handle navigation');
      }
    );

    return () => {
      mounted = false;
      logger.context('AuthContext', 'Cleaning up auth subscription');
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Expose debug values (development only)
    if (import.meta.env.DEV) {
      // @ts-ignore
      window.__DEBUG_AUTH_USER__ = user;
      // @ts-ignore
      window.__DEBUG_AUTH_READY__ = isReady;
      // @ts-ignore
      window.__DEBUG_AUTH_LOADING__ = isLoading;
      // @ts-ignore
      window.__DEBUG_AUTH_SESSION__ = session;
      // @ts-ignore - ✅ Expose authUtils functions
      window.__DEBUG_AUTH_VALIDATE__ = validateSessionWrapper;
      // @ts-ignore
      window.__DEBUG_AUTH_DEBUG__ = debugAuthWrapper;

      console.log('🔧 [AuthContext] Debug values set:', {
        user: !!user,
        userEmail: user?.email,
        userId: user?.id,
        isReady,
        isLoading,
        session: !!session,
      });
    }
  }, [user, isReady, isLoading, session]);

  useEffect(() => {
    if (import.meta.env.DEV && isReady) {
      logger.debug('AuthContext: Context value update:', {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id || 'none',
        userIdType: typeof user?.id,
        userEmail: user?.email || 'none',
        isLoading,
        isReady,
      });

      if (user?.id === 'null') {
        logger.error('🚨 AuthContext: STRING NULL DETECTED IN CONTEXT VALUE!');
        console.error('🚨 AuthContext: User with string null ID:', user);
      }
    }
  }, [session, user, isLoading, isReady]);

  const contextValue: AuthContextType = { 
    session, 
    user, 
    isLoading, 
    isReady,
    refreshUser,
    triggerRedirectCheck,
    validateSession: validateSessionWrapper,
    debugAuth: debugAuthWrapper,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};