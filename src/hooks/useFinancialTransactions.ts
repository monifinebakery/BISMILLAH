
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FinancialTransaction } from '@/types/financial';

export const useFinancialTransactions = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        toast.error('Gagal memuat data transaksi');
        return;
      }

      const formattedTransactions = data?.map((item: any) => ({
        id: item.id,
        type: item.type as 'income' | 'expense',
        category: item.category,
        amount: parseFloat(item.amount) || 0,
        description: item.description,
        date: new Date(item.date),
        createdAt: new Date(item.created_at),
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error in loadTransactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah transaksi');
        return false;
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: session.user.id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        toast.error('Gagal menambah transaksi');
        return false;
      }

      await loadTransactions();
      toast.success('Transaksi berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addTransaction:', error);
      toast.error('Gagal menambah transaksi');
      return false;
    }
  };

  const updateTransaction = async (id: string, transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate transaksi');
        return false;
      }

      const { error } = await supabase
        .from('financial_transactions')
        .update({
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date.toISOString().split('T')[0],
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating transaction:', error);
        toast.error('Gagal mengupdate transaksi');
        return false;
      }

      await loadTransactions();
      toast.success('Transaksi berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error in updateTransaction:', error);
      toast.error('Gagal mengupdate transaksi');
      return false;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus transaksi');
        return false;
      }

      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Gagal menghapus transaksi');
        return false;
      }

      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      toast.success('Transaksi berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      toast.error('Gagal menghapus transaksi');
      return false;
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    loading,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
