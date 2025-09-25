// src/App.tsx - UPDATED & INTEGRATED
// 
// APPLICATION ARCHITECTURE: AUTH AS SINGLE SOURCE OF TRUTH
// ========================================================
// This application follows a strict single source of truth policy for authentication:
// 
// AUTH DATA FLOW:
// 1. Supabase (Primary Authority) -> Browser cookies/storage managed by Supabase SDK
// 2. React Context (UI Cache) -> AuthContext for immediate UI updates
// 3. React Query (Data Cache) -> For optimized data fetching
// 
// NEVER:
// - Store session/token data independently in localStorage/sessionStorage
// - Trust local caches without validating against Supabase first
// - Manipulate session data directly without Supabase SDK
// 
// ALWAYS:
// - Validate sessions through official Supabase SDK methods
// - Refresh sessions via Supabase refresh mechanism
// - Treat local state as UI cache, not source of truth

import React, { Suspense, useEffect, useCallback } from 'react';
import { QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { AppProviders } from "@/contexts/AppProviders";
import { AppRouter } from "@/config/routes";
import { queryClient } from "@/config/queryClient";
import { logger } from "@/utils/logger";
import { CodeSplittingProvider } from "@/providers/CodeSplittingProvider";
import { initializeRoutePreloaders, preloadCriticalRoutes } from "@/utils/route-preloader";
// Unified: Update banner is handled in AppLayout via useUpdateNotification
import { OfflineIndicator } from '@/components/common/OfflineIndicator';
import { useAutoUpdate } from "@/hooks/useAutoUpdate";
import { loadPersistedQueryState, setupQueryPersistence } from "@/utils/queryPersistence";
// import MemoryMonitor from "@/components/MemoryMonitor";
import { FloatingChatbot } from '@/components/chatbot/FloatingChatbot';
import { periodicSessionRefresh } from '@/utils/auth/periodicSessionRefresh';

const App = () => {
  // ✅ Auto-update system - Setup update detection and notifications
  // ⚠️ DISABLED for private repository - enable with VITE_GITHUB_TOKEN
  const autoUpdate = useAutoUpdate({
    checkInterval: 5, // Check every 5 minutes
    enableInDev: false, // Disable in development
    autoStart: !!import.meta.env.VITE_GITHUB_TOKEN, // Only start if token available
    showNotifications: true, // Show update banner
    onUpdateDetected: (result) => {
      logger.success('🎉 New app update available!', {
        currentVersion: result.currentVersion.version,
        latestVersion: result.latestVersion?.version,
        updateType: result.updateType
      });
    },
    onUpdateCheckError: (error) => {
      // Don't spam logs for private repo without token
      if (!import.meta.env.VITE_GITHUB_TOKEN) {
        logger.debug('🔒 Auto-update disabled: Private repository needs VITE_GITHUB_TOKEN');
      } else {
        logger.warn('⚠️ Update check failed:', error.message);
      }
    }
  });

  // ✅ Memoized initial setup handler
  const handleInitialSetup = useCallback(async () => {
    try {
      logger.debug('App: Initial setup, current path:', window.location.pathname);
      
      // ✅ MINIMAL: Only clean URL if auth tokens are present
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        logger.debug('App: Auth tokens found in URL, cleaning URL...');
        // Clean URL and let AuthContext handle the rest
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Also check for query params (Supabase sometimes uses these)
      const urlParams = new URLSearchParams(window.location.search);
      const accessTokenQuery = urlParams.get('access_token');
      
      if (accessTokenQuery) {
        logger.debug('App: Auth tokens found in query params, cleaning URL...');
        // Clean URL and let AuthContext handle the rest
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      logger.debug('App: Initial setup completed');
    } catch (error) {
      logger.error('App initial setup error:', error);
    }
  }, []);

  // ✅ SIMPLIFIED: Remove auth redirect logic (now handled in AuthContext)
  useEffect(() => {
    handleInitialSetup();
    // Initialize route preloaders but don't preload routes upfront
    try {
      initializeRoutePreloaders();
      // Remove aggressive preloading - routes will be preloaded on demand
      // preloadCriticalRoutes();
    } catch (e) {
      logger.debug('Route preloading init skipped', e);
    }
  }, [handleInitialSetup]);

  // ✅ Memoized error handler
  const handleQueryError = useCallback((error: unknown) => {
    logger.error('React Query Error:', error);
    
    // ✅ Handle auth errors globally with proper type checking
    const errorObj = error as { message?: string; status?: number };
    if ((errorObj.message && (
          errorObj.message.includes('session missing') || 
          errorObj.message.includes('JWT expired')
        )) || errorObj.status === 401) {
      logger.warn('Session expired, will redirect to auth...');
      // Let AuthContext handle the redirect
    }
  }, []);

  // ✅ Enhanced error handling for QueryClient
  useEffect(() => {
    // ✅ Hydrate from persisted cache (once on mount)
    // Using HydrationBoundary below to apply this state

    // ✅ Set up global query error handler
    const queryUnsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.state?.error) {
        handleQueryError(event.query.state.error);
      }
    });
    
    // ✅ Set up global mutation error handler  
    const mutationUnsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event?.mutation?.state?.error) {
        handleQueryError(event.mutation.state.error);
      }
    });
    
    // Setup cache persistence (best-effort)
    const cleanupPersistence = setupQueryPersistence(queryClient);

    // ✅ Start periodic session refresh
    periodicSessionRefresh.startPeriodicRefresh();

    // Cleanup subscriptions
    return () => {
      queryUnsubscribe();
      mutationUnsubscribe();
      cleanupPersistence();
      // ✅ Stop periodic session refresh on app unmount
      periodicSessionRefresh.stopPeriodicRefresh();
    };
  }, [handleQueryError]);

  // Load dehydrated state from IndexedDB (async) once
  // Use precise type for React Query hydration state
  const [dehydratedState, setDehydratedState] = React.useState<import('@tanstack/react-query').DehydratedState | null>(null);
  React.useEffect(() => {
    let mounted = true;
    loadPersistedQueryState().then((state) => {
      if (mounted) setDehydratedState(state);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState ?? undefined}>
      <TooltipProvider>
        {/* Auto-update: banner rendering handled inside AppLayout to avoid duplicates */}
        
        {/* ✅ Code Splitting Provider untuk optimasi loading */}
        <CodeSplittingProvider>
          {/* ✅ AppProviders already includes AuthProvider and PaymentProvider in correct order */}
          <AppProviders>
            <Suspense fallback={null}>
              <AppRouter />
            </Suspense>

            {/* ✅ Dev tools only in development */}
            {import.meta.env.DEV && (
              <>
                <ReactQueryDevtools initialIsOpen={false} />
                {/* <MemoryMonitor /> */}
              </>
            )}
            
            {/* Vercel Analytics - Web visitor tracking */}
            <Analytics />
            
            {/* Speed Insights removed */}

            {/* PWA Install Banner */}

            {/* PWA Offline Indicator - DISABLED */}
            {/* <OfflineIndicator /> */}
            
            {/* Floating Chatbot - Disabled in production */}
            {(import.meta.env.DEV || import.meta.env.VITE_VERCEL_ENV === "preview") && <FloatingChatbot />}
          </AppProviders>
        </CodeSplittingProvider>
      </TooltipProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
};

export default App;
