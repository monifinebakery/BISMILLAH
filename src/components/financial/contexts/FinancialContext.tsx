// src/financial/contexts/FinancialContext.tsx
// ADJUSTED VERSION - Compatible dengan system yang sudah dibuat

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Local imports
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';

// ✅ FIXED: Import dengan path yang benar sesuai struktur folder
import { 
  FinancialTransaction, 
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData 
} from '../types/financial'; // Relative path ke financial/types/financial.ts

// ✅ FIXED: Import dari utils yang sudah ada
import { 
  safeParseDate, 
  toSafeISOString 
} from '@/utils/unifiedDateUtils';

import { 
  validateTransaction,
  formatTransactionForDisplay 
} from '../utils/financialUtils'; // Relative path ke financial/utils/financialUtils.ts

// ✅ FIXED: Import API functions dari services
import {
  addFinancialTransaction as apiAddTransaction,
  updateFinancialTransaction as apiUpdateTransaction,
  deleteFinancialTransaction as apiDeleteTransaction,
  getFinancialTransactions
} from '../services/financialApi'; // Relative path ke financial/services/financialApi.ts

// ===========================================
// CONTEXT SETUP
// ===========================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// ===========================================
// HELPER FUNCTIONS (Updated untuk match API)
// ===========================================

/**
 * Transform database item to FinancialTransaction
 * ✅ PERBAIKAN: Match dengan transform function di API
 */
const transformTransactionFromDB = (dbItem: any): FinancialTransaction => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      throw new Error('Invalid transaction data from database');
    }

    return {
      id: dbItem.id || '',
      userId: dbItem.user_id || '', // ✅ PERBAIKAN: snake_case → camelCase
      type: dbItem.type || 'expense',
      category: dbItem.category || null,
      amount: Number(dbItem.amount) || 0,
      description: dbItem.description || null,
      date: safeParseDate(dbItem.date) || new Date(),
      notes: dbItem.notes || null,
      relatedId: dbItem.related_id || null, // ✅ PERBAIKAN: snake_case → camelCase
      createdAt: safeParseDate(dbItem.created_at) || new Date(),
      updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
    };
  } catch (error) {
    logger.error('Error transforming transaction from DB:', error, dbItem);
    // Return safe fallback
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

/**
 * ✅ PERBAIKAN: Simplified untuk consistency dengan API
 */
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
      action_url: '/financial', // ✅ PERBAIKAN: Update URL
      is_read: false,
      is_archived: false
    });
  } catch (error) {
    logger.error('Error creating financial notification:', error);
  }
};

// ===========================================
// PROVIDER COMPONENT
// ===========================================

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // ===========================================
  // DATA FETCHING & REAL-TIME UPDATES
  // ===========================================

  useEffect(() => {
    if (!user) {
      setFinancialTransactions([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialTransactions = async () => {
      setIsLoading(true);
      logger.context('FinancialContext', 'Fetching initial transactions for user:', user.id);
      
      try {
        // ✅ PERBAIKAN: Use API function untuk consistency
        const transactions = await getFinancialTransactions(user.id);
        setFinancialTransactions(transactions);
        logger.context('FinancialContext', 'Loaded transactions:', transactions.length);
      } catch (error: any) {
        logger.error('Error fetching initial transactions:', error);
        toast.error(`Gagal memuat transaksi keuangan: ${error.message}`);
        
        await createFinancialNotification(
          addNotification,
          'error',
          '❌ Error Sistem',
          `Gagal memuat data transaksi: ${error.message}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialTransactions();

    // Real-time subscription
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

            if (payload.eventType === 'INSERT' && payload.new) {
              const newTransaction = transformTransactionFromDB(payload.new);
              setFinancialTransactions(current => 
                [newTransaction, ...current].sort((a, b) => 
                  (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
                )
              );
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedTransaction = transformTransactionFromDB(payload.new);
              setFinancialTransactions(current => 
                current.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
              );
            } else if (payload.eventType === 'DELETE' && payload.old?.id) {
              setFinancialTransactions(current => 
                current.filter(t => t.id !== payload.old.id)
              );
            }
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
  }, [user, addNotification]);

  // ===========================================
  // TRANSACTION MANAGEMENT FUNCTIONS
  // ===========================================

  /**
   * Add new financial transaction
   */
  const addTransaction = useCallback(async (data: CreateTransactionData): Promise<FinancialTransaction | null> => {
    if (!user) {
      toast.error('Harap login terlebih dahulu');
      return null;
    }

    try {
      setIsLoading(true);
      logger.context('FinancialContext', 'Adding new transaction:', data);

      // Validate transaction data
      const validationResult = validateTransaction(data);
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors.join(', ');
        toast.error(`Data tidak valid: ${errorMessage}`);
        logger.warn('Transaction validation failed:', validationResult.errors);
        return null;
      }

      // Call API to add transaction
      const newTransaction = await apiAddTransaction(data);
      
      // ✅ PERBAIKAN: Transaction akan otomatis ditambahkan via real-time subscription
      // Tidak perlu manual update state di sini

      // Create activity log
      if (addActivity) {
        await addActivity({
          type: 'financial_create',
          description: `Menambahkan transaksi ${data.type}: ${formatTransactionForDisplay(newTransaction)}`,
          relatedType: 'financial',
          relatedId: newTransaction.id,
          metadata: {
            transactionType: data.type,
            amount: data.amount,
            category: data.category
          }
        });
      }

      // Create notification
      await createFinancialNotification(
        addNotification,
        'success',
        '💰 Transaksi Ditambahkan',
        `${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.amount)} berhasil ditambahkan`,
        newTransaction.id
      );

      toast.success(`Transaksi ${data.type === 'income' ? 'pemasukan' : 'pengeluaran'} berhasil ditambahkan`);
      logger.context('FinancialContext', 'Transaction added successfully:', newTransaction.id);

      return newTransaction;
    } catch (error: any) {
      logger.error('Error adding transaction:', error);
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menambahkan transaksi: ${errorMessage}`);
      
      await createFinancialNotification(
        addNotification,
        'error',
        '❌ Error Transaksi',
        `Gagal menambahkan transaksi: ${errorMessage}`
      );

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, addActivity, addNotification]);

  /**
   * Update existing transaction
   */
  const updateTransaction = useCallback(async (id: string, data: UpdateTransactionData): Promise<FinancialTransaction | null> => {
    if (!user) {
      toast.error('Harap login terlebih dahulu');
      return null;
    }

    try {
      setIsLoading(true);
      logger.context('FinancialContext', 'Updating transaction:', id, data);

      // Find existing transaction
      const existingTransaction = financialTransactions.find(t => t.id === id);
      if (!existingTransaction) {
        toast.error('Transaksi tidak ditemukan');
        return null;
      }

      // Validate transaction data
      const validationResult = validateTransaction(data);
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors.join(', ');
        toast.error(`Data tidak valid: ${errorMessage}`);
        logger.warn('Transaction validation failed:', validationResult.errors);
        return null;
      }

      // Call API to update transaction
      const updatedTransaction = await apiUpdateTransaction(id, data);

      // ✅ PERBAIKAN: Transaction akan otomatis diupdate via real-time subscription
      // Tidak perlu manual update state di sini

      // Create activity log
      if (addActivity) {
        await addActivity({
          type: 'financial_update',
          description: `Mengupdate transaksi: ${formatTransactionForDisplay(updatedTransaction)}`,
          relatedType: 'financial',
          relatedId: updatedTransaction.id,
          metadata: {
            transactionType: updatedTransaction.type,
            amount: updatedTransaction.amount,
            category: updatedTransaction.category,
            previousAmount: existingTransaction.amount
          }
        });
      }

      // Create notification
      await createFinancialNotification(
        addNotification,
        'info',
        '📝 Transaksi Diperbarui',
        `Transaksi ${formatTransactionForDisplay(updatedTransaction)} berhasil diperbarui`,
        updatedTransaction.id
      );

      toast.success('Transaksi berhasil diperbarui');
      logger.context('FinancialContext', 'Transaction updated successfully:', updatedTransaction.id);

      return updatedTransaction;
    } catch (error: any) {
      logger.error('Error updating transaction:', error);
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal memperbarui transaksi: ${errorMessage}`);
      
      await createFinancialNotification(
        addNotification,
        'error',
        '❌ Error Update',
        `Gagal memperbarui transaksi: ${errorMessage}`
      );

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, financialTransactions, addActivity, addNotification]);

  /**
   * Delete transaction
   */
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Harap login terlebih dahulu');
      return false;
    }

    try {
      setIsLoading(true);
      logger.context('FinancialContext', 'Deleting transaction:', id);

      // Find existing transaction for logging
      const existingTransaction = financialTransactions.find(t => t.id === id);
      if (!existingTransaction) {
        toast.error('Transaksi tidak ditemukan');
        return false;
      }

      // Call API to delete transaction
      await apiDeleteTransaction(id);

      // ✅ PERBAIKAN: Transaction akan otomatis dihapus via real-time subscription
      // Tidak perlu manual update state di sini

      // Create activity log
      if (addActivity) {
        await addActivity({
          type: 'financial_delete',
          description: `Menghapus transaksi: ${formatTransactionForDisplay(existingTransaction)}`,
          relatedType: 'financial',
          relatedId: id,
          metadata: {
            transactionType: existingTransaction.type,
            amount: existingTransaction.amount,
            category: existingTransaction.category
          }
        });
      }

      // Create notification
      await createFinancialNotification(
        addNotification,
        'warning',
        '🗑️ Transaksi Dihapus',
        `Transaksi ${formatTransactionForDisplay(existingTransaction)} telah dihapus`,
        id
      );

      toast.success('Transaksi berhasil dihapus');
      logger.context('FinancialContext', 'Transaction deleted successfully:', id);

      return true;
    } catch (error: any) {
      logger.error('Error deleting transaction:', error);
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menghapus transaksi: ${errorMessage}`);
      
      await createFinancialNotification(
        addNotification,
        'error',
        '❌ Error Hapus',
        `Gagal menghapus transaksi: ${errorMessage}`
      );

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, financialTransactions, addActivity, addNotification]);

  // ===========================================
  // COMPUTED VALUES & UTILITIES
  // ===========================================

  /**
   * Get transactions by type
   */
  const getTransactionsByType = useCallback((type: 'income' | 'expense'): FinancialTransaction[] => {
    return financialTransactions.filter(transaction => transaction.type === type);
  }, [financialTransactions]);

  /**
   * Get transactions by date range
   */
  const getTransactionsByDateRange = useCallback((startDate: Date, endDate: Date): FinancialTransaction[] => {
    return financialTransactions.filter(transaction => {
      if (!transaction.date) return false;
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [financialTransactions]);

  /**
   * Calculate total balance
   */
  const totalBalance = React.useMemo(() => {
    return financialTransactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);
  }, [financialTransactions]);

  /**
   * Calculate total income
   */
  const totalIncome = React.useMemo(() => {
    return financialTransactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0);
  }, [financialTransactions]);

  /**
   * Calculate total expenses
   */
  const totalExpenses = React.useMemo(() => {
    return financialTransactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);
  }, [financialTransactions]);

  // ===========================================
  // CONTEXT VALUE
  // ===========================================

  const contextValue: FinancialContextType = {
    // State
    financialTransactions,
    isLoading,

    // Actions
    addTransaction,
    updateTransaction,
    deleteTransaction,

    // Utilities
    getTransactionsByType,
    getTransactionsByDateRange,

    // Computed values
    totalBalance,
    totalIncome,
    totalExpenses,
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

export default FinancialContext;