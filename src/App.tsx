// src/App.tsx - CLEAN & MINIMAL
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
  // ✅ Enhanced auth redirect handling
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        // Check for auth tokens in URL (from OTP/magic link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          logger.debug('App: Auth tokens found in URL, processing...');
          
          // Let Supabase handle the auth
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && !error) {
            logger.success('App: Auth successful, redirecting to app...');
            
            // Clean URL and redirect to main app
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Small delay to ensure auth state is set
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
            
            return;
          }
        }
        
        // Handle other auth-related URLs
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && window.location.hash.includes("access_token")) {
          logger.debug('App: Access token found but no session, reloading...');
          window.location.reload();
        }
      } catch (error) {
        logger.error('Auth redirect error:', error);
      }
    };
    
    handleAuthRedirect();
  }, []);

  // ✅ Enhanced error handling for QueryClient
  const handleQueryError = (error: any) => {
    logger.error('React Query Error:', error);
    
    if (error?.message?.includes('session missing')) {
      logger.warn('Session expired, redirecting to auth...');
      window.location.href = '/auth';
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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