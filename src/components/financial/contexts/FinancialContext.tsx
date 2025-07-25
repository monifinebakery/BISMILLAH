// src/contexts/FinancialContext.tsx
// MODULAR VERSION - Clean, organized, and type-safe

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Local imports
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';

// Financial module imports
import { 
  FinancialTransaction, 
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData 
} from '@/components/financial';

import { 
  safeParseDate, 
  toSafeISOString 
} from '@/utils/unifiedDateUtils';

import { 
  validateTransaction,
  formatTransactionForDisplay 
} from '../utils/financialUtils';

// ===========================================
// CONTEXT SETUP
// ===========================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Transform database item to FinancialTransaction
 */
const transformTransactionFromDB = (dbItem: any): FinancialTransaction => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      throw new Error('Invalid transaction data from database');
    }

    return {
      id: dbItem.id || '',
      date: safeParseDate(dbItem.date) || new Date(),
      description: dbItem.description || null,
      type: dbItem.type || 'expense',
      category: dbItem.category || null,
      amount: Number(dbItem.amount) || 0,
      notes: dbItem.notes || null,
      relatedId: dbItem.related_id || null,
      userId: dbItem.user_id || '',
      createdAt: safeParseDate(dbItem.created_at) || new Date(),
      updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
    };
  } catch (error) {
    console.error('Error transforming transaction from DB:', error, dbItem);
    // Return safe fallback
    return {
      id: dbItem?.id || 'error',
      date: new Date(),
      description: 'Error loading transaction',
      type: 'expense',
      category: null,
      amount: 0,
      notes: null,
      relatedId: null,
      userId: dbItem?.user_id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

/**
 * Transform transaction for database insert/update
 */
const transformTransactionForDB = (
  transaction: CreateTransactionData | UpdateTransactionData,
  userId: string
): Record<string, any> => {
  const dbData: Record<string, any> = {
    user_id: userId,
  };

  // Only add fields that are defined
  if (transaction.date !== undefined) {
    dbData.date = toSafeISOString(transaction.date);
  }
  if (transaction.description !== undefined) {
    dbData.description = transaction.description;
  }
  if (transaction.type !== undefined) {
    dbData.type = transaction.type;
  }
  if (transaction.category !== undefined) {
    dbData.category = transaction.category;
  }
  if (transaction.amount !== undefined) {
    dbData.amount = transaction.amount;
  }
  if (transaction.notes !== undefined) {
    dbData.notes = transaction.notes;
  }
  if (transaction.relatedId !== undefined) {
    dbData.related_id = transaction.relatedId;
  }

  return dbData;
};

/**
 * Create notification for financial transaction
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
      action_url: '/laporan',
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
        const { data, error } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          const transformedData = data
            .map(item => {
              try {
                return transformTransactionFromDB(item);
              } catch (transformError) {
                console.error('Error transforming individual transaction:', transformError, item);
                return null;
              }
            })
            .filter(Boolean) as FinancialTransaction[];

          setFinancialTransactions(transformedData);
          logger.context('FinancialContext', 'Loaded transactions:', transformedData.length);
        }
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
  // CRUD OPERATIONS
  // ===========================================

  const addFinancialTransaction = useCallback(async (
    transaction: CreateTransactionData
  ): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menambah transaksi");
      return false;
    }

    // Validate transaction
    const validationError = validateTransaction(transaction as FinancialTransaction);
    if (validationError) {
      toast.error(validationError);
      return false;
    }

    try {
      const transactionToInsert = transformTransactionForDB(transaction, user.id);
      
      logger.context('FinancialContext', 'Adding transaction:', transactionToInsert);
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactionToInsert);
      
      if (error) {
        throw new Error(error.message);
      }
      
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

    try {
      const dataToUpdate = {
        ...transformTransactionForDB(updatedTransaction, user.id),
        updated_at: new Date().toISOString(),
      };
      
      logger.context('FinancialContext', 'Updating transaction:', id, dataToUpdate);
      
      const { error } = await supabase
        .from('financial_transactions')
        .update(dataToUpdate)
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }

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

    try {
      logger.context('FinancialContext', 'Deleting transaction:', id);
      
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
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

  // ===========================================
  // CONTEXT VALUE
  // ===========================================

  const value: FinancialContextType = {
    financialTransactions,
    isLoading,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

// ===========================================
// CUSTOM HOOK
// ===========================================

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// ===========================================
// EXPORTS
// ===========================================

export default FinancialProvider;