// src/config/queryClient.ts - React Query Configuration
import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ULTRA PERFORMANCE: Extended stale time untuk mengurangi refetch
      staleTime: 10 * 60 * 1000, // 10 minutes (dari 5 minutes)
      gcTime: 15 * 60 * 1000, // 15 minutes (dari 10 minutes)
      
      // CRITICAL: Disable semua auto-refetch untuk performa maksimal
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Disable untuk performa, user bisa manual refresh
      refetchOnMount: 'always', // Hanya refetch jika data benar-benar stale
      refetchInterval: false, // Disable auto polling
      
      // OPTIMIZED: Retry strategy yang lebih efisien
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.message?.includes('session missing') || 
            error?.message?.includes('not authenticated') ||
            error?.status === 401 || error?.status === 403) {
          logger.warn('QueryClient: Auth error, not retrying:', error.message);
          return false;
        }
        // Don't retry client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry network errors hanya 1 kali untuk performa
        if (failureCount < 1) {
          logger.debug(`QueryClient: Retrying query (attempt ${failureCount + 1})`);
          return true;
        }
        return false;
      },
      
      // PERFORMANCE: Retry delay yang lebih cepat
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
      
      // MEMORY: Batasi network mode untuk performa
      networkMode: 'online',
    },
    mutations: {
      retry: 0, // Disable retry untuk mutations demi performa
      networkMode: 'online',
    },
  },
});