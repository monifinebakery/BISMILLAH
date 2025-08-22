// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { withExponentialBackoff } from '@/utils/asyncUtils';
import { AuthErrorHandler, handleAuthError } from '@/utils/authErrorHandler';

// ✅ Import dari authUtils
import { 
  validateAuthSession, 
  checkSessionExists, 
  refreshSessionSafely,
  debugAuthState,
  cleanupAuthState 
} from '@/lib/authUtils';

// ================================
// Device capabilities & timeouts
// ================================
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

const getAdaptiveTimeout = (baseTimeout = 30000) => {
  const capabilities = detectDeviceCapabilities();
  let timeout = baseTimeout;

  if (capabilities.isSlowDevice) timeout *= 2;
  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') timeout *= 3;
  else if (capabilities.networkType === '3g') timeout *= 1.5;

  return Math.min(timeout, 60000);
};

// ================================
// Helpers & guards
// ================================
const sanitizeUser = (user: User | null): User | null => {
  if (!user) return null;

  if (user.id === 'null' || user.id === 'undefined' || !user.id) {
    logger.error('AuthContext: Invalid user ID detected', { userId: user.id, email: user.email });
    return null;
  }
  if (typeof user.id !== 'string' || user.id.length < 10) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user.id)) return null;

  return user;
};

const validateSession = (session: Session | null): { session: Session | null; user: User | null } => {
  if (!session) return { session: null, user: null };
  if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
    logger.warn('AuthContext: Session expired during validation');
    return { session: null, user: null };
  }
  const sanitizedUser = sanitizeUser(session.user);
  if (!sanitizedUser) return { session: null, user: null };
  return { session, user: sanitizedUser };
};

// ================================
// safeWithTimeout (tetap sama)
// ================================
const safeWithTimeout = async <T,>(
  promiseFn: () => Promise<T>, 
  timeoutMs: number, 
  _timeoutMessage: string,
  retryCount = 0
): Promise<{ data: T | null; error: Error | null }> => {
  const maxRetries = 2;
  try {
    const result = await withExponentialBackoff(promiseFn, maxRetries, 1000, timeoutMs);
    return { data: result, error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      retryCount < maxRetries &&
      (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('Failed to fetch'))
    ) {
      await new Promise(r => setTimeout(r, (retryCount + 1) * 2000));
      return safeWithTimeout(promiseFn, timeoutMs, _timeoutMessage, retryCount + 1);
    }
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

// ================================
// Context
// ================================
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  refreshUser: () => Promise<void>;
  triggerRedirectCheck: () => void;
  validateSession: () => Promise<boolean>;
  debugAuth: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isReady, setReady]     = useState(false);

  // -------- refreshUser (FIXED) --------
  const refreshUser = async () => {
    try {
      logger.context('AuthContext', 'Manual user refresh triggered');
      const adaptiveTimeout = getAdaptiveTimeout(10000);

      const { data: sessionResp, error: timeoutError } = await safeWithTimeout(
        () => supabase.auth.getSession(),
        adaptiveTimeout,
        'AuthContext refresh timeout'
      );

      if (timeoutError) {
        logger.error('AuthContext refresh timeout/error:', timeoutError);

        const wasHandled = await handleAuthError(timeoutError);
        if (wasHandled) return;

        const refreshed = await refreshSessionSafely();
        if (!refreshed) return;

        const { data: retryResp } = await safeWithTimeout(
          () => supabase.auth.getSession(),
          adaptiveTimeout,
          'AuthContext refresh retry'
        );

        if (retryResp) {
          // ✅ Ambil session dari level yang benar
          const { data: { session }, error } = retryResp as {
            data: { session: Session | null }, error: any
          };
          if (!error) {
            const { session: validSession, user: validUser } = validateSession(session);
            setSession(validSession);
            setUser(validUser);
          }
        }
        return;
      }

      if (!sessionResp) return;

      // ✅ Ambil session dari level yang benar
      const { data: { session }, error } = sessionResp as {
        data: { session: Session | null }, error: any
      };
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
    logger.info('AuthContext: Manual redirect trigger called', {
      isReady,
      hasUser: !!user,
      currentPath: window.location.pathname
    });
    
    if (isReady && user && window.location.pathname === '/auth') {
      window.location.href = '/';
    }
  };

  const validateSessionWrapper = async (): Promise<boolean> => {
    try { return await validateAuthSession(); }
    catch (e) { logger.error('AuthContext: Error validating session:', e); return false; }
  };

  const debugAuthWrapper = async () => {
    try { return await debugAuthState(); }
    catch (e) { logger.error('AuthContext: Error debugging auth:', e); return { error: e instanceof Error ? e.message : String(e) }; }
  };

  // -------- initializeAuth (FIXED) --------
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.context('AuthContext', 'Initializing auth...');
        const adaptiveTimeout = getAdaptiveTimeout(15000);

        const { data: sessionResp, error: timeoutError } = await safeWithTimeout(
          () => supabase.auth.getSession(),
          adaptiveTimeout,
          'Auth initialization timeout'
        );

        if (!mounted) return;

        if (timeoutError) {
          logger.error('AuthContext initialization timeout/error:', timeoutError);

          const wasHandled = await handleAuthError(timeoutError);
          if (wasHandled) {
            setSession(null); setUser(null); setLoading(false); setReady(true); return;
          }

          const caps = detectDeviceCapabilities();
          if (caps.isSlowDevice || caps.networkType === '2g' || caps.networkType === '3g') {
            const exists = await checkSessionExists();
            if (exists) { setLoading(false); setReady(true); return; }
          }

          setSession(null); setUser(null); setLoading(false); setReady(true);
          return;
        }

        if (!sessionResp) {
          setSession(null); setUser(null);
        } else {
          // ✅ Ambil session dari level yang benar
          const { data: { session } } = sessionResp as { data: { session: Session | null } };
          const { session: validSession, user: validUser } = validateSession(session);

          logger.context('AuthContext', 'Initial session validated', {
            hasSession: !!validSession,
            hasValidUser: !!validUser,
            userEmail: validUser?.email || 'none',
            userId: validUser?.id || 'none',
            adaptiveTimeout,
          });

          setSession(validSession);
          setUser(validUser);

          if (session && !validSession) {
            try { cleanupAuthState(); await supabase.auth.signOut(); }
            catch (e) { logger.error('AuthContext: Failed to sign out invalid session:', e); }
          }
        }
      } catch (error) {
        logger.error('AuthContext initialization failed:', error);
        if (mounted) { setSession(null); setUser(null); }
      } finally {
        if (mounted) { setLoading(false); setReady(true); }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || '';
      if (
        reason.includes('Auth initialization timeout') || 
        reason.includes('AuthContext refresh timeout') ||
        reason.includes('Session validation timeout')
      ) {
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
        });

        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          try {
            const ok = await AuthErrorHandler.attemptSessionRecovery();
            if (!ok && !session) { setSession(null); setUser(null); return; }
          } catch (recoveryError) {
            logger.error('Error during session recovery:', recoveryError);
            await handleAuthError(recoveryError);
          }
        }

        const { session: validSession, user: validUser } = validateSession(session);
        setSession(validSession);
        setUser(validUser);

        if (session && !validSession) {
          try { cleanupAuthState(); await supabase.auth.signOut(); }
          catch (e) { logger.error('AuthContext: Failed to sign out invalid session:', e); }
          return;
        }

        if (event === 'SIGNED_IN' && validUser && window.location.pathname === '/auth') {
          window.location.href = '/';
        }
      }
    );

    return () => {
      mounted = false;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      subscription.unsubscribe();
    };
  }, []);

  // -------- dev aids --------
  useEffect(() => {
    if (import.meta.env.DEV) {
      // @ts-ignore
      window.__DEBUG_AUTH_USER__ = user;
      // @ts-ignore
      window.__DEBUG_AUTH_READY__ = isReady;
      // @ts-ignore
      window.__DEBUG_AUTH_LOADING__ = isLoading;
      // @ts-ignore
      window.__DEBUG_AUTH_SESSION__ = session;
      // @ts-ignore
      window.__DEBUG_AUTH_VALIDATE__ = validateSessionWrapper;
      // @ts-ignore
      window.__DEBUG_AUTH_DEBUG__ = debugAuthWrapper;
    }
  }, [user, isReady, isLoading, session]);

  useEffect(() => {
    if (import.meta.env.DEV && isReady) {
      logger.debug('AuthContext: Context value update:', {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id || 'none',
        userEmail: user?.email || 'none',
        isLoading,
        isReady,
      });
      if (user?.id === 'null') console.error(' AuthContext: User with string null ID:', user);
    }
  }, [session, user, isLoading, isReady]);

  const contextValue: AuthContextType = { 
    session, user, isLoading, isReady,
    refreshUser,
    triggerRedirectCheck,
    validateSession: validateSessionWrapper,
    debugAuth: debugAuthWrapper,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};