// src/contexts/FinancialContext.tsx
// ✅ MINIMAL CONTEXT - No circular dependencies, clean architecture

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Type imports only (no circular deps)
import { 
  FinancialTransaction, 
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData
} from '../types/financial';

// Hook imports (clean dependencies)
import { 
  useFinancialData, 
  useFinancialOperations,
  financialQueryKeys
} from '../hooks/useFinancialHooks';

// Context imports
import { useAuth } from '@/contexts/AuthContext';

// ===========================================
// ✅ CONTEXT SETUP
// ===========================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// ===========================================
// ✅ PROVIDER COMPONENT (Minimal)
// ===========================================

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get data and operations from hooks
  const { data: financialTransactions = [], isLoading: dataLoading } = useFinancialData();
  const { addTransaction, updateTransaction, deleteTransaction, isLoading: operationLoading } = useFinancialOperations();

  // ===========================================
  // ✅ REAL-TIME SUBSCRIPTION (Optimized)
  // ===========================================

  useEffect(() => {
    if (!user?.id) return;

    logger.context('FinancialContext', 'Setting up real-time subscription for user:', user.id);

    const channel = supabase
      .channel(`realtime-financial-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'financial_transactions', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          try {
            logger.context('FinancialContext', 'Real-time update received:', payload);

            // Invalidate queries for fresh data
            queryClient.invalidateQueries({
              queryKey: financialQueryKeys.transactions(user.id)
            });

          } catch (error) {
            logger.error('Real-time update error:', error);
          }
        }
      )
      .subscribe((status) => {
        logger.context('FinancialContext', 'Subscription status:', status);
      });

    return () => {
      logger.context('FinancialContext', 'Unsubscribing from real-time updates');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // ===========================================
  // ✅ CONTEXT FUNCTIONS (Wrapper for compatibility)
  // ===========================================

  const addFinancialTransaction = useCallback(async (
    data: CreateTransactionData
  ): Promise<boolean> => {
    try {
      await addTransaction(data);
      return true;
    } catch (error) {
      logger.error('Context: Failed to add transaction:', error);
      return false;
    }
  }, [addTransaction]);

  const updateFinancialTransaction = useCallback(async (
    id: string,
    data: UpdateTransactionData
  ): Promise<boolean> => {
    try {
      await updateTransaction(id, data);
      return true;
    } catch (error) {
      logger.error('Context: Failed to update transaction:', error);
      return false;
    }
  }, [updateTransaction]);

  const deleteFinancialTransaction = useCallback(async (
    id: string
  ): Promise<boolean> => {
    try {
      await deleteTransaction(id);
      return true;
    } catch (error) {
      logger.error('Context: Failed to delete transaction:', error);
      return false;
    }
  }, [deleteTransaction]);

  // ===========================================
  // ✅ CONTEXT VALUE (Minimal interface)
  // ===========================================

  const contextValue: FinancialContextType = {
    // State
    financialTransactions,
    isLoading: dataLoading || operationLoading,

    // Actions
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  };

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  );
};

// ===========================================
// ✅ HOOK
// ===========================================

export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// ===========================================
// ✅ UTILITY HOOKS
// ===========================================

/**
 * Hook for accessing React Query specific functions
 */
export const useFinancialQuery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: financialQueryKeys.transactions(user?.id)
    });
  }, [queryClient, user?.id]);

  const prefetchTransactions = useCallback(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: financialQueryKeys.transactions(user.id),
        queryFn: () => import('@/services/financialApi').then(api => api.getFinancialTransactions(user.id)),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  const getTransactionsFromCache = useCallback(() => {
    return queryClient.getQueryData(
      financialQueryKeys.transactions(user?.id)
    ) as FinancialTransaction[] | undefined;
  }, [queryClient, user?.id]);

  return {
    invalidateTransactions,
    prefetchTransactions,
    getTransactionsFromCache,
  };
};

export default FinancialContext;