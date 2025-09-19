import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";

import { queryClient } from "@/config/queryClient";
import { supabase } from "@/integrations/supabase/client";
import {
  cleanupAuthState,
  debugAuthState,
  refreshSessionSafely,
  validateAuthSession,
} from "@/lib/authUtils";
import { clearPersistedQueryState } from "@/utils/queryPersistence";
import {
  detectSafariIOS,
  getSafariTimeout,
  logSafariInfo,
  needsSafariWorkaround,
  safariAuthFallback,
} from "@/utils/safariUtils";
import {
  detectProblematicAndroid,
  forceAndroidSessionRefresh,
  validateAndroidSession,
  preOptimizeAndroidLogin,
  cleanupAndroidStorage,
} from "@/utils/androidSessionFix";
import { logger } from "@/utils/logger";
import { debounce, throttle } from "@/utils/asyncUtils";

import {
  getAdaptiveTimeout,
  safeWithTimeout,
  validateSession,
} from "./helpers";
import type { AuthContextValue } from "./types";

type GetSessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;

type AuthLifecycleParams = {
  refreshUser: () => Promise<void>;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>;
  navigate: ReturnType<typeof useNavigate>;
  session: Session | null;
  user: User | null;
};

const useAuthLifecycle = ({
  refreshUser,
  setSession,
  setUser,
  setIsLoading,
  setIsReady,
  navigate,
  session,
  user,
}: AuthLifecycleParams) => {
  // Refs for dedupe/throttle & in-flight flags
  const lastEventRef = useRef<{ userId?: string; event?: string; ts: number }>({
    ts: 0,
  });
  const isFetchingRef = useRef(false);

  // ✅ OPTIMIZED: Android-specific periodic session validation with throttling
  const throttledAndroidValidation = useMemo(() => {
    const androidDetection = detectProblematicAndroid();
    if (!androidDetection.isProblematic) {
      return null;
    }

    return throttle(async () => {
      // Only validate if we have a valid session and user
      if (!session?.access_token || !user?.id) {
        logger.debug("Android: Skipping validation - no session or user");
        return;
      }

      // Additional check: only validate if session is close to expiring or suspicious
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;

      // Only validate if session expires within 10 minutes or if it's suspicious
      if (timeUntilExpiry > 600) {
        logger.debug("Android: Session still valid, skipping validation");
        return;
      }

      try {
        const result = await validateAndroidSession(session);
        if (!result.success && result.requiresRelogin) {
          logger.warn(
            "Android: Throttled validation failed, clearing session",
            result.message,
          );

          // Clear corrupted session without toggling loading states
          setSession(null);
          setUser(null);
          cleanupAndroidStorage();
        }
      } catch (error) {
        logger.debug(
          "Android: Throttled validation error (non-critical)",
          error,
        );
      }
    }, 60000); // Throttle to max once per minute instead of every 30 seconds
  }, [session?.access_token, user?.id]);

  useEffect(() => {
    if (!throttledAndroidValidation) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;

    // Defer first run by 2 minutes to avoid interference with initial auth
    timeout = setTimeout(() => {
      if (throttledAndroidValidation) {
        throttledAndroidValidation();
        // Check every 5 minutes instead of 30 seconds
        interval = setInterval(throttledAndroidValidation, 300000);
      }
    }, 120000);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [throttledAndroidValidation]);

  useEffect(() => {
    let mounted = true;

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

        if (mounted) {
          setSession(mockSession);
          setUser(mockUser);
          setIsLoading(false);
          setIsReady(true);
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

              if (mounted && validSession && validUser) {
                setSession(validSession);
                setUser(validUser);
                setIsLoading(false);
                setIsReady(true);

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

            if (mounted) {
              setSession(validSession);
              setUser(validUser);
              setIsLoading(false);
              setIsReady(true);
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

            if (mounted) {
              setIsLoading(false);
              setIsReady(true);
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
            attempt < MAX_SESSION_ATTEMPTS && mounted;
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

            if (!mounted || attempt >= MAX_SESSION_ATTEMPTS - 1) {
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

          if (mounted) {
            setSession(null);
            setUser(null);
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
          if (mounted) {
            setSession(null);
            setUser(null);
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

        if (mounted) {
          setSession(validSession);
          setUser(validUser);
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

        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
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

    const handleAuthRefreshRequest = () => {
      if (!mounted) return;
      if (isFetchingRef.current) {
        logger.debug("AuthContext: Skipping auth-refresh-request (in-flight)");
        return;
      }
      logger.debug("AuthContext: Received auth-refresh-request event");
      isFetchingRef.current = true;
      void refreshUser().finally(() => {
        isFetchingRef.current = false;
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener(
      "auth-refresh-request",
      handleAuthRefreshRequest as EventListener,
    );

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Throttle/dedupe repeated events from Supabase
      const nowTs = Date.now();
      const sameUser =
        !!session?.user?.id && session.user.id === lastEventRef.current.userId;
      const sameEvent = event === lastEventRef.current.event;
      const tooSoon = nowTs - lastEventRef.current.ts < 800; // 0.8s window
      if (sameUser && sameEvent && tooSoon) {
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
      setSession(validSession);
      setUser(validUser);

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
        "Auth state updated, letting AuthGuard handle navigation",
      );

      if (validUser) {
        try {
          localStorage.removeItem("otpVerifiedAt");
        } catch (storageError) {
          logger.warn("AuthContext: Failed to clear OTP flag", storageError);
        }
      }

      if (validUser && window.location.pathname === "/auth") {
        try {
          // Prevent duplicate rapid navigations that can cause flicker and Chrome IPC flooding protection warnings
          const w = window as any;
          if (w.__AUTH_REDIRECTING__) {
            logger.debug(
              "AuthContext: Redirect already in flight, skipping duplicate",
            );
          } else {
            w.__AUTH_REDIRECTING__ = true;
            logger.info(
              "AuthContext: 🚀 REDIRECTING authenticated user from /auth to / (SPA)",
              {
                userId: validUser.id,
                email: validUser.email,
                currentPath: window.location.pathname,
                timestamp: new Date().toISOString(),
              },
            );
            navigate("/", { replace: true });
          }
        } catch (redirectError) {
          logger.error("AuthContext: Redirect error:", redirectError);
          // Fallback to a single navigate attempt
          navigate("/", { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      logger.context("AuthContext", "Cleaning up auth subscription");
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener(
        "auth-refresh-request",
        handleAuthRefreshRequest as EventListener,
      );
      subscription.unsubscribe();
    };
  }, [navigate, refreshUser, setIsLoading, setIsReady, setSession, setUser]);
};

export const useAuthManager = (): AuthContextValue => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      logger.context("AuthContext", "Manual user refresh triggered");
      const adaptiveTimeout = getAdaptiveTimeout(12000);

      const { data: sessionResult, error: timeoutError } =
        await safeWithTimeout(() => supabase.auth.getSession(), {
          timeoutMs: adaptiveTimeout,
          timeoutMessage: "AuthContext refresh timeout",
        });

      if (timeoutError) {
        logger.error("AuthContext refresh timeout/error", timeoutError);

        const refreshSuccess = await refreshSessionSafely();
        if (!refreshSuccess) {
          logger.warn("AuthContext: Both getSession and refreshSession failed");
          return;
        }

        const { data: retryResult } = await safeWithTimeout(
          () => supabase.auth.getSession(),
          {
            timeoutMs: adaptiveTimeout,
            timeoutMessage: "AuthContext refresh retry",
          },
        );

        if (retryResult) {
          const {
            data: { session: retrySession },
            error,
          } = retryResult as GetSessionResult;

          if (!error) {
            const { session: validSession, user: validUser } =
              validateSession(retrySession);
            setSession(validSession);
            setUser(validUser);
            return;
          }
        }
        return;
      }

      if (!sessionResult) {
        return;
      }

      const {
        data: { session: freshSession },
        error,
      } = sessionResult as GetSessionResult;

      if (error) {
        logger.error("AuthContext refresh error", error);
        return;
      }

      const { session: validSession, user: validUser } =
        validateSession(freshSession);
      setSession(validSession);
      setUser(validUser);

      logger.context("AuthContext", "Manual refresh completed", {
        hasSession: !!validSession,
        hasValidUser: !!validUser,
        userEmail: validUser?.email || "none",
        userId: validUser?.id || "none",
      });
    } catch (error) {
      logger.error("AuthContext refresh failed", error);
    }
  }, [setSession, setUser]);

  const triggerRedirectCheck = useCallback(() => {
    if (isReady && user && window.location.pathname === "/auth") {
      logger.info(
        "AuthContext: Manual redirect trigger - user authenticated on auth page",
      );
      navigate("/", { replace: true });
    }
  }, [isReady, navigate, user]);

  useEffect(() => {
    const currentId = user?.id || null;
    const prevId = lastUserIdRef.current;
    if (prevId === null && currentId === null) return;
    if (prevId !== null && currentId !== null && prevId === currentId) return;

    lastUserIdRef.current = currentId;

    const clearCaches = async () => {
      try {
        const queries = queryClient.getQueryCache().getAll();
        const chunkSize = 50;

        for (let i = 0; i < queries.length; i += chunkSize) {
          const chunk = queries.slice(i, i + chunkSize);
          chunk.forEach((query) =>
            queryClient.removeQueries({ queryKey: query.queryKey }),
          );

          if (i + chunkSize < queries.length) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        clearPersistedQueryState();
        logger.info("AuthContext: Non-blocking cache clear completed", {
          prevId,
          currentId,
        });
      } catch (error) {
        logger.warn("AuthContext: Non-blocking cache clear failed", error);
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(
        () => {
          void clearCaches();
        },
        { timeout: 2000 },
      );
    } else {
      setTimeout(() => {
        void clearCaches();
      }, 100);
    }
  }, [user?.id]);

  const validateSessionWrapper = useCallback(async () => {
    try {
      return await validateAuthSession();
    } catch (error) {
      logger.error("AuthContext: Error validating session", error);
      return false;
    }
  }, []);

  const debugAuthWrapper = useCallback(async () => {
    try {
      return await debugAuthState();
    } catch (error) {
      logger.error("AuthContext: Error debugging auth", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

  useAuthLifecycle({
    refreshUser,
    setSession,
    setUser,
    setIsLoading,
    setIsReady,
    navigate,
    session,
    user,
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // @ts-expect-error - exposed for debugging only
    window.__DEBUG_AUTH_USER__ = user;
    // @ts-expect-error - exposed for debugging only
    window.__DEBUG_AUTH_READY__ = isReady;
    // @ts-expect-error - exposed for debugging only
    window.__DEBUG_AUTH_LOADING__ = isLoading;
    // @ts-expect-error - exposed for debugging only
    window.__DEBUG_AUTH_SESSION__ = session;
    // @ts-expect-error - exposed for debugging only
    window.__DEBUG_AUTH_VALIDATE__ = validateSessionWrapper;
    // @ts-expect-error - exposed for debugging only
    window.__DEBUG_AUTH_DEBUG__ = debugAuthWrapper;

    logger.debug("AuthContext: Debug values set", {
      user: !!user,
      userEmail: user?.email,
      userId: user?.id,
      isReady,
      isLoading,
      session: !!session,
    });
  }, [
    debugAuthWrapper,
    isLoading,
    isReady,
    session,
    user,
    validateSessionWrapper,
  ]);

  useEffect(() => {
    if (!import.meta.env.DEV || !isReady) return;

    logger.debug("AuthContext: Context value update", {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id || "none",
      userIdType: typeof user?.id,
      userEmail: user?.email || "none",
      isLoading,
      isReady,
    });

    if (user?.id === "null") {
      logger.error("🚨 AuthContext: STRING NULL DETECTED IN CONTEXT VALUE!");
      console.error("🚨 AuthContext: User with string null ID:", user);
    }
  }, [isLoading, isReady, session, user]);

  const contextValue: AuthContextValue = {
    session,
    user,
    isLoading,
    isReady,
    refreshUser,
    triggerRedirectCheck,
    validateSession: validateSessionWrapper,
    debugAuth: debugAuthWrapper,
  };

  return contextValue;
};
