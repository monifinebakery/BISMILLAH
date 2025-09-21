// src/components/financial/hooks/crud/useFinancialOperations.ts
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

// Hook imports (clean dependencies)
import { financialQueryKeys } from '../../hooks/useFinancialHooks';

// Context imports
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Add transaction mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateTransactionData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return addFinancialTransaction(data, user.id);
    },
    onMutate: async (newTransaction) => {
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      await queryClient.cancelQueries({
        queryKey: transactionsKey
      });

      const previousTransactions = queryClient.getQueryData(
        transactionsKey
      );

      // Optimistic update
      const optimisticTransaction: FinancialTransaction = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        type: newTransaction.type,
        amount: newTransaction.amount,
        category: newTransaction.category ?? null,
        description: newTransaction.description ?? null,
        relatedId: newTransaction.relatedId ?? null,
        date: newTransaction.date ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(
        transactionsKey,
        (old: FinancialTransaction[] = []) => [optimisticTransaction, ...old]
      );

      return { previousTransactions };
    },
    onError: (error: any, variables, context) => {
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      if (context?.previousTransactions) {
        queryClient.setQueryData(
          transactionsKey,
          context.previousTransactions
        );
      }
      toast.error(`Gagal menambahkan transaksi: ${error.message}`);
    },
    onSuccess: () => {
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      // Only refresh the transactions list; optimistic update already updated UI
      queryClient.invalidateQueries({
        queryKey: transactionsKey,
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
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      await queryClient.cancelQueries({
        queryKey: transactionsKey
      });

      const previousTransactions = queryClient.getQueryData(
        transactionsKey
      );

      queryClient.setQueryData(
        transactionsKey,
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
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      if (context?.previousTransactions) {
        queryClient.setQueryData(
          transactionsKey,
          context.previousTransactions
        );
      }
      toast.error(`Gagal memperbarui transaksi: ${error.message}`);
    },
    onSuccess: () => {
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      // Only refresh the transactions list to avoid global refetch storms
      queryClient.invalidateQueries({
        queryKey: transactionsKey,
        exact: true,
      });
      toast.success('Transaksi berhasil diperbarui');
    }
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onMutate: async (id) => {
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      await queryClient.cancelQueries({
        queryKey: transactionsKey
      });

      const previousTransactions = queryClient.getQueryData(
        transactionsKey
      ) as FinancialTransaction[];

      queryClient.setQueryData(
        transactionsKey,
        (old: FinancialTransaction[] = []) => old.filter(t => t.id !== id)
      );

      return { previousTransactions };
    },
    onError: (error: any, id, context) => {
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      if (context?.previousTransactions) {
        queryClient.setQueryData(
          transactionsKey,
          context.previousTransactions
        );
      }
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
    onSuccess: () => {
      const transactionsKey = financialQueryKeys.transactions(user?.id);

      // Only refresh the transactions list after deletion
      queryClient.invalidateQueries({
        queryKey: transactionsKey,
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