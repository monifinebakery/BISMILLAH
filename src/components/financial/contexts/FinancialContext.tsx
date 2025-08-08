// src/financial/contexts/FinancialContext.tsx
// REFACTORED VERSION - Using TanStack Query with existing types

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Local imports
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';

// ✅ USING EXISTING TYPES
import { 
  FinancialTransaction, 
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData 
} from '@/types/financial'; // Using existing centralized types

import { 
  safeParseDate 
} from '@/utils/unifiedDateUtils';

import { 
  validateTransaction,
  formatTransactionForDisplay 
} from '../utils/financialUtils';

// API functions
import {
  addFinancialTransaction as apiAddTransaction,
  updateFinancialTransaction as apiUpdateTransaction,
  deleteFinancialTransaction as apiDeleteTransaction,
  getFinancialTransactions
} from '../services/financialApi';

// ===========================================
// QUERY KEYS - Centralized for consistency
// ===========================================

export const financialQueryKeys = {
  all: ['financial'] as const,
  transactions: (userId?: string) => [...financialQueryKeys.all, 'transactions', userId] as const,
  transaction: (id: string) => [...financialQueryKeys.all, 'transaction', id] as const,
} as const;

// ===========================================
// HELPER FUNCTIONS
// ===========================================

const transformTransactionFromDB = (dbItem: any): FinancialTransaction => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      throw new Error('Invalid transaction data from database');
    }

    return {
      id: dbItem.id || '',
      userId: dbItem.user_id || '',
      type: dbItem.type || 'expense',
      category: dbItem.category || null,
      amount: Number(dbItem.amount) || 0,
      description: dbItem.description || null,
      date: safeParseDate(dbItem.date) || new Date(),
      notes: dbItem.notes || null,
      relatedId: dbItem.related_id || null,
      createdAt: safeParseDate(dbItem.created_at) || new Date(),
      updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
    };
  } catch (error) {
    logger.error('Error transforming transaction from DB:', error, dbItem);
    return {
      id: dbItem?.id || 'error',
      userId: dbItem?.user_id || '',
      type: 'expense',
      category: null,
      amount: 0,
      description: 'Error loading transaction',
      date: new Date(),
      notes: null,
      relatedId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

const createFinancialNotification = async (
  addNotification: any,
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message: string,
  transactionId?: string
) => {
  if (!addNotification || typeof addNotification !== 'function') {
    return;
  }

  try {
    await addNotification({
      title,
      message,
      type,
      icon: type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info',
      priority: type === 'error' ? 4 : 2,
      related_type: 'financial',
      related_id: transactionId,
      action_url: '/financial',
      is_read: false,
      is_archived: false
    });
  } catch (error) {
    logger.error('Error creating financial notification:', error);
  }
};

// ===========================================
// CONTEXT SETUP
// ===========================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// ===========================================
// CUSTOM HOOKS FOR QUERY OPERATIONS
// ===========================================

/**
 * Hook for fetching financial transactions
 */
const useFinancialTransactionsQuery = (userId?: string) => {
  return useQuery({
    queryKey: financialQueryKeys.transactions(userId),
    queryFn: () => getFinancialTransactions(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for transaction mutations
 */
const useTransactionMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // Add transaction mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateTransactionData) => apiAddTransaction(data),
    onMutate: async (newTransaction) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions(user?.id)
      );

      // Optimistically update
      const optimisticTransaction: FinancialTransaction = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        type: newTransaction.type,
        category: newTransaction.category || null,
        amount: newTransaction.amount,
        description: newTransaction.description || null,
        date: newTransaction.date || new Date(),
        notes: newTransaction.notes || null,
        relatedId: newTransaction.relatedId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(
        financialQueryKeys.transactions(user?.id),
        (old: FinancialTransaction[] = []) => [optimisticTransaction, ...old]
      );

      return { previousTransactions };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(user?.id),
          context.previousTransactions
        );
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menambahkan transaksi: ${errorMessage}`);
      
      createFinancialNotification(
        addNotification,
        'error',
        '❌ Error Transaksi',
        `Gagal menambahkan transaksi: ${errorMessage}`
      );
    },
    onSuccess: async (newTransaction, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      // Create activity log
      if (addActivity) {
        await addActivity({
          type: 'financial_create',
          description: `Menambahkan transaksi ${variables.type}: ${formatTransactionForDisplay(newTransaction)}`,
          relatedType: 'financial',
          relatedId: newTransaction.id,
          metadata: {
            transactionType: variables.type,
            amount: variables.amount,
            category: variables.category
          }
        });
      }

      // Create notification
      await createFinancialNotification(
        addNotification,
        'success',
        '💰 Transaksi Ditambahkan',
        `${variables.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(variables.amount)} berhasil ditambahkan`,
        newTransaction.id
      );

      toast.success(`Transaksi ${variables.type === 'income' ? 'pemasukan' : 'pengeluaran'} berhasil ditambahkan`);
    }
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) => 
      apiUpdateTransaction(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions(user?.id)
      );

      // Optimistically update
      queryClient.setQueryData(
        financialQueryKeys.transactions(user?.id),
        (old: FinancialTransaction[] = []) =>
          old.map(transaction =>
            transaction.id === id
              ? { ...transaction, ...data, updatedAt: new Date() }
              : transaction
          )
      );

      return { previousTransactions };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(user?.id),
          context.previousTransactions
        );
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal memperbarui transaksi: ${errorMessage}`);
      
      createFinancialNotification(
        addNotification,
        'error',
        '❌ Error Update',
        `Gagal memperbarui transaksi: ${errorMessage}`
      );
    },
    onSuccess: async (updatedTransaction, { data }) => {
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      if (addActivity) {
        await addActivity({
          type: 'financial_update',
          description: `Mengupdate transaksi: ${formatTransactionForDisplay(updatedTransaction)}`,
          relatedType: 'financial',
          relatedId: updatedTransaction.id,
          metadata: {
            transactionType: updatedTransaction.type,
            amount: updatedTransaction.amount,
            category: updatedTransaction.category
          }
        });
      }

      await createFinancialNotification(
        addNotification,
        'info',
        '📝 Transaksi Diperbarui',
        `Transaksi ${formatTransactionForDisplay(updatedTransaction)} berhasil diperbarui`,
        updatedTransaction.id
      );

      toast.success('Transaksi berhasil diperbarui');
    }
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteTransaction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions(user?.id)
      ) as FinancialTransaction[];

      const transactionToDelete = previousTransactions?.find(t => t.id === id);

      // Optimistically update
      queryClient.setQueryData(
        financialQueryKeys.transactions(user?.id),
        (old: FinancialTransaction[] = []) => old.filter(t => t.id !== id)
      );

      return { previousTransactions, transactionToDelete };
    },
    onError: (error: any, id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(user?.id),
          context.previousTransactions
        );
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menghapus transaksi: ${errorMessage}`);
      
      createFinancialNotification(
        addNotification,
        'error',
        '❌ Error Hapus',
        `Gagal menghapus transaksi: ${errorMessage}`
      );
    },
    onSuccess: async (result, id, context) => {
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      if (context?.transactionToDelete && addActivity) {
        await addActivity({
          type: 'financial_delete',
          description: `Menghapus transaksi: ${formatTransactionForDisplay(context.transactionToDelete)}`,
          relatedType: 'financial',
          relatedId: id,
          metadata: {
            transactionType: context.transactionToDelete.type,
            amount: context.transactionToDelete.amount,
            category: context.transactionToDelete.category
          }
        });
      }

      if (context?.transactionToDelete) {
        await createFinancialNotification(
          addNotification,
          'warning',
          '🗑️ Transaksi Dihapus',
          `Transaksi ${formatTransactionForDisplay(context.transactionToDelete)} telah dihapus`,
          id
        );
      }

      toast.success('Transaksi berhasil dihapus');
    }
  });

  return {
    addMutation,
    updateMutation,
    deleteMutation
  };
};

// ===========================================
// PROVIDER COMPONENT
// ===========================================

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch transactions using React Query
  const {
    data: financialTransactions = [],
    isLoading,
    error,
    refetch
  } = useFinancialTransactionsQuery(user?.id);

  // Get mutations
  const { addMutation, updateMutation, deleteMutation } = useTransactionMutations();

  // ===========================================
  // REAL-TIME SUBSCRIPTION
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

            // Instead of manually updating state, invalidate queries
            queryClient.invalidateQueries({
              queryKey: financialQueryKeys.transactions(user.id)
            });

          } catch (error) {
            logger.error('Real-time update error:', error);
            toast.error('Error dalam pembaruan real-time');
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
  // CONTEXT FUNCTIONS (Updated to match existing interface)
  // ===========================================

  const addFinancialTransaction = useCallback(async (data: Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Harap login terlebih dahulu');
      return false;
    }

    // Convert to CreateTransactionData format
    const createData: CreateTransactionData = {
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description,
      date: data.date as Date,
      notes: data.notes,
      relatedId: data.relatedId,
    };

    // Validate transaction data
    const validationResult = validateTransaction(createData);
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.join(', ');
      toast.error(`Data tidak valid: ${errorMessage}`);
      return false;
    }

    try {
      await addMutation.mutateAsync(createData);
      return true;
    } catch (error) {
      return false;
    }
  }, [user, addMutation]);

  const updateFinancialTransaction = useCallback(async (id: string, data: Partial<FinancialTransaction>): Promise<boolean> => {
    if (!user) {
      toast.error('Harap login terlebih dahulu');
      return false;
    }

    // Convert to UpdateTransactionData format
    const updateData: UpdateTransactionData = {
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description,
      date: data.date as Date,
      notes: data.notes,
      relatedId: data.relatedId,
    };

    // Validate transaction data
    const validationResult = validateTransaction(updateData);
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.join(', ');
      toast.error(`Data tidak valid: ${errorMessage}`);
      return false;
    }

    try {
      await updateMutation.mutateAsync({ id, data: updateData });
      return true;
    } catch (error) {
      return false;
    }
  }, [user, updateMutation]);

  const deleteFinancialTransaction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Harap login terlebih dahulu');
      return false;
    }

    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  }, [user, deleteMutation]);

  // ===========================================
  // CONTEXT VALUE (Match existing interface)
  // ===========================================

  const contextValue: FinancialContextType = {
    // State
    financialTransactions,
    isLoading: isLoading || addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,

    // Actions (using existing interface)
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
// HOOK
// ===========================================

export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// ===========================================
// ADDITIONAL HOOKS FOR REACT QUERY UTILITIES
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
        queryFn: () => getFinancialTransactions(user.id),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  return {
    invalidateTransactions,
    prefetchTransactions,
  };
};

export default FinancialContext;