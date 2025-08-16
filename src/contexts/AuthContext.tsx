import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { withTimeout, withSoftTimeout } from '@/utils/asyncUtils';

// Device capability detection
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

// Adaptive timeout for AuthContext
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

  return Math.min(timeout, 45000); // Max 45 seconds
};

// User object sanitization
const sanitizeUser = (user: User | null): User | null => {
  if (!user) {
    logger.debug('No user provided for sanitization');
    return null;
  }

  if (user.id === 'null' || user.id === 'undefined' || !user.id) {
    logger.error('AuthContext: Invalid user ID detected:', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
      fullUser: user,
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

// Session validation
const validateSession = (session: Session | null): { session: Session | null; user: User | null } => {
  if (!session) {
    logger.debug('No session provided');
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

// ✅ FIX: Safe timeout wrapper that handles promise rejections
const safeWithTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage: string
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const result = await withTimeout(promise, timeoutMs, timeoutMessage);
    return { data: result, error: null };
  } catch (error) {
    logger.warn('AuthContext: Timeout or error in safeWithTimeout:', {
      timeoutMs,
      timeoutMessage,
      error: error instanceof Error ? error.message : String(error)
    });
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

      // ✅ FIX: Use safe timeout wrapper
      const { data: sessionResult, error: timeoutError } = await safeWithTimeout(
        supabase.auth.getSession(),
        adaptiveTimeout,
        'AuthContext refresh timeout'
      );

      if (timeoutError) {
        logger.error('AuthContext refresh timeout/error:', timeoutError);
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.context('AuthContext', 'Initializing auth...');
        const adaptiveTimeout = getAdaptiveTimeout(15000);
        logger.debug('AuthContext: Using adaptive timeout:', adaptiveTimeout);

        // ✅ FIX: Use safe timeout wrapper to prevent unhandled promise rejection
        const { data: sessionResult, error: timeoutError } = await safeWithTimeout(
          supabase.auth.getSession(),
          adaptiveTimeout,
          'Auth initialization timeout'
        );

        if (!mounted) return;

        if (timeoutError) {
          logger.error('AuthContext initialization timeout/error:', timeoutError);
          
          // ✅ Handle timeout gracefully
          const capabilities = detectDeviceCapabilities();
          if (capabilities.isSlowDevice || capabilities.networkType === '2g' || capabilities.networkType === '3g') {
            logger.warn('AuthContext: Mobile device timeout detected, allowing graceful fallback');
          }
          
          setSession(null);
          setUser(null);
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

        if (session && !validSession) {
          logger.warn('AuthContext: Invalid session detected, signing out...');
          try {
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

    // ✅ FIX: Add error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Auth initialization timeout') || 
          event.reason?.message?.includes('AuthContext refresh timeout')) {
        logger.warn('AuthContext: Caught unhandled timeout promise rejection:', event.reason);
        event.preventDefault(); // Prevent the error from being logged as unhandled
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

        if (session && !validSession) {
          logger.error('AuthContext: Auth state change contained invalid session/user, nullified');
          try {
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