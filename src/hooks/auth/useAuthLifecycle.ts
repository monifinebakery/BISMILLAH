// src/hooks/auth/useAuthLifecycle.ts - Auth Lifecycle and Initialization
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { debounce } from '@/utils';
import { 
  getAdaptiveTimeout, 
  safeWithTimeout 
} from '@/contexts/auth/helpers';
import { validateSession } from '@/utils/auth/sessionValidation';
import { 
  cleanupAuthState,
  refreshSessionSafely 
} from '@/lib/authUtils';
import {
  detectSafariIOS,
  getSafariTimeout,
  logSafariInfo,
  needsSafariWorkaround,
  safariAuthFallback,
} from '@/utils/safariUtils';
import { safeStorageRemove } from '@/utils/auth/safeStorage'; // ✅ FIX: Thread-safe storage
import {
  detectProblematicAndroid,
  forceAndroidSessionRefresh,
  validateAndroidSession,
  preOptimizeAndroidLogin,
  cleanupAndroidStorage,
} from '@/utils/androidSessionFix';

type GetSessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;

interface AuthLifecycleParams {
  refreshUser: () => Promise<void>;
  updateSession: (session: Session | null) => void;
  updateUser: (user: User | null) => void;
  updateAuthState: (session: Session | null, user: User | null) => void; // ✅ NEW: Atomic update
  updateLoadingState: (loading: boolean) => void;
  updateReadyState: (ready: boolean) => void;
  sessionRef: React.MutableRefObject<Session | null>;
  userRef: React.MutableRefObject<User | null>;
}

export const useAuthLifecycle = ({
  refreshUser,
  updateSession,
  updateUser,
  updateAuthState, // ✅ NEW: Atomic update method
  updateLoadingState,
  updateReadyState,
  sessionRef,
  userRef,
}: AuthLifecycleParams) => {
  const navigate = useNavigate();
  
  // Refs for dedupe/throttle & in-flight flags
  const lastEventRef = useRef<{ userId?: string; event?: string; ts: number }>({
    ts: 0,
  });
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // ✅ FIX: Stabilize callback references
  const stableRefreshUser = useCallback(() => refreshUser(), [refreshUser]);
  const stableNavigate = useCallback(
    (path: string, options?: { replace?: boolean }) => navigate(path, options),
    [navigate],
  );

  // ❌ DISABLED: Navigation handled by AuthGuard to prevent race conditions
  // const debouncedNavigate = useMemo(
  //   () =>
  //     debounce((path: string) => {
  //       if (window.location.pathname !== path) {
  //         stableNavigate(path, { replace: true });
  //       }
  //     }, 100),
  //   [stableNavigate],
  // );

  const triggerRedirectCheck = useCallback(() => {
    // ✅ FIXED: Let AuthGuard handle navigation to prevent race conditions
    if (userRef.current && window.location.pathname === "/auth") {
      logger.info(
        "AuthContext: Manual redirect trigger requested - delegating to AuthGuard",
      );
      // Don't navigate directly - let AuthGuard handle it
      // This prevents competing navigation mechanisms
    }
  }, []);

  // ✅ FIX: Stabilize auth state change handler outside useEffect
  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      if (!mountedRef.current) return;

      // Throttle/dedupe repeated events from Supabase
      const nowTs = Date.now();
      const sameUser =
        !!session?.user?.id && session.user.id === lastEventRef.current.userId;
      const sameEvent = event === lastEventRef.current.event;
      const tooSoon = nowTs - lastEventRef.current.ts < 800; // 0.8s window
      
      // Don't dedupe SIGNED_IN events as they're critical for login flow
      if (sameUser && sameEvent && tooSoon && event !== 'SIGNED_IN') {
        logger.debug("AuthContext: Dedupe auth state event", { event });
        return;
      }

      logger.context("AuthContext", `Auth state changed: ${event}`, {
        hasSession: !!session,
        userEmail: session?.user?.email || "none",
        userId: session?.user?.id || "none",
        userIdType: typeof session?.user?.id,
        event,
        currentPath: window.location.pathname,
      });

      const { session: validSession, user: validUser } =
        validateSession(session);

      // ✅ FIX: Use atomic update to prevent race conditions
      updateAuthState(validSession, validUser);

      // Remember last processed event signature
      lastEventRef.current = {
        userId: validUser?.id ?? session?.user?.id,
        event,
        ts: nowTs,
      };

      if (session && !validSession) {
        logger.error(
          "AuthContext: Auth state change contained invalid session/user, cleaning up",
        );
        try {
          cleanupAuthState();
          await supabase.auth.signOut();
          logger.info("AuthContext: Signed out due to invalid session");
        } catch (signOutError) {
          logger.error(
            "AuthContext: Failed to sign out invalid session",
            signOutError,
          );
        }
        return;
      }

      logger.context(
        "AuthContext",
        "Auth state updated, checking for redirect",
        { currentPath: window.location.pathname, hasValidUser: !!validUser },
      );

      if (validUser) {
        try {
          await safeStorageRemove("otpVerifiedAt"); // ✅ FIX: Thread-safe removal
        } catch (storageError) {
          logger.warn("AuthContext: Failed to clear OTP flag", storageError);
        }
      }

      // ✅ FIXED: Let AuthGuard handle navigation to prevent race conditions
      if (validUser && window.location.pathname === "/auth") {
        logger.debug(
          "AuthContext: User authenticated on auth page - delegating navigation to AuthGuard"
        );
        // Don't navigate here - AuthGuard will handle it through useEffect
        // This prevents race conditions between AuthContext and AuthGuard
      }
    },
    [updateAuthState, sessionRef, userRef], // ✅ FIX: Use atomic update in dependencies
  );

  // Main initialization effect
  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      if (
        import.meta.env.DEV &&
        import.meta.env.VITE_DEV_BYPASS_AUTH === "true"
      ) {
        logger.info("🔧 [DEV] Bypassing authentication with mock user");

        const nowIso = new Date().toISOString();
        const mockUser: User = {
          id: import.meta.env.VITE_DEV_MOCK_USER_ID || "dev-user-123",
          email:
            import.meta.env.VITE_DEV_MOCK_USER_EMAIL || "dev@localhost.com",
          aud: "authenticated",
          role: "authenticated",
          email_confirmed_at: nowIso,
          phone: "",
          confirmed_at: nowIso,
          last_sign_in_at: nowIso,
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: nowIso,
          updated_at: nowIso,
        };

        const mockSession: Session = {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: "bearer",
          user: mockUser,
        };

        if (mountedRef.current) {
          updateAuthState(mockSession, mockUser); // ✅ FIX: Atomic update
          updateLoadingState(false);
          updateReadyState(true);
        }

        logger.success("🔧 [DEV] Mock authentication initialized", {
          userId: mockUser.id,
          email: mockUser.email,
        });
        return;
      }

      try {
        logger.context("AuthContext", "Initializing auth...");

        // Android-specific pre-optimization
        const androidDetection = detectProblematicAndroid();
        if (androidDetection.isProblematic) {
          logger.warn(
            "AuthContext: Problematic Android device detected",
            androidDetection,
          );
          preOptimizeAndroidLogin();

          // Try Android-specific session refresh first
          try {
            const androidResult = await forceAndroidSessionRefresh(2, 1500);
            if (androidResult.success && androidResult.session) {
              const { session: validSession, user: validUser } =
                validateSession(androidResult.session);

              if (mountedRef.current && validSession && validUser) {
                updateAuthState(validSession, validUser); // ✅ FIX: Atomic update
                updateLoadingState(false);
                updateReadyState(true);

                logger.success("AuthContext: Android session fix successful", {
                  userId: validUser.id,
                  email: validUser.email,
                });
                return;
              }
            } else if (androidResult.requiresRelogin) {
              logger.warn(
                "AuthContext: Android session fix requires relogin",
                androidResult.message,
              );
              // Continue with normal flow to show login
            }
          } catch (androidError) {
            logger.error(
              "AuthContext: Android session fix failed",
              androidError,
            );
            // Continue with normal flow
          }
        }

        const safariDetection = detectSafariIOS();
        if (safariDetection.isSafariIOS) {
          logger.warn(
            "AuthContext: Safari iOS detected - using auth fallback strategy",
            {
              version: safariDetection.version,
              userAgent: safariDetection.userAgent,
              needsWorkaround: needsSafariWorkaround(),
              timestamp: new Date().toISOString(),
            },
          );

          const primaryAuth = async () => {
            const timeout = getSafariTimeout(15000);
            const { data, error } = await safeWithTimeout(
              () => supabase.auth.getSession(),
              {
                timeoutMs: timeout,
                timeoutMessage: "Safari iOS primary auth timeout",
              },
            );

            if (error || !data) {
              throw error ?? new Error("Unknown error fetching session");
            }

            return data;
          };

          const fallbackAuth = async () => {
            logger.warn("AuthContext: Using Safari iOS direct auth fallback");
            const result = await supabase.auth.getSession();
            if (result.error) {
              throw result.error;
            }
            return result;
          };

          try {
            const sessionResult = await safariAuthFallback(
              primaryAuth,
              fallbackAuth,
              getSafariTimeout(30000),
            );

            const {
              data: { session },
            } = sessionResult as GetSessionResult;
            const { session: validSession, user: validUser } =
              validateSession(session);

            if (mountedRef.current) {
              updateAuthState(validSession, validUser); // ✅ FIX: Atomic update
              updateLoadingState(false);
              updateReadyState(true);
            }

            logger.success("AuthContext: Safari iOS auth fallback successful", {
              sessionExists: !!validSession,
              userExists: !!validUser,
              timestamp: new Date().toISOString(),
            });
            return;
          } catch (safariError) {
            logger.error("AuthContext: Safari iOS auth fallback failed", {
              error: safariError,
              errorMessage:
                safariError instanceof Error
                  ? safariError.message
                  : "Unknown error",
              safariInfo: safariDetection,
              timestamp: new Date().toISOString(),
            });

            logSafariInfo();

            if (mountedRef.current) {
              updateLoadingState(false);
              updateReadyState(true);
            }
            return;
          }
        }

        const MAX_SESSION_ATTEMPTS = 2;
        const BASE_RETRY_DELAY_MS = 1500;

        const fetchSessionWithRetry = async (): Promise<{
          result: GetSessionResult | null;
          error: Error | null;
          attempts: number;
        }> => {
          let lastError: Error | null = null;

          for (
            let attempt = 0;
            attempt < MAX_SESSION_ATTEMPTS && mountedRef.current;
            attempt++
          ) {
            const adaptiveTimeout = getAdaptiveTimeout(15000);
            const { data, error } = await safeWithTimeout(
              () => supabase.auth.getSession(),
              {
                timeoutMs: adaptiveTimeout,
                timeoutMessage: "AuthContext initialization timeout",
                retryCount: attempt,
              },
            );

            if (data && !error) {
              return {
                result: data as GetSessionResult,
                error: null,
                attempts: attempt + 1,
              };
            }

            lastError = error ?? new Error("Unknown session fetch error");

            logger.warn("AuthContext: Session fetch attempt failed", {
              attempt,
              remainingAttempts: MAX_SESSION_ATTEMPTS - attempt - 1,
              error: lastError.message,
            });

            if (!mountedRef.current || attempt >= MAX_SESSION_ATTEMPTS - 1) {
              break;
            }

            const refreshed = await refreshSessionSafely();
            if (refreshed) {
              logger.debug(
                "AuthContext: refreshSessionSafely succeeded before retry",
                {
                  attempt,
                },
              );
            }

            const backoff = Math.min(5000, BASE_RETRY_DELAY_MS * (attempt + 1));
            await new Promise((resolve) => setTimeout(resolve, backoff));
          }

          return {
            result: null,
            error: lastError,
            attempts: MAX_SESSION_ATTEMPTS,
          };
        };

        const {
          result: sessionResult,
          error: sessionFetchError,
          attempts: sessionAttempts,
        } = await fetchSessionWithRetry();

        if (!sessionResult) {
          logger.error(
            "AuthContext: Unable to establish session after retries",
            {
              attempts: sessionAttempts,
              error: sessionFetchError?.message || "unknown",
            },
          );

          if (mountedRef.current) {
            updateAuthState(null, null); // ✅ FIX: Atomic update
          }
          return;
        }

        const {
          data: { session: rawSession },
          error: sessionError,
        } = sessionResult;

        if (sessionError) {
          logger.error(
            "AuthContext: Session returned error during initialization",
            sessionError,
          );
          if (mountedRef.current) {
            updateAuthState(null, null); // ✅ FIX: Atomic update
          }
          return;
        }

        const { session: validSession, user: validUser } =
          validateSession(rawSession);

        logger.context("AuthContext", "Auth initialization result", {
          hasValidUser: !!validUser,
          userEmail: validUser?.email || "none",
          userId: validUser?.id || "none",
          originalSessionValid: !!rawSession,
          wasUserSanitized: !!rawSession?.user && !validUser,
          sessionAttempts,
        });

        if (mountedRef.current) {
          updateAuthState(validSession, validUser); // ✅ FIX: Atomic update
        }

        if (rawSession && !validSession) {
          logger.warn("AuthContext: Invalid session detected, cleaning up");
          try {
            cleanupAuthState();
            await supabase.auth.signOut();
          } catch (signOutError) {
            logger.error(
              "AuthContext: Failed to sign out invalid session",
              signOutError,
            );
          }
        }
      } catch (error) {
        logger.error("AuthContext initialization failed", error);

        if (mountedRef.current) {
          updateAuthState(null, null); // ✅ FIX: Atomic update
        }
      } finally {
        if (mountedRef.current) {
          updateLoadingState(false);
          updateReadyState(true);
          logger.context("AuthContext", "Auth initialization completed");
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || "";
      if (
        reason.includes("Auth initialization timeout") ||
        reason.includes("AuthContext refresh timeout") ||
        reason.includes("Session validation timeout")
      ) {
        logger.warn(
          "AuthContext: Caught unhandled timeout promise rejection",
          event.reason,
        );
        event.preventDefault();
      }
    };

    // ✅ REMOVED: Duplicate auth-refresh-request listener (handled by PaymentContext)
    // This prevents race conditions between multiple event handlers
    
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    void initializeAuth();

    return () => {
      mountedRef.current = false;
      logger.context("AuthContext", "Cleaning up auth subscription");
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      // ✅ REMOVED: No longer removing auth-refresh-request listener since we don't add it
    };
  }, [
    refreshUser,
    updateLoadingState,
    updateReadyState,
    updateSession,
    updateUser,
  ]);

  // ✅ Setup auth state subscription
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // ✅ Cleanup mounted ref on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    triggerRedirectCheck,
  };
};