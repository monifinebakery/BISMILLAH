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

// ✅ PERBAIKAN: Import dari types yang sudah ada
import { 
  FinancialTransaction, 
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData 
} from './types/financial'; // Updated path

// ✅ PERBAIKAN: Import dari utils yang sudah ada
import { 
  safeParseDate, 
  toSafeISOString 
} from '@/utils/unifiedDateUtils';

import { 
  validateTransaction,
  formatTransactionForDisplay 
} from './utils/financialUtils'; // Updated path

// ✅ TAMBAHAN: Import API functions untuk consistency
import {
  addFinancialTransaction as apiAddTransaction,
  updateFinancialTransaction as apiUpdateTransaction,
  deleteFinancialTransaction as apiDeleteTransaction,
  getFinancialTransactions
} from './services/financialApi';

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
    console.error('Error transforming transaction from DB:', error, dbItem);
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
    console.error('Error creating financial notification:', error);
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
        console.error('Error fetching initial transactions:', error);
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
            console.error('Real-time update error:', error);
            toast.error('Error dalam pembaruan real-time data keuangan');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  // ===========================================
  // CRUD OPERATIONS (✅ PERBAIKAN: Use API functions)
  // ===========================================

  const addFinancialTransaction = useCallback(async (
    transaction: CreateTransactionData
  ): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menambah transaksi");
      return false;
    }

    // ✅ PERBAIKAN: Use API function
    try {
      const result = await apiAddTransaction(transaction, user.id);
      
      if (result.success) {
        // Format transaction for display
        const formatted = formatTransactionForDisplay(transaction as FinancialTransaction);
        
        // Activity log
        if (addActivity && typeof addActivity === 'function') {
          addActivity({ 
            title: 'Transaksi Keuangan Ditambahkan', 
            description: `${formatted.typeLabel} ${formatted.amountFormatted}`, 
            type: 'keuangan', 
            value: null 
          });
        }

        // Success toast
        toast.success('Transaksi keuangan berhasil ditambahkan!');

        // Success notification
        await createFinancialNotification(
          addNotification,
          'success',
          transaction.type === 'income' ? '💰 Pemasukan Dicatat' : '💸 Pengeluaran Dicatat',
          `${transaction.description} - ${formatted.amountFormatted}`
        );

        return true;
      } else {
        toast.error(result.error || 'Gagal menambah transaksi');
        return false;
      }
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast.error(`Gagal menambah transaksi: ${error.message}`);
      
      await createFinancialNotification(
        addNotification,
        'error',
        '❌ Transaksi Gagal',
        `Gagal menambah transaksi: ${error.message}`
      );
      
      return false;
    }
  }, [user, addActivity, addNotification]);

  const updateFinancialTransaction = useCallback(async (
    id: string, 
    updatedTransaction: UpdateTransactionData
  ): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk memperbarui transaksi");
      return false;
    }

    if (!id || typeof id !== 'string') {
      toast.error('ID transaksi tidak valid');
      return false;
    }

    // ✅ PERBAIKAN: Use API function
    try {
      const result = await apiUpdateTransaction(id, updatedTransaction);
      
      if (result.success) {
        // Success toast
        toast.success('Transaksi keuangan berhasil diperbarui!');

        // Update notification
        await createFinancialNotification(
          addNotification,
          'info',
          '📝 Transaksi Diperbarui',
          `Transaksi "${updatedTransaction.description || 'transaksi'}" telah diperbarui`,
          id
        );

        return true;
      } else {
        toast.error(result.error || 'Gagal memperbarui transaksi');
        return false;
      }
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast.error(`Gagal memperbarui transaksi: ${error.message}`);
      
      await createFinancialNotification(
        addNotification,
        'error',
        '❌ Update Gagal',
        `Gagal memperbarui transaksi: ${error.message}`,
        id
      );
      
      return false;
    }
  }, [user, addNotification]);

  const deleteFinancialTransaction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menghapus transaksi");
      return false;
    }

    if (!id || typeof id !== 'string') {
      toast.error('ID transaksi tidak valid');
      return false;
    }

    const transactionToDelete = financialTransactions.find(t => t.id === id);
    if (!transactionToDelete) {
      toast.error('Transaksi tidak ditemukan');
      return false;
    }

    // ✅ PERBAIKAN: Use API function
    try {
      const result = await apiDeleteTransaction(id);
      
      if (result.success) {
        const formatted = formatTransactionForDisplay(transactionToDelete);
        
        // Activity log
        if (addActivity && typeof addActivity === 'function') {
          addActivity({ 
            title: 'Transaksi Keuangan Dihapus', 
            description: `${formatted.typeLabel} ${formatted.amountFormatted} dihapus`, 
            type: 'keuangan', 
            value: null 
          });
        }

        // Success toast
        toast.success('Transaksi keuangan berhasil dihapus!');

        // Delete notification
        await createFinancialNotification(
          addNotification,
          'warning',
          '🗑️ Transaksi Dihapus',
          `${formatted.typeLabel} "${transactionToDelete.description}" senilai ${formatted.amountFormatted} telah dihapus`,
          id
        );

        return true;
      } else {
        toast.error(result.error || 'Gagal menghapus transaksi');
        return false;
      }
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
      
      await createFinancialNotification(
        addNotification,
        'error',
        '❌ Hapus Gagal',
        `Gagal menghapus transaksi: ${error.message}`,
        id
      );
      
      return false;
    }
  }, [user, financialTransactions, addActivity, addNotification]);

  // ✅ TAMBAHAN: Utility functions untuk integration
  const refreshTransactions = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const transactions = await getFinancialTransactions(user.id);
      setFinancialTransactions(transactions);
    } catch (error: any) {
      console.error('Error refreshing transactions:', error);
      toast.error(`Gagal memuat ulang data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getTransactionById = useCallback((id: string): FinancialTransaction | undefined => {
    return financialTransactions.find(t => t.id === id);
  }, [financialTransactions]);

  const getTransactionsByDateRange = useCallback((from: Date, to: Date): FinancialTransaction[] => {
    return financialTransactions.filter(t => {
      const transactionDate = t.date ? new Date(t.date) : new Date();
      return transactionDate >= from && transactionDate <= to;
    });
  }, [financialTransactions]);

  // ===========================================
  // CONTEXT VALUE (✅ ENHANCED)
  // ===========================================

  const value: FinancialContextType & {
    // ✅ TAMBAHAN: Extra utilities
    refreshTransactions: () => Promise<void>;
    getTransactionById: (id: string) => FinancialTransaction | undefined;
    getTransactionsByDateRange: (from: Date, to: Date) => FinancialTransaction[];
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  } = {
    // Original context methods
    financialTransactions,
    isLoading,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
    
    // ✅ TAMBAHAN: Extra utilities
    refreshTransactions,
    getTransactionById,
    getTransactionsByDateRange,
    
    // ✅ TAMBAHAN: Computed values
    totalTransactions: financialTransactions.length,
    totalIncome: financialTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: financialTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    balance: financialTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) - 
      financialTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

// ===========================================
// CUSTOM HOOK (✅ ENHANCED)
// ===========================================

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// ✅ TAMBAHAN: Specialized hooks
export const useFinancialSummary = () => {
  const { totalIncome, totalExpense, balance, totalTransactions } = useFinancial();
  return { totalIncome, totalExpense, balance, totalTransactions };
};

export const useFinancialTransactions = (filters?: {
  type?: 'income' | 'expense';
  category?: string;
  dateRange?: { from: Date; to: Date };
}) => {
  const { financialTransactions, getTransactionsByDateRange } = useFinancial();
  
  return useMemo(() => {
    let filtered = financialTransactions;
    
    if (filters?.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    if (filters?.dateRange) {
      filtered = getTransactionsByDateRange(filters.dateRange.from, filters.dateRange.to);
    }
    
    return filtered;
  }, [financialTransactions, filters, getTransactionsByDateRange]);
};

// ===========================================
// EXPORTS
// ===========================================

export default FinancialProvider;