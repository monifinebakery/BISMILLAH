// src/config/queryClient.ts - React Query Configuration
import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

type QueryError = {
  message?: string;
  status?: number;
};

const parseQueryError = (error: unknown): QueryError => {
  if (typeof error === "string") {
    return { message: error };
  }

  if (typeof error === "object" && error !== null) {
    const message = "message" in error && typeof error.message === "string"
      ? error.message
      : undefined;
    const status = "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;

    return { message, status };
  }

  return {};
};

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
      retry: (failureCount, error: unknown) => {
        const { message = "", status } = parseQueryError(error);

        // Don't retry auth errors
        if (message.includes('session missing') ||
            message.includes('not authenticated') ||
            status === 401 || status === 403) {
          logger.warn('QueryClient: Auth error, not retrying:', message);
          return false;
        }
        // Don't retry client errors (4xx)
        if (typeof status === 'number' && status >= 400 && status < 500) {
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