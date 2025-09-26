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
    // ✅ OPTIMIZED: Balanced performance and freshness
    staleTime: 15 * 60 * 1000, // 15 minutes - much less aggressive
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2, // Reduce retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * attemptIndex, 3000), // Faster retries
    // ✅ OPTIMIZED: Disable aggressive refetching
    refetchOnWindowFocus: false, // Disable aggressive refetch
    refetchOnMount: 'always', // Use global setting
    refetchOnReconnect: false, // Disable aggressive reconnect refetch
    refetchInterval: false, // Disable interval to avoid spam
    refetchIntervalInBackground: false,
    // ✅ OPTIMIZED: Better loading states
    placeholderData: undefined, // No placeholder to show loading state
    notifyOnChangeProps: ['data', 'error', 'isLoading'], // Only track essential props
  });
};