// src/App.tsx - UPDATED & INTEGRATED
import React, { Suspense, useEffect, useCallback } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { AppProviders } from "@/contexts/AppProviders";
import { AppRouter } from "@/config/routes";
import { queryClient } from "@/config/queryClient";
import { AppLoader } from "@/components/loaders";
import { logger } from "@/utils/logger";
// import MemoryMonitor from "@/components/MemoryMonitor";

const App = () => {
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
      
      logger.debug('App: Initial setup completed');
    } catch (error) {
      logger.error('App initial setup error:', error);
    }
  }, []);

  // ✅ SIMPLIFIED: Remove auth redirect logic (now handled in AuthContext)
  useEffect(() => {
    handleInitialSetup();
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
    
    // Cleanup subscriptions
    return () => {
      queryUnsubscribe();
      mutationUnsubscribe();
    };
  }, [handleQueryError]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* ✅ AppProviders already includes AuthProvider and PaymentProvider in correct order */}
        <AppProviders>
          <Suspense fallback={<AppLoader />}>
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
        </AppProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;