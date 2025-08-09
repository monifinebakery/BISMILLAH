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
  // ✅ Handle auth redirect on app start
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && window.location.hash.includes("access_token")) {
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