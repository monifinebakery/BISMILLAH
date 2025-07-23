// src/contexts/FinancialContext.tsx
// VERSI REALTIME
// 🔔 UPDATED WITH NOTIFICATION SYSTEM

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinancialTransaction } from '@/types/financial'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
// 🔔 ADD NOTIFICATION IMPORTS
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; 

// --- INTERFACE & CONTEXT ---
interface FinancialContextType {
  financialTransactions: FinancialTransaction[];
  isLoading: boolean;
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>; 
  updateFinancialTransaction: (id: string, transaction: Partial<FinancialTransaction>) => Promise<boolean>;
  deleteFinancialTransaction: (id: string) => Promise<boolean>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();
  // 🔔 ADD NOTIFICATION CONTEXT
  const { addNotification } = useNotification();

  // --- HELPER FUNCTION ---
  const transformTransactionFromDB = (dbItem: any): FinancialTransaction => ({
    id: dbItem.id,
    date: safeParseDate(dbItem.date),
    description: dbItem.description,
    type: dbItem.type,
    category: dbItem.category,
    amount: Number(dbItem.amount) || 0,
    notes: dbItem.notes, 
    relatedId: dbItem.related_id,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  // --- EFEK UTAMA: FETCH DATA & REALTIME LISTENER ---
  useEffect(() => {
    if (!user) {
      setFinancialTransactions([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialTransactions = async () => {
      setIsLoading(true);
      console.log('[FinancialContext] Memulai fetchInitialTransactions untuk user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) {
          console.error('[FinancialContext] Error memuat transaksi awal:', error);
          toast.error(`Gagal memuat transaksi keuangan: ${error.message}`);
          
          // 🔔 CREATE ERROR NOTIFICATION
          await addNotification(createNotificationHelper.systemError(
            `Gagal memuat data transaksi keuangan: ${error.message}`
          ));
        } else if (data) {
          const transformedData = data.map(transformTransactionFromDB);
          console.log('[FinancialContext] Data transaksi awal berhasil dimuat (transformed):', transformedData);
          setFinancialTransactions(transformedData);
        }
      } catch (error) {
        console.error('[FinancialContext] Unexpected error:', error);
        await addNotification(createNotificationHelper.systemError(
          `Error tidak terduga saat memuat transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`
        ));
      } finally {
        setIsLoading(false);
        console.log('[FinancialContext] fetchInitialTransactions selesai.');
      }
    };

    fetchInitialTransactions();

    const channel = supabase
      .channel(`realtime-financial-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'financial_transactions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[FinancialContext] Perubahan realtime diterima:', payload);
          const transform = transformTransactionFromDB;
          if (payload.eventType === 'INSERT') {
            setFinancialTransactions(current => [transform(payload.new), ...current].sort((a,b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)));
          }
          if (payload.eventType === 'UPDATE') {
            setFinancialTransactions(current => current.map(t => t.id === payload.new.id ? transform(payload.new) : t));
          }
          if (payload.eventType === 'DELETE') {
            setFinancialTransactions(current => current.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]); // 🔔 ADD addNotification dependency

  // --- FUNGSI-FUNGSI ---
  const addFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
        toast.error("Anda harus login untuk menambah transaksi");
        return false;
    }
    
    try {
      const transactionToInsert = {
          user_id: user.id,
          date: toSafeISOString(transaction.date), 
          description: transaction.description,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          notes: transaction.notes ?? null, 
          related_id: transaction.relatedId ?? null, 
      };

      console.log('[FinancialContext] Mengirim transaksi keuangan:', transactionToInsert);
      const { error } = await supabase.from('financial_transactions').insert(transactionToInsert);
      
      if (error) {
        console.error('[FinancialContext] Error saat menambah transaksi keuangan:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Transaksi Keuangan Ditambahkan', 
        description: `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${transaction.amount.toLocaleString('id-ID')}`, 
        type: 'keuangan', 
        value: null 
      });

      // Success toast
      toast.success('Transaksi keuangan berhasil ditambahkan!');

      // 🔔 CREATE FINANCIAL NOTIFICATION
      await addNotification({
        title: transaction.type === 'income' ? '💰 Pemasukan Dicatat' : '💸 Pengeluaran Dicatat',
        message: `${transaction.description} - Rp ${transaction.amount.toLocaleString()}`,
        type: 'success',
        icon: transaction.type === 'income' ? 'trending-up' : 'trending-down',
        priority: 2,
        related_type: 'system',
        action_url: '/laporan',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[FinancialContext] Error adding transaction:', error);
      toast.error(`Gagal menambah transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menambah transaksi keuangan: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const updateFinancialTransaction = async (id: string, updatedTransaction: Partial<FinancialTransaction>): Promise<boolean> => {
    if (!user) {
        toast.error("Anda harus login untuk memperbarui transaksi");
        return false;
    }

    try {
      const dataToUpdate: {[key: string]: any} = {
          updated_at: new Date().toISOString(),
      };
      if (updatedTransaction.date !== undefined) dataToUpdate.date = toSafeISOString(updatedTransaction.date);
      if (updatedTransaction.description !== undefined) dataToUpdate.description = updatedTransaction.description;
      if (updatedTransaction.type !== undefined) dataToUpdate.type = updatedTransaction.type;
      if (updatedTransaction.category !== undefined) dataToUpdate.category = updatedTransaction.category;
      if (updatedTransaction.amount !== undefined) dataToUpdate.amount = updatedTransaction.amount;
      if (updatedTransaction.notes !== undefined) dataToUpdate.notes = updatedTransaction.notes;
      if (updatedTransaction.relatedId !== undefined) dataToUpdate.related_id = updatedTransaction.relatedId;
      
      console.log('[FinancialContext] Mengirim update transaksi keuangan:', id, dataToUpdate);
      const { error } = await supabase.from('financial_transactions').update(dataToUpdate).eq('id', id);
      
      if (error) {
        console.error('[FinancialContext] Error saat memperbarui transaksi keuangan:', error);
        throw new Error(error.message);
      }

      // Success toast
      toast.success('Transaksi keuangan berhasil diperbarui!');

      // 🔔 CREATE UPDATE NOTIFICATION
      await addNotification({
        title: '📝 Transaksi Diperbarui',
        message: `Transaksi keuangan "${updatedTransaction.description || 'transaksi'}" telah diperbarui`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'system',
        action_url: '/laporan',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[FinancialContext] Error updating transaction:', error);
      toast.error(`Gagal memperbarui transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const deleteFinancialTransaction = async (id: string): Promise<boolean> => {
    if (!user) {
        toast.error("Anda harus login untuk menghapus transaksi");
        return false;
    }

    try {
      const transaction = financialTransactions.find(t => t.id === id); 
      if (!transaction) {
        toast.error('Transaksi tidak ditemukan');
        return false;
      }

      console.log('[FinancialContext] Mengirim perintah hapus transaksi keuangan:', id);
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      
      if (error) {
        console.error('[FinancialContext] Error saat menghapus transaksi keuangan:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Transaksi Keuangan Dihapus', 
        description: `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${(transaction.amount ?? 0).toLocaleString('id-ID')} dihapus`, 
        type: 'keuangan', 
        value: null 
      });

      // Success toast
      toast.success('Transaksi keuangan berhasil dihapus!');

      // 🔔 CREATE DELETE NOTIFICATION
      await addNotification({
        title: '🗑️ Transaksi Dihapus',
        message: `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} "${transaction.description}" senilai Rp ${(transaction.amount ?? 0).toLocaleString('id-ID')} telah dihapus`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'system',
        action_url: '/laporan',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[FinancialContext] Error deleting transaction:', error);
      toast.error(`Gagal menghapus transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const value: FinancialContextType = {
    financialTransactions,
    isLoading,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  };

  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};