
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PurchaseItem {
  id: string;
  bahanBakuId: string;
  namaBarang: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

export interface PurchaseTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  tanggal: Date;
  items: PurchaseItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  metodePerhitungan?: string;
  catatan?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .order('tanggal', { ascending: false });

      if (error) {
        console.error('Error loading purchases:', error);
        toast.error('Gagal memuat data pembelian');
        return;
      }

      const formattedPurchases = data?.map((item: any) => ({
        id: item.id,
        supplierId: item.supplier || '',
        supplierName: item.supplier || '',
        tanggal: safeParseDate(item.tanggal) || new Date(), // Pastikan selalu Date yang valid
        items: item.items || [],
        totalAmount: parseFloat(item.total_nilai) || 0,
        status: item.status || 'pending',
        metodePerhitungan: item.metode_perhitungan,
        catatan: item.catatan,
        createdAt: safeParseDate(item.created_at) || new Date(), // Pastikan selalu Date yang valid
        updatedAt: safeParseDate(item.updated_at) || new Date(), // Pastikan selalu Date yang valid
      })) || [];

      setPurchases(formattedPurchases);
    } catch (error) {
      console.error('Error in loadPurchases:', error);
      toast.error('Gagal memuat data pembelian');
    } finally {
      setLoading(false);
    }
  };

  const addPurchase = async (purchase: Omit<PurchaseTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah pembelian');
        return false;
      }

      const { data, error } = await supabase
        .from('purchases')
        .insert({
          user_id: session.user.id,
          tanggal: purchase.tanggal instanceof Date && !isNaN(purchase.tanggal.getTime())   ? purchase.tanggal.toISOString()   : null,
          supplier: purchase.supplierName,
          items: JSON.parse(JSON.stringify(purchase.items)), // Convert to JSON
          total_nilai: purchase.totalAmount,
          status: purchase.status,
          metode_perhitungan: purchase.metodePerhitungan,
          catatan: purchase.catatan,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding purchase:', error);
        toast.error('Gagal menambah pembelian');
        return false;
      }

      await loadPurchases();
      toast.success('Pembelian berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addPurchase:', error);
      toast.error('Gagal menambah pembelian');
      return false;
    }
  };

  const updatePurchase = async (id: string, purchase: Omit<PurchaseTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate pembelian');
        return false;
      }

      const { error } = await supabase
        .from('purchases')
        .update({
          tanggal: purchase.tanggal instanceof Date && !isNaN(purchase.tanggal.getTime())   ? purchase.tanggal.toISOString()   : null,
          supplier: purchase.supplierName,
          items: JSON.parse(JSON.stringify(purchase.items)), // Convert to JSON
          total_nilai: purchase.totalAmount,
          status: purchase.status,
          metode_perhitungan: purchase.metodePerhitungan,
          catatan: purchase.catatan,
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating purchase:', error);
        toast.error('Gagal mengupdate pembelian');
        return false;
      }

      await loadPurchases();
      toast.success('Pembelian berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error in updatePurchase:', error);
      toast.error('Gagal mengupdate pembelian');
      return false;
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus pembelian');
        return false;
      }

      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting purchase:', error);
        toast.error('Gagal menghapus pembelian');
        return false;
      }

      setPurchases(prev => prev.filter(purchase => purchase.id !== id));
      toast.success('Pembelian berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deletePurchase:', error);
      toast.error('Gagal menghapus pembelian');
      return false;
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  return {
    purchases,
    loading,
    loadPurchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
  };
};
