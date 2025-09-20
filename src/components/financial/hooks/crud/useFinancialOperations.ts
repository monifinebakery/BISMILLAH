// src/components/financial/hooks/crud/useFinancialOperations.ts
import { useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Type imports only
import { 
  FinancialTransaction, 
  CreateTransactionData, 
  UpdateTransactionData
} from '../../types/financial';

// API imports
import {
  addFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction
} from '../../services/financialApi';

// Query keys
import { financialQueryKeys } from '../../hooks/useFinancialQueryKeys';

interface UseFinancialOperationsReturn {
  addTransaction: (data: CreateTransactionData) => Promise<FinancialTransaction>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<FinancialTransaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

/**
 * Financial Operations Hook
 * Handles create, update, and delete operations for financial transactions
 */
export const useFinancialOperations = (): UseFinancialOperationsReturn => {
  const queryClient = useQueryClient();

  // Add transaction mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateTransactionData) => addFinancialTransaction(data),
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions()
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions()
      );

      // Optimistic update
      const optimisticTransaction: FinancialTransaction = {
        id: `temp-${Date.now()}`,
        userId: newTransaction.userId || '',
        ...newTransaction,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(
        financialQueryKeys.transactions(),
        (old: FinancialTransaction[] = []) => [optimisticTransaction, ...old]
      );

      return { previousTransactions };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(),
          context.previousTransactions
        );
      }
      toast.error(`Gagal menambahkan transaksi: ${error.message}`);
    },
    onSuccess: () => {
      // Only refresh the transactions list; optimistic update already updated UI
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(),
        exact: true,
      });
      toast.success('Transaksi berhasil ditambahkan');
    }
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) => 
      updateFinancialTransaction(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions()
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions()
      );

      queryClient.setQueryData(
        financialQueryKeys.transactions(),
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
          financialQueryKeys.transactions(),
          context.previousTransactions
        );
      }
      toast.error(`Gagal memperbarui transaksi: ${error.message}`);
    },
    onSuccess: () => {
      // Only refresh the transactions list to avoid global refetch storms
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(),
        exact: true,
      });
      toast.success('Transaksi berhasil diperbarui');
    }
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions()
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions()
      ) as FinancialTransaction[];

      queryClient.setQueryData(
        financialQueryKeys.transactions(),
        (old: FinancialTransaction[] = []) => old.filter(t => t.id !== id)
      );

      return { previousTransactions };
    },
    onError: (error: any, id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(),
          context.previousTransactions
        );
      }
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
    onSuccess: () => {
      // Only refresh the transactions list after deletion
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(),
        exact: true,
      });
      toast.success('Transaksi berhasil dihapus');
    }
  });

  return {
    addTransaction: addMutation.mutateAsync,
    updateTransaction: (id: string, data: UpdateTransactionData) => 
      updateMutation.mutateAsync({ id, data }),
    deleteTransaction: deleteMutation.mutateAsync,
    isLoading: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
};