// src/hooks/financial/useFinancialTransactions.ts - Financial Transaction Operations
import { useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface UseFinancialTransactionsProps {
  addTransaction: (data: any) => Promise<{ success: boolean; error?: string }>;
  updateTransaction: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useFinancialTransactions = ({
  addTransaction,
  updateTransaction,
  deleteTransaction,
}: UseFinancialTransactionsProps) => {

  const handleDeleteTransaction = useCallback(async (id: string) => {
    try {
      logger.info('Deleting transaction', { id });
      const result = await deleteTransaction(id);
      if (result.success) {
        toast.success('Transaksi berhasil dihapus');
        logger.info('Transaction deleted successfully', { id });
        return true;
      } else {
        toast.error(result.error || 'Gagal menghapus transaksi');
        logger.error('Failed to delete transaction', { id, error: result.error });
        return false;
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan');
      logger.error('Exception while deleting transaction', error);
      return false;
    }
  }, [deleteTransaction]);

  const handleAddTransaction = useCallback(async (transactionData: any) => {
    try {
      logger.info('Adding new transaction', { transactionData });
      const result = await addTransaction(transactionData);
      if (result.success) {
        toast.success('Transaksi berhasil ditambahkan');
        logger.info('Transaction added successfully');
        return true;
      } else {
        toast.error(result.error || 'Gagal menambah transaksi');
        logger.error('Failed to add transaction', { error: result.error });
        return false;
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan');
      logger.error('Exception while adding transaction', error);
      return false;
    }
  }, [addTransaction]);

  const handleUpdateTransaction = useCallback(async (id: string, transactionData: any) => {
    try {
      logger.info('Updating transaction', { id, transactionData });
      const result = await updateTransaction(id, transactionData);
      if (result.success) {
        toast.success('Transaksi berhasil diperbarui');
        logger.info('Transaction updated successfully', { id });
        return true;
      } else {
        toast.error(result.error || 'Gagal memperbarui transaksi');
        logger.error('Failed to update transaction', { id, error: result.error });
        return false;
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan');
      logger.error('Exception while updating transaction', error);
      return false;
    }
  }, [updateTransaction]);

  return {
    handleDeleteTransaction,
    handleAddTransaction,
    handleUpdateTransaction,
  };
};