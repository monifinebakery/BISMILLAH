import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { 
  detectSafariIOS, 
  getSafariTimeout, 
  safariAuthFallback,
  initSafariUtils,
  needsSafariWorkaround,
  logSafariInfo 
} from '@/utils/safariUtils';
import { clearPersistedQueryState } from '@/utils/queryPersistence';
import { queryClient } from '@/config/queryClient';

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

// ✅ FIXED: Consistent timeout untuk mobile dan desktop - TIDAK ADA DISKRIMINASI
const getAdaptiveTimeout = (baseTimeout = 12000) => { // ✅ SAME: Naikkan ke 12s untuk semua device
  const capabilities = detectDeviceCapabilities();
  const safariDetection = detectSafariIOS();
  
// ✅ FIXED: Consistent timeout untuk mobile dan desktop - TIDAK ADA DISKRIMINASI
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const mobileMultiplier = 1.0; // ✅ SAME: Persis sama untuk mobile dan desktop
  
  // ✅ FIXED: Safari-specific timeout yang lebih reasonable - TIDAK ADA DISKRIMINASI
  if (safariDetection.isSafariIOS) {
    // ✅ SAME: Safari timeout yang reasonable - sama seperti device lain
    const safariTimeout = getSafariTimeout(baseTimeout); // ✅ 100% dari base (tidak dipotong)
    const optimizedTimeout = Math.min(safariTimeout, maxTimeout); // ✅ Sama dengan max timeout
    logger.debug('Safari iOS: Using consistent timeout', { 
      original: safariTimeout, 
      optimized: optimizedTimeout,
      isMobile 
    });
    return optimizedTimeout;
  }
  
  let timeout = baseTimeout * mobileMultiplier;

  // ✅ FIXED: Same multiplier untuk device lambat - TIDAK ADA DISKRIMINASI
  if (capabilities.isSlowDevice) {
    timeout *= 2; // ✅ SAME: 100% increase untuk semua device
    logger.debug('AuthContext: Slow device detected, consistent timeout:', timeout);
  }

  // ✅ FIXED: Network-based timeout yang konsisten - TIDAK ADA DISKRIMINASI
  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
    timeout *= 3; // ✅ SAME: 200% increase untuk semua device
    logger.debug('AuthContext: Slow network detected, consistent timeout:', timeout);
  } else if (capabilities.networkType === '3g') {
    timeout *= 1.5; // ✅ SAME: 50% increase untuk semua device
    logger.debug('AuthContext: 3G network detected, consistent timeout:', timeout);
  }
  
  // ✅ FIXED: Max timeout sama untuk mobile dan desktop - TIDAK ADA DISKRIMINASI
  const maxTimeout = 30000; // ✅ SAME: 30s untuk semua device
  return Math.min(timeout, maxTimeout);
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
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  const refreshUser = async () => {
    try {
      logger.context('AuthContext', 'Manual user refresh triggered');
      const adaptiveTimeout = getAdaptiveTimeout(12000); // ✅ FIXED: Konsisten dengan timeout lain

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
      // SPA navigation to avoid full reload
      navigate('/', { replace: true });
    }
  };

  // ✅ MOBILE-OPTIMIZED: Non-blocking cache segregation per user
  useEffect(() => {
    const currentId = user?.id || null;
    const prevId = lastUserIdRef.current;
    if (prevId === null && currentId === null) return;
    if (prevId !== null && currentId !== null && prevId === currentId) return;

    // ⚡ IMMEDIATE: Update ref first to prevent UI blocking
    lastUserIdRef.current = currentId;

    // ⚡ NON-BLOCKING: Clear caches using requestIdleCallback atau setTimeout
    const clearCaches = async () => {
      try {
        // Clear React Query cache in chunks to avoid blocking
        const queries = queryClient.getQueryCache().getAll();
        const chunkSize = 50;
        
        for (let i = 0; i < queries.length; i += chunkSize) {
          const chunk = queries.slice(i, i + chunkSize);
          chunk.forEach(query => queryClient.removeQueries({ queryKey: query.queryKey }));
          
          // Yield to main thread setiap chunk
          if (i + chunkSize < queries.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        // Clear persisted state (non-blocking)
        clearPersistedQueryState(); // Remove await - let it run async
        
        logger.info('AuthContext: Non-blocking cache clear completed', { prevId, currentId });
      } catch (e) {
        logger.warn('AuthContext: Non-blocking cache clear failed', e);
      }
    };

    // ⚡ Use requestIdleCallback if available, fallback to setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => clearCaches(), { timeout: 2000 });
    } else {
      setTimeout(clearCaches, 100); // Small delay to let UI render first
    }
  }, [user?.id]);

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
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  useEffect(() => {
    let mounted = true;

    // ✅ Development bypass authentication
    const initializeAuth = async () => {
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
        logger.info('🔧 [DEV] Bypassing authentication with mock user');
        
        const mockUser: User = {
          id: import.meta.env.VITE_DEV_MOCK_USER_ID || 'dev-user-123',
          email: import.meta.env.VITE_DEV_MOCK_USER_EMAIL || 'dev@localhost.com',
          aud: 'authenticated',
          role: 'authenticated',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const mockSession: Session = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: mockUser
        };
        
        if (mounted) {
          setSession(mockSession);
          setUser(mockUser);
          setIsLoading(false);
          setIsReady(true);
        }
        
        logger.success('🔧 [DEV] Mock authentication initialized:', {
          userId: mockUser.id,
          email: mockUser.email
        });
        
        return;
      }

      try {
        logger.context('AuthContext', 'Initializing auth...');
        // ⚡ QUICK PATH: Try to get user fast to avoid long loaders on mobile
        try {
          const { data: quickUserResult } = await safeWithTimeout(
            supabase.auth.getUser(),
            1500,
            'AuthContext quick user timeout'
          );
          const quickUser = (quickUserResult as any)?.data?.user ?? (quickUserResult as any)?.user;
          if (mounted && quickUser) {
            const sanitized = sanitizeUser(quickUser);
            if (sanitized) {
              setUser(sanitized);
              setIsLoading(false);
              setIsReady(true);
              logger.debug('AuthContext: Quick user detected, rendering immediately');
            }
          }
        } catch (e) {
          logger.debug('AuthContext: Quick user not available');
        }
        
        const safariDetection = detectSafariIOS();
         
         // Use Safari-specific auth fallback if on Safari iOS
         if (safariDetection.isSafariIOS) {
           logger.warn('AuthContext: Safari iOS detected - using auth fallback strategy', {
             version: safariDetection.version,
             userAgent: safariDetection.userAgent,
             needsWorkaround: needsSafariWorkaround(),
             timestamp: new Date().toISOString()
           });
          
          const primaryAuth = async () => {
            const timeout = getSafariTimeout(15000);
            const { data: sessionResult, error } = await safeWithTimeout(
              supabase.auth.getSession(),
              timeout,
              'Safari iOS primary auth timeout'
            );
            
            if (error) throw error;
            return sessionResult;
          };
          
          const fallbackAuth = async () => {
             logger.warn('AuthContext: Using Safari iOS direct auth fallback');
             const result = await supabase.auth.getSession();
             if (result.error) throw result.error;
             return result;
           };
          
          try {
            const sessionResult = await safariAuthFallback(
              primaryAuth,
              fallbackAuth,
              getSafariTimeout(30000) // Increased timeout for Safari iOS
            );
            
            const { data: { session } } = sessionResult as any;
            const { session: validSession, user: validUser } = validateSession(session);
            
            if (mounted) {
              setSession(validSession);
              setUser(validUser);
              setIsLoading(false);
              setIsReady(true);
            }
            
            logger.success('AuthContext: Safari iOS auth fallback successful', {
               sessionExists: !!validSession,
               userExists: !!validUser,
               timestamp: new Date().toISOString()
             });
            return;
          } catch (safariError) {
             logger.error('AuthContext: Safari iOS auth fallback failed:', {
               error: safariError,
               errorMessage: safariError instanceof Error ? safariError.message : 'Unknown error',
               safariInfo: safariDetection,
               timestamp: new Date().toISOString()
             });
             
             // Log additional Safari info for debugging
             logSafariInfo();
             
             if (mounted) {
               setIsLoading(false);
               setIsReady(true);
             }
             return;
           }
        }
        
        const adaptiveTimeout = getAdaptiveTimeout(12000); // ✅ FIXED: Naikkan ke 12s untuk konsistensi
        
        // ✅ Get session first
        const { data: sessionResult, error: sessionError } = await safeWithTimeout(
          supabase.auth.getSession(),
          adaptiveTimeout,
          'AuthContext initialization timeout'
        );
        
        if (sessionError) {
          logger.error('AuthContext: Session fetch failed:', sessionError);
          
          // Safari iOS fallback is now handled above in the main flow
          
          // Set ready state even on error to prevent infinite loading
          if (mounted) {
            setIsLoading(false);
            setIsReady(true);
          }
          return;
        }
        
        const { data: { session: rawSession } } = sessionResult as any;
        const { session: validSession, user: validUser } = validateSession(rawSession);
        
        // ✅ Enhanced initialization dengan fallback
        logger.context('AuthContext', 'Auth initialization result:', {
          hasValidUser: !!validUser,
          userEmail: validUser?.email || 'none',
          userId: validUser?.id || 'none',
          originalSessionValid: !!rawSession,
          wasUserSanitized: !!rawSession?.user && !validUser,
          adaptiveTimeout,
        });

        setSession(validSession);
        setUser(validUser);

        // ✅ Handle invalid session - consistent dengan authUtils
        if (rawSession && !validSession) {
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
    // Listen for manual refresh requests (e.g., after OTP verify)
    const handleAuthRefreshRequest = () => {
      if (!mounted) return;
      logger.debug('AuthContext: Received auth-refresh-request event');
      refreshUser();
    };
    window.addEventListener('auth-refresh-request', handleAuthRefreshRequest as any);

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

        // Clear OTP grace flag once authenticated
        if (validUser) {
          try { localStorage.removeItem('otpVerifiedAt'); } catch {}
        }

        // 🔁 Redirect dari halaman auth jika user sudah terautentikasi (SPA)
        if (validUser && window.location.pathname === '/auth') {
          logger.info('AuthContext: Redirecting authenticated user from /auth to / (SPA)');
          navigate('/', { replace: true });
        }
      }
    );

    return () => {
      mounted = false;
      logger.context('AuthContext', 'Cleaning up auth subscription');
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('auth-refresh-request', handleAuthRefreshRequest as any);
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
