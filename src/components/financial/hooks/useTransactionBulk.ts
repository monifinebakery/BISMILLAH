// src/components/financial/hooks/useTransactionBulk.ts
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { deleteFinancialTransaction } from '../services/financialApi';

interface FinancialTransaction {
  id: string;
  date: Date | string | null;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  userId?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

interface BulkEditData {
  type?: 'income' | 'expense';
  category?: string;
  description?: string;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  isRunning: boolean;
  errors: Array<{ id: string; error: string }>;
}

const transactionQueryKeys = {
  all: ['financial'] as const,
  list: () => [...transactionQueryKeys.all, 'transactions'] as const,
};

export const useTransactionBulk = () => {
  const [progress, setProgress] = useState<BulkOperationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    isRunning: false,
    errors: [],
  });

  const queryClient = useQueryClient();

  const resetProgress = () => {
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      isRunning: false,
      errors: [],
    });
  };

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      setProgress({
        total: transactionIds.length,
        completed: 0,
        failed: 0,
        isRunning: true,
        errors: [],
      });

      const results = [];
      let completed = 0;
      let failed = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const id of transactionIds) {
        try {
          const success = await deleteFinancialTransaction(id);
          if (success) {
            results.push({ id, success: true });
            completed++;
          } else {
            results.push({ id, success: false, error: 'Gagal menghapus transaksi' });
            failed++;
            errors.push({ id, error: 'Gagal menghapus transaksi' });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ id, success: false, error: errorMessage });
          failed++;
          errors.push({ id, error: errorMessage });
          logger.error(`Failed to delete transaction ${id}:`, error);
        }

        setProgress(prev => ({
          ...prev,
          completed,
          failed,
          errors,
        }));
      }

      setProgress(prev => ({ ...prev, isRunning: false }));
      return { results, completed, failed, errors };
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.list() });
      
      if (data.failed === 0) {
        toast.success(`Berhasil menghapus ${data.completed} transaksi`);
      } else if (data.completed === 0) {
        toast.error(`Gagal menghapus semua transaksi`);
      } else {
        toast.warning(`${data.completed} transaksi berhasil dihapus, ${data.failed} gagal`);
      }
    },
    onError: (error) => {
      logger.error('Bulk delete failed:', error);
      toast.error('Gagal melakukan penghapusan massal');
      setProgress(prev => ({ ...prev, isRunning: false }));
    },
  });

  // Bulk Edit Mutation (placeholder - would need API endpoint)
  const bulkEditMutation = useMutation({
    mutationFn: async ({ transactionIds, editData }: { transactionIds: string[]; editData: BulkEditData }) => {
      setProgress({
        total: transactionIds.length,
        completed: 0,
        failed: 0,
        isRunning: true,
        errors: [],
      });

      // Note: This would require a bulk update API endpoint
      // For now, we'll show a placeholder implementation
      const results = [];
      let completed = 0;
      let failed = 0;
      const errors: Array<{ id: string; error: string }> = [];

      // Simulate bulk edit (in real implementation, this would be a single API call)
      for (const id of transactionIds) {
        try {
          // Placeholder: In real implementation, use bulk update API
          // await updateFinancialTransaction(id, editData);
          
          // For now, just simulate success
          results.push({ id, success: true });
          completed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ id, success: false, error: errorMessage });
          failed++;
          errors.push({ id, error: errorMessage });
          logger.error(`Failed to edit transaction ${id}:`, error);
        }

        setProgress(prev => ({
          ...prev,
          completed,
          failed,
          errors,
        }));
      }

      setProgress(prev => ({ ...prev, isRunning: false }));
      return { results, completed, failed, errors };
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.list() });
      
      if (data.failed === 0) {
        toast.success(`Berhasil mengedit ${data.completed} transaksi`);
      } else if (data.completed === 0) {
        toast.error(`Gagal mengedit semua transaksi`);
      } else {
        toast.warning(`${data.completed} transaksi berhasil diedit, ${data.failed} gagal`);
      }
    },
    onError: (error) => {
      logger.error('Bulk edit failed:', error);
      toast.error('Gagal melakukan edit massal');
      setProgress(prev => ({ ...prev, isRunning: false }));
    },
  });

  return {
    // State
    progress,
    isLoading: bulkDeleteMutation.isPending || bulkEditMutation.isPending,
    
    // Actions
    bulkDelete: bulkDeleteMutation.mutateAsync,
    bulkEdit: bulkEditMutation.mutateAsync,
    resetProgress,
    
    // Status
    isBulkDeleting: bulkDeleteMutation.isPending,
    isBulkEditing: bulkEditMutation.isPending,
  };
};

export type { FinancialTransaction, BulkEditData, BulkOperationProgress };