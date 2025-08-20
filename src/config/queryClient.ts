// src/config/queryClient.ts - React Query Configuration
import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.message?.includes('session missing') || 
            error?.message?.includes('not authenticated') ||
            error?.status === 401 || error?.status === 403) {
          logger.warn('QueryClient: Auth error, not retrying:', error.message);
          return false;
        }
        // Retry network errors up to 2 times
        if (failureCount < 2) {
          logger.debug(`QueryClient: Retrying query (attempt ${failureCount + 1})`);
          return true;
        }
        return false;
      },
      // Performance optimizations
      refetchOnWindowFocus: false, // Disable auto refetch on window focus
      refetchOnReconnect: true, // Enable refetch on network reconnect
      refetchOnMount: true, // Refetch on component mount if data is stale
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});