// src/contexts/FinancialContext.tsx
// VERSI REALTIME

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinancialTransaction } from '@/types/financial'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; // ✅ Pastikan toSafeISOString diimpor

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

  // --- HELPER FUNCTION ---
  const transformTransactionFromDB = (dbItem: any): FinancialTransaction => ({
    id: dbItem.id,
    date: safeParseDate(dbItem.date),
    description: dbItem.description,
    type: dbItem.type,
    category: dbItem.category,
    amount: Number(dbItem.amount) || 0,
    notes: dbItem.notes, // Asumsi ada kolom notes di DB
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
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        toast.error(`Gagal memuat transaksi keuangan: ${error.message}`);
      } else if (data) {
        setFinancialTransactions(data.map(transformTransactionFromDB));
      }
      setIsLoading(false);
    };

    fetchInitialTransactions();

    const channel = supabase
      .channel(`realtime-financial-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'financial_transactions', filter: `user_id=eq.${user.id}` },
        (payload) => {
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
  }, [user]);

  // --- FUNGSI-FUNGSI ---
  const addFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
        toast.error("Anda harus login untuk menambah transaksi");
        return false;
    }
    
    const transactionToInsert = {
        user_id: user.id,
        date: toSafeISOString(transaction.date), // Menggunakan toSafeISOString
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        notes: transaction.notes ?? null, // Default notes ke null
        related_id: transaction.relatedId ?? null, // Default relatedId ke null
    };

    const { error } = await supabase.from('financial_transactions').insert(transactionToInsert);
    if (error) {
      toast.error(`Gagal menambah transaksi: ${error.message}`);
      return false;
    }
    
    // Perhatikan: 'pemasukan' atau 'pengeluaran' harus sesuai dengan tipe di DB/UI
    addActivity({ title: 'Transaksi Keuangan Ditambahkan', description: `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${transaction.amount.toLocaleString('id-ID')}`, type: 'keuangan', value: null });
    toast.success('Transaksi keuangan berhasil ditambahkan!');
    return true;
  };

  const updateFinancialTransaction = async (id: string, updatedTransaction: Partial<FinancialTransaction>): Promise<boolean> => {
    if (!user) {
        toast.error("Anda harus login untuk memperbarui transaksi");
        return false;
    }
    // Transformasi ke snake_case untuk update
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
    
    const { error } = await supabase.from('financial_transactions').update(dataToUpdate).eq('id', id);
    if (error) {
      toast.error(`Gagal memperbarui transaksi: ${error.message}`);
      return false;
    }
    toast.success('Transaksi keuangan berhasil diperbarui!');
    return true;
  };

  const deleteFinancialTransaction = async (id: string): Promise<boolean> => {
    if (!user) {
        toast.error("Anda harus login untuk menghapus transaksi");
        return false;
    }
    const transaction = financialTransactions.find(t => t.id === id); 
    if (!transaction) return false;

    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) {
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
      return false;
    }
    
    addActivity({ title: 'Transaksi Keuangan Dihapus', description: `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${(transaction.amount ?? 0).toLocaleString('id-ID')} dihapus`, type: 'keuangan', value: null });
    toast.success('Transaksi keuangan berhasil dihapus!');
    return true;
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