// src/components/financial/hooks/useFinancialData.ts
import { useQuery } from '@tanstack/react-query';
import { getFinancialTransactions } from '../services/financialApi';
import { useAuth } from '@/contexts/AuthContext';
import { financialQueryKeys } from './useFinancialQueryKeys';

/**
 * Financial Data Hook
 * Fetches financial transactions with React Query
 */
export const useFinancialData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: financialQueryKeys.transactions(user?.id),
    queryFn: () => getFinancialTransactions(user!.id),
    enabled: !!user?.id,
    // ✅ OPTIMIZED: Faster loading with shorter stale time
    staleTime: 30 * 1000, // 30 seconds - much shorter for fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes - shorter cache time
    retry: 2, // Reduce retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * attemptIndex, 3000), // Faster retries
    // ✅ OPTIMIZED: Enable smart refetching for better UX
    refetchOnWindowFocus: true, // Enable for fresh data
    refetchOnMount: true, // Always fetch fresh on mount
    refetchOnReconnect: true, // Refetch when connection restored
    refetchInterval: false, // Disable interval to avoid spam
    refetchIntervalInBackground: false,
    // ✅ OPTIMIZED: Better loading states
    keepPreviousData: false, // Don't keep stale data
    placeholderData: undefined, // No placeholder to show loading state
    notifyOnChangeProps: ['data', 'error', 'isLoading'], // Only track essential props
  });
};