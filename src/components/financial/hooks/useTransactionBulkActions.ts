import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { logger } from '@/utils/logger';

import { bulkDeleteFinancialTransactions } from '../services/financialApi';

const transactionQueryKeys = {
  all: ['financial'] as const,
};

interface UseTransactionBulkActionsParams {
  userId?: string;
  onSuccess?: () => void;
}

interface BulkDeleteResult {
  ids: string[];
}

export interface UseTransactionBulkActionsResult {
  bulkDeleteTransactions: (ids: string[]) => Promise<BulkDeleteResult>;
  isBulkDeleting: boolean;
}

export const useTransactionBulkActions = (
  { userId, onSuccess }: UseTransactionBulkActionsParams = {},
): UseTransactionBulkActionsResult => {
  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!userId) {
        throw new Error('User belum terautentikasi');
      }

      await bulkDeleteFinancialTransactions(ids, userId);
      return { ids } satisfies BulkDeleteResult;
    },
    onSuccess: ({ ids }) => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all });
      onSuccess?.();

      toast.success(`${ids.length} transaksi berhasil dihapus`);
    },
    onError: (error: Error) => {
      logger.error('Bulk delete failed:', error);
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
  });

  const bulkDeleteTransactions = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) {
        return { ids };
      }

      return bulkDeleteMutation.mutateAsync(ids);
    },
    [bulkDeleteMutation],
  );

  return {
    bulkDeleteTransactions,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
};
