
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  hargaSatuan: number;
  supplier: string;
  tanggalKadaluwarsa?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const useBahanBaku = () => {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBahanBaku = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', session.user.id)
        .order('nama', { ascending: true });

      if (error) {
        console.error('Error loading bahan baku:', error);
        toast.error('Gagal memuat data bahan baku');
        return;
      }

      const formattedBahanBaku = data?.map((item: any) => ({
        id: item.id,
        nama: item.nama,
        kategori: item.kategori,
        stok: parseFloat(item.stok) || 0,
        satuan: item.satuan,
        minimum: parseFloat(item.minimum) || 0,
        hargaSatuan: parseFloat(item.harga_satuan) || 0,
        supplier: item.supplier || '',
        tanggalKadaluwarsa: item.tanggal_kadaluwarsa ? new Date(item.tanggal_kadaluwarsa) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];

      setBahanBaku(formattedBahanBaku);
    } catch (error) {
      console.error('Error in loadBahanBaku:', error);
      toast.error('Gagal memuat data bahan baku');
    } finally {
      setLoading(false);
    }
  };

  const addBahanBaku = async (newItem: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah bahan baku');
        return false;
      }

      const { data, error } = await supabase
        .from('bahan_baku')
        .insert({
          user_id: session.user.id,
          nama: newItem.nama,
          kategori: newItem.kategori,
          stok: newItem.stok,
          satuan: newItem.satuan,
          minimum: newItem.minimum,
          harga_satuan: newItem.hargaSatuan,
          supplier: newItem.supplier,
          tanggal_kadaluwarsa: newItem.tanggalKadaluwarsa?.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bahan baku:', error);
        toast.error('Gagal menambah bahan baku');
        return false;
      }

      await loadBahanBaku();
      toast.success('Bahan baku berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addBahanBaku:', error);
      toast.error('Gagal menambah bahan baku');
      return false;
    }
  };

  const updateBahanBaku = async (id: string, updates: Partial<Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate bahan baku');
        return false;
      }

      const updateData: any = {};
      if (updates.nama !== undefined) updateData.nama = updates.nama;
      if (updates.kategori !== undefined) updateData.kategori = updates.kategori;
      if (updates.stok !== undefined) updateData.stok = updates.stok;
      if (updates.satuan !== undefined) updateData.satuan = updates.satuan;
      if (updates.minimum !== undefined) updateData.minimum = updates.minimum;
      if (updates.hargaSatuan !== undefined) updateData.harga_satuan = updates.hargaSatuan;
      if (updates.supplier !== undefined) updateData.supplier = updates.supplier;
      if (updates.tanggalKadaluwarsa !== undefined) {
        updateData.tanggal_kadaluwarsa = updates.tanggalKadaluwarsa?.toISOString();
      }

      const { error } = await supabase
        .from('bahan_baku')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating bahan baku:', error);
        toast.error('Gagal mengupdate bahan baku');
        return false;
      }

      await loadBahanBaku();
      toast.success('Bahan baku berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error in updateBahanBaku:', error);
      toast.error('Gagal mengupdate bahan baku');
      return false;
    }
  };

  const deleteBahanBaku = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus bahan baku');
        return false;
      }

      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting bahan baku:', error);
        toast.error('Gagal menghapus bahan baku');
        return false;
      }

      setBahanBaku(prev => prev.filter(item => item.id !== id));
      toast.success('Bahan baku berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteBahanBaku:', error);
      toast.error('Gagal menghapus bahan baku');
      return false;
    }
  };

  useEffect(() => {
    loadBahanBaku();
  }, []);

  return {
    bahanBaku,
    loading,
    loadBahanBaku,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
  };
};
