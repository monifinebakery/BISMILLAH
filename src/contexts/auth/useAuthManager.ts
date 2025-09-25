// src/contexts/auth/useAuthManager.ts - Modular Auth Manager
// 
// ARCHITECTURE PRINCIPLE: SINGLE SOURCE OF TRUTH FOR AUTH STATE
// ============================================================
// All authentication state originates from Supabase as the authoritative source.
// This manager only maintains local UI state synchronized with Supabase.
// 
// Session/token storage hierarchy:
// 1. Supabase (Primary source) -> Browser cookies/storage managed by Supabase SDK
// 2. React Context (UI cache) -> useAuthState for immediate UI updates
// 3. React Query cache -> For data fetching optimizations
//
// NEVER:
// - Store session/token data in multiple places independently
// - Use local storage as source of truth for auth state
// - Update UI without validating against Supabase first
//
// ALWAYS:
// - Validate session against Supabase before trusting it
// - Refresh session through Supabase SDK, not local manipulation
// - Treat local state as UI cache, not source of truth
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
    updateAuthState, // ✅ NEW: Atomic update method
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
    updateAuthState, // ✅ NEW: Atomic update method
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

          // ✅ ANTI-FLICKER: Reduced delay between chunks for faster processing
          if (i + chunkSize < userSpecificQueries.length) {
            await new Promise((resolve) => setTimeout(resolve, 2)); // Reduced from 10ms to 2ms
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

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // ✅ FIX: Only clear caches for significant user changes (iPad/Safari optimization)
    // Don't clear caches for temporary tab switches or minor auth state changes
    if (prevId && currentId && prevId !== currentId) {
      // Significant user change - clear caches after delay
      timeoutId = setTimeout(() => {
        void clearCaches();
      }, 3000); // ✅ FIX: Increased to 3s to prevent iPad/Safari tab switching cache clearing
    } else if (!currentId && prevId) {
      // User logged out - clear caches immediately  
      timeoutId = setTimeout(() => {
        void clearCaches();
      }, 500); // Quick clear for logout
    }
    
    // Return cleanup function to prevent memory leaks
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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