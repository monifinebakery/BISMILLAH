// src/App.tsx - UPDATED & INTEGRATED
import React, { Suspense, useEffect } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProviders } from "@/contexts/AppProviders";
import { AppRouter } from "@/config/routes";
import { queryClient } from "@/config/queryClient";
import { AppLoader } from "@/components/loaders";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

const App = () => {
  // ✅ SIMPLIFIED: Remove auth redirect logic (now handled in AuthContext)
  useEffect(() => {
    const handleInitialSetup = async () => {
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
    };
    
    handleInitialSetup();
  }, []);

  // ✅ Enhanced error handling for QueryClient
  useEffect(() => {
    const handleQueryError = (error: any) => {
      logger.error('React Query Error:', error);
      
      // ✅ Handle auth errors globally
      if (error?.message?.includes('session missing') || 
          error?.message?.includes('JWT expired') ||
          error?.status === 401) {
        logger.warn('Session expired, will redirect to auth...');
        // Let AuthContext handle the redirect
      }
    };

    // ✅ Set up global query error handler
    queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.state?.error) {
        handleQueryError(event.query.state.error);
      }
    });

    // ✅ Set up global mutation error handler  
    queryClient.getMutationCache().subscribe((event) => {
      if (event?.mutation?.state?.error) {
        handleQueryError(event.mutation.state.error);
      }
    });
  }, []);

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
            <ReactQueryDevtools 
              initialIsOpen={false} 
              position="bottom-right"
              toggleButtonProps={{
                style: {
                  background: '#f97316',
                  color: 'white',
                  zIndex: 9999, // ✅ Ensure it's always on top
                }
              }}
            />
          )}
        </AppProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;