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
        logger.debug('App: Checking auth redirect, current path:', window.location.pathname);
        
        // Check for auth tokens in URL (from OTP/magic link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          logger.debug('App: Auth tokens found in URL, processing...');
          
          // Clean URL first
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Let auth state change handler in PaymentContext handle the redirect
          return;
        }
        
        // Check if user is already logged in but on auth page
        const { data: { session } } = await supabase.auth.getSession();
        if (session && window.location.pathname === '/auth') {
          logger.debug('App: User already logged in, redirecting to dashboard');
          window.location.href = '/';
          return;
        }
        
        // Handle other auth-related URLs
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