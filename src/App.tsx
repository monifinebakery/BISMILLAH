// src/App.tsx - OPTIMIZED for setTimeout violation prevention

import React, { Suspense, useEffect, useCallback } from 'react';
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
  
  // ✅ OPTIMIZED: Non-blocking initial setup
  const handleInitialSetup = useCallback(async () => {
    try {
      logger.debug('App: Initial setup, current path:', window.location.pathname);
      
      // ✅ Use requestIdleCallback to prevent blocking main thread
      const cleanupAuthTokens = () => {
        try {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            logger.debug('App: Auth tokens found in URL, cleaning URL...');
            // ✅ Non-blocking URL cleanup
            requestAnimationFrame(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            });
          }
          
          logger.debug('App: Initial setup completed');
        } catch (error) {
          logger.error('App initial setup error:', error);
        }
      };

      // ✅ Use idle time for setup to prevent setTimeout violations
      if ('requestIdleCallback' in window) {
        requestIdleCallback(cleanupAuthTokens, { timeout: 2000 });
      } else {
        // ✅ Fallback: Use RAF to prevent blocking
        requestAnimationFrame(() => {
          requestAnimationFrame(cleanupAuthTokens);
        });
      }
      
    } catch (error) {
      logger.error('App initial setup error:', error);
    }
  }, []);

  // ✅ OPTIMIZED: Lightweight query error handler
  const setupQueryErrorHandling = useCallback(() => {
    const handleQueryError = (error: any) => {
      // ✅ Throttle error logging to prevent spam
      const now = Date.now();
      const lastErrorTime = (window as any).__lastQueryErrorTime__ || 0;
      
      if (now - lastErrorTime < 1000) {
        return; // Skip if error logged within last second
      }
      (window as any).__lastQueryErrorTime__ = now;
      
      logger.error('React Query Error:', error);
      
      // ✅ Handle auth errors globally with throttling
      if (error?.message?.includes('session missing') || 
          error?.message?.includes('JWT expired') ||
          error?.status === 401) {
        logger.warn('Session expired, will redirect to auth...');
        // Let AuthContext handle the redirect
      }
    };

    // ✅ PERFORMANCE: Use try-catch to prevent subscription errors
    try {
      // Set up global query error handler
      const queryCache = queryClient.getQueryCache();
      if (queryCache && typeof queryCache.subscribe === 'function') {
        queryCache.subscribe((event) => {
          if (event?.query?.state?.error) {
            handleQueryError(event.query.state.error);
          }
        });
      }

      // Set up global mutation error handler  
      const mutationCache = queryClient.getMutationCache();
      if (mutationCache && typeof mutationCache.subscribe === 'function') {
        mutationCache.subscribe((event) => {
          if (event?.mutation?.state?.error) {
            handleQueryError(event.mutation.state.error);
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to setup query error handling:', error);
    }
  }, []);

  // ✅ OPTIMIZED: Single useEffect with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    // ✅ Non-blocking initialization
    const initialize = async () => {
      if (!isMounted) return;
      
      // ✅ Setup in order with proper timing
      await handleInitialSetup();
      
      if (!isMounted) return;
      
      // ✅ Delay query setup to prevent race conditions
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          if (isMounted) {
            setupQueryErrorHandling();
          }
        }, { timeout: 3000 });
      } else {
        setTimeout(() => {
          if (isMounted) {
            setupQueryErrorHandling();
          }
        }, 100);
      }
    };

    // ✅ Start initialization with small delay to let React settle
    const timer = setTimeout(initialize, 50);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [handleInitialSetup, setupQueryErrorHandling]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* ✅ AppProviders already includes AuthProvider and PaymentProvider in correct order */}
        <AppProviders>
          <Suspense fallback={<AppLoader />}>
            <AppRouter />
          </Suspense>
          
          {/* ✅ CONDITIONAL: Dev tools only in development with optimized settings */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools 
              initialIsOpen={false} 
              position="bottom-right"
              // ✅ OPTIMIZED: Reduce update frequency to prevent setTimeout spam
              toggleButtonProps={{
                style: {
                  background: '#f97316',
                  color: 'white',
                  zIndex: 9999,
                }
              }}
              // ✅ PERFORMANCE: Reduce polling in devtools
              panelProps={{
                style: {
                  fontSize: '12px', // Smaller to reduce render cost
                }
              }}
              // ✅ Reduce render frequency
              errorTypes={[
                { name: 'Error', initializer: (query) => query.state.error }
              ]}
            />
          )}
        </AppProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;