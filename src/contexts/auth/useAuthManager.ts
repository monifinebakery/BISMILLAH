// src/contexts/auth/useAuthManager.ts - Modular Auth Manager
import { useMemo, useEffect } from 'react';
import { queryClient } from '@/config/queryClient';
import { clearPersistedQueryState } from '@/utils/queryPersistence';
import { logger } from '@/utils/logger';
import type { AuthContextValue } from './types';

// Import refactored hooks
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useAuthValidation } from '@/hooks/auth/useAuthValidation';
import { useAuthLifecycle } from '@/hooks/auth/useAuthLifecycle';

export const useAuthManager = (): AuthContextValue => {
  // Use refactored hooks
  const {
    session,
    user,
    isLoading,
    isReady,
    sessionRef,
    userRef,
    lastUserIdRef,
    updateSession,
    updateUser,
    updateLoadingState,
    updateReadyState,
    resetAuthState,
  } = useAuthState();

  const {
    refreshUser,
    validateSession,
    debugAuth,
  } = useAuthValidation({
    updateSession,
    updateUser,
  });

  const {
    triggerRedirectCheck,
  } = useAuthLifecycle({
    refreshUser,
    updateSession,
    updateUser,
    updateLoadingState,
    updateReadyState,
    sessionRef,
    userRef,
  });

  // ✅ ANTI-FLICKER: Optimized cache management to prevent UI flicker
  useEffect(() => {
    const currentId = user?.id || null;
    const prevId = lastUserIdRef.current;
    if (prevId === null && currentId === null) return;
    if (prevId !== null && currentId !== null && prevId === currentId) return;

    lastUserIdRef.current = currentId;

    const clearCaches = async () => {
      try {
        // ✅ ANTI-FLICKER: More selective cache clearing to prevent data loss flicker
        const queries = queryClient.getQueryCache().getAll();
        const userSpecificQueries = queries.filter(query => {
          const queryKey = query.queryKey;
          // Only clear user-specific queries that contain user IDs
          return queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('user') || key.includes('auth') || key === prevId)
          );
        });

        // ✅ ANTI-FLICKER: Smaller chunks to prevent UI blocking
        const chunkSize = 10;
        for (let i = 0; i < userSpecificQueries.length; i += chunkSize) {
          const chunk = userSpecificQueries.slice(i, i + chunkSize);
          chunk.forEach((query) =>
            queryClient.removeQueries({ queryKey: query.queryKey })
          );

          // ✅ ANTI-FLICKER: Longer delay between chunks to prevent blocking
          if (i + chunkSize < userSpecificQueries.length) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        clearPersistedQueryState();
        logger.info("AuthContext: Selective cache clear completed", {
          prevId,
          currentId,
          clearedQueries: userSpecificQueries.length,
          totalQueries: queries.length
        });
      } catch (error) {
        logger.warn("AuthContext: Selective cache clear failed", error);
      }
    };

    // ✅ ANTI-FLICKER: Longer delay to prevent immediate cache clearing
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(
        () => {
          void clearCaches();
        },
        { timeout: 5000 }, // Increased timeout
      );
    } else {
      setTimeout(() => {
        void clearCaches();
      }, 300); // Increased delay
    }
  }, [user?.id]);

  // Development debug tools
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
    window.__DEBUG_AUTH_VALIDATE__ = validateSession;
    // @ts-expect-error - exposed for debugging only
    window.__DEBUG_AUTH_DEBUG__ = debugAuth;

    logger.debug("AuthContext: Debug values set", {
      user: !!user,
      userEmail: user?.email,
      userId: user?.id,
      isReady,
      isLoading,
      session: !!session,
    });
  }, [
    debugAuth,
    isLoading,
    isReady,
    session,
    user,
    validateSession,
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

  // ✅ FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue: AuthContextValue = useMemo(
    () => ({
      session,
      user,
      isLoading,
      isReady,
      refreshUser,
      triggerRedirectCheck,
      validateSession,
      debugAuth,
    }),
    [
      session,
      user,
      isLoading,
      isReady,
      refreshUser,
      triggerRedirectCheck,
      validateSession,
      debugAuth,
    ],
  );

  return contextValue;
};