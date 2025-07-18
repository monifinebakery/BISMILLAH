import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner'; // <-- PASTIKAN BARIS INI ADA DI PALING ATAS
import { FinancialTransaction } from '@/types/financial'; // Pastikan FinancialTransaction diimpor dari types/financial
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
import { safeParseDate } from '@/utils/dateUtils'; // <-- MODIFIKASI: Import safeParseDate dari utils/dateUtils.ts

const STORAGE_KEY = 'hpp_app_financial_transactions';

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
        .order('created_at', { ascending: false }); // Urutkan berdasarkan created_at, lebih umum untuk transaksi

      if (error) {
        console.error('Error loading financial transactions:', error);
        toast.error(`Gagal memuat transaksi keuangan: ${error.message}`);
      } else {
        const transformedData = data.map((item: any) => ({
          id: item.id,
          date: safeParseDate(item.date) || null, // safeParseDate sekarang mengembalikan Date | null
          type: item.type || 'pengeluaran', // DB: type -> local: type (default ke pengeluaran jika null)
          description: item.description || null,
          amount: parseFloat(item.amount) || 0, // Pastikan selalu number
          category: item.category || null,
          createdAt: safeParseDate(item.created_at) || null, // Pastikan Date | null
          updatedAt: safeParseDate(item.updated_at) || null, // Pastikan Date | null
          userId: item.user_id, // Tambahkan userId agar lengkap
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
        date: transaction.date ? transaction.date.toISOString() : toSafeISOString(now), // Pastikan tanggal selalu dikirim
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
        userId: session.user.id, // Pastikan userId ada
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
        updated_at: new Date().toISOString(),
      };

      // Konversi tanggal ke ISO string dengan aman
      if (updates.date !== undefined) updateData.date = updates.date ? updates.date.toISOString() : null;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.category !== undefined) updateData.category = updates.category;
      // Jangan update created_at atau user_id dari sini

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

      setFinancialTransactions(prev => prev.filter(t => t.id !== id)); // <-- AKTIFKAN KEMBALI UNTUK OPTIMISTIC UI
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
    setFinancialTransactions, // Mungkin perlu diekspor jika diubah di luar hook
  };
};