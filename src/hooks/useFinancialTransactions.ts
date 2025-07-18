import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FinancialTransaction } from '@/types/financial';
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
// --- PERBAIKAN KRITIS DISINI ---
// MODIFIED: Import safeParseDate dan toSafeISOString dari utils/dateUtils.ts (lokasi yang benar)
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; 

const STORAGE_KEY = 'hpp_app_financial_transactions'; // Pastikan ini benar untuk financial transactions

export const useFinancialTransactions = (userId: string | undefined, initialData?: FinancialTransaction[]) => {
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => 
    initialData || loadFromStorage(STORAGE_KEY, [])
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialTransactions = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading financial transactions:', error);
        toast.error(`Gagal memuat transaksi keuangan: ${error.message}`);
      } else {
        const transformedData = data.map((item: any) => ({
          id: item.id,
          date: safeParseDate(item.date) || null,
          type: item.type || 'pengeluaran',
          description: item.description || null,
          amount: parseFloat(item.amount) || 0,
          category: item.category || null,
          createdAt: safeParseDate(item.created_at) || null,
          updatedAt: safeParseDate(item.updated_at) || null,
          userId: item.user_id,
        }));
        setFinancialTransactions(transformedData);
        saveToStorage(STORAGE_KEY, transformedData);
      }
      setLoading(false);
    };

    fetchFinancialTransactions();
  }, [userId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, financialTransactions);
  }, [financialTransactions]);

  const addFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambahkan transaksi keuangan');
        return false;
      }

      const newTransactionId = generateUUID();
      const now = new Date();

      const { error } = await supabase.from('financial_transactions').insert({
        id: newTransactionId,
        user_id: session.user.id,
        date: toSafeISOString(transaction.date || now),
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
      if (error) {
        console.error('Error adding financial transaction to DB:', error);
        toast.error(`Gagal menambahkan transaksi keuangan: ${error.message}`);
        return false;
      }

      setFinancialTransactions(prev => [...prev, {
        ...transaction,
        id: newTransactionId,
        createdAt: now,
        updatedAt: now,
        userId: session.user.id,
      }]);
      toast.success(`Transaksi keuangan berhasil ditambahkan!`);
      return true;
    } catch (error) {
      console.error('Error in addFinancialTransaction:', error);
      toast.error('Gagal menambahkan transaksi keuangan');
      return false;
    }
  };

  const updateFinancialTransaction = async (id: string, updates: Partial<FinancialTransaction>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk memperbarui transaksi keuangan');
        return false;
      }

      const updateData: Partial<any> = {
        updated_at: toSafeISOString(new Date()),
      };

      if (updates.date !== undefined) updateData.date = toSafeISOString(updates.date);
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.category !== undefined) updateData.category = updates.category;

      const { error } = await supabase.from('financial_transactions').update(updateData).eq('id', id).eq('user_id', session.user.id);
      if (error) {
        console.error('Error updating financial transaction:', error);
        toast.error(`Gagal memperbarui transaksi keuangan: ${error.message}`);
        return false;
      }

      setFinancialTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? { ...transaction, ...updates, updatedAt: new Date() } : transaction
        )
      );
      toast.success(`Transaksi keuangan berhasil diperbarui!`);
      return true;
    } catch (error) {
      console.error('Error in updateFinancialTransaction:', error);
      toast.error('Gagal memperbarui transaksi keuangan');
      return false;
    }
  };

  const deleteFinancialTransaction = async (id: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus transaksi keuangan');
        return false;
      }

      const { error } = await supabase.from('financial_transactions').delete().eq('id', id).eq('user_id', session.user.id);
      if (error) {
        console.error('Error deleting financial transaction:', error);
        toast.error(`Gagal menghapus transaksi keuangan: ${error.message}`);
        return false;
      }

      setFinancialTransactions(prev => prev.filter(t => t.id !== id));
      toast.success(`Transaksi keuangan berhasil dihapus!`);
      return true;
    } catch (error) {
      console.error('Error in deleteFinancialTransaction:', error);
      toast.error('Gagal menghapus transaksi keuangan');
      return false;
    }
  };

  return {
    financialTransactions,
    loading,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
    setFinancialTransactions,
  };
};