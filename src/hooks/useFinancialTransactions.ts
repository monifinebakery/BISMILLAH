import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FinancialTransaction } from '@/types/financial'; // Pastikan FinancialTransaction diimpor dari types/financial
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
import { safeParseDate } from '@/hooks/useSupabaseSync'; // MODIFIED: Import safeParseDate

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
        .order('tanggal', { ascending: false }); // Order by 'tanggal'

      if (error) {
        console.error('Error loading financial transactions:', error);
        toast.error(`Gagal memuat transaksi keuangan: ${error.message}`);
      } else {
        const transformedData = data.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal), // Gunakan safeParseDate secara langsung, sekarang mengembalikan Date | null
          jenis: item.type, // DB: type -> local: jenis
          deskripsi: item.deskripsi,
          jumlah: parseFloat(item.amount) || 0, // DB: amount -> local: jumlah
          category: item.category, // MODIFIED: Muat category
          createdAt: safeParseDate(item.created_at) || new Date(), // Pastikan selalu Date yang valid
          updatedAt: safeParseDate(item.updated_at) || new Date(), // Pastikan selalu Date yang valid
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

  const addFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
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
        tanggal: transaction.tanggal instanceof Date ? transaction.tanggal.toISOString() : null, // MODIFIED: Cek instanceof Date
        type: transaction.jenis, // Local: jenis -> DB: type
        deskripsi: transaction.deskripsi,
        amount: transaction.jumlah, // Local: jumlah -> DB: amount
        category: transaction.category, // MODIFIED: Simpan category
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

      if (updates.tanggal !== undefined) {
        updateData.tanggal = updates.tanggal instanceof Date ? updates.tanggal.toISOString() : null; // MODIFIED: Cek instanceof Date
      } else if (updates.tanggal === null) {
        updateData.tanggal = null;
      }
      if (updates.jenis !== undefined) updateData.type = updates.jenis;
      if (updates.deskripsi !== undefined) updateData.deskripsi = updates.deskripsi;
      if (updates.jumlah !== undefined) updateData.amount = updates.jumlah;
      if (updates.category !== undefined) updateData.category = updates.category; // MODIFIED: Update category

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
