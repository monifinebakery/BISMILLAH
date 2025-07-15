import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BahanBaku } from '@/types/recipe';
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';

const STORAGE_KEY = 'hpp_app_bahan_baku';

export const useBahanBaku = (userId: string | undefined) => { // MODIFIED: Hapus initialData dari parameter
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>(() => 
    loadFromStorage(STORAGE_KEY, []) // MODIFIED: Hanya load dari local storage
  );
  const [loading, setLoading] = useState(true);

  const loadBahanBaku = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', userId)
        .order('nama', { ascending: true });

      if (error) {
        console.error('Error loading bahan baku:', error);
        toast.error('Gagal memuat data bahan baku');
        // Fallback to local storage on error
        const savedBahanBaku = loadFromStorage(STORAGE_KEY, []);
        setBahanBaku(savedBahanBaku);
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
      saveToStorage(STORAGE_KEY, formattedBahanBaku); // Save to local storage after successful load
    } catch (error) {
      console.error('Error in loadBahanBaku:', error);
      toast.error('Gagal memuat data bahan baku');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBahanBaku();
  }, [userId]); // Reload when userId changes

  useEffect(() => {
    saveToStorage(STORAGE_KEY, bahanBaku); // Save to local storage whenever bahanBaku state changes
  }, [bahanBaku]);


  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah bahan baku');
        return false;
      }

      const newBahanId = generateUUID(); // Generate ID di frontend
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('bahan_baku')
        .insert({
          id: newBahanId, // Sertakan ID yang digenerate
          user_id: session.user.id,
          nama: bahan.nama,
          kategori: bahan.kategori,
          stok: bahan.stok,
          satuan: bahan.satuan,
          minimum: bahan.minimum,
          harga_satuan: bahan.hargaSatuan,
          supplier: bahan.supplier,
          tanggal_kadaluwarsa: bahan.tanggalKadaluwarsa?.toISOString() || null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bahan baku:', error);
        toast.error(`Gagal menambah bahan baku: ${error.message}`);
        return false;
      }

      // Update state lokal dengan data yang baru ditambahkan (sudah camelCase)
      setBahanBaku(prev => [...prev, {
        ...bahan,
        id: newBahanId,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      }]);
      toast.success('Bahan baku berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addBahanBaku:', error);
      toast.error('Gagal menambah bahan baku');
      return false;
    }
  };

  const updateBahanBaku = async (id: string, updates: Partial<BahanBaku>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate bahan baku');
        return false;
      }

      const updateData: Partial<any> = {
        updated_at: new Date().toISOString(), // Selalu update timestamp
      };

      // Map camelCase to snake_case for DB update
      if (updates.nama !== undefined) updateData.nama = updates.nama;
      if (updates.kategori !== undefined) updateData.kategori = updates.kategori;
      if (updates.stok !== undefined) updateData.stok = updates.stok;
      if (updates.satuan !== undefined) updateData.satuan = updates.satuan;
      if (updates.minimum !== undefined) updateData.minimum = updates.minimum;
      if (updates.hargaSatuan !== undefined) updateData.harga_satuan = updates.hargaSatuan; // Map hargaSatuan
      if (updates.supplier !== undefined) updateData.supplier = updates.supplier;
      if (updates.tanggalKadaluwarsa !== undefined) {
        updateData.tanggal_kadaluwarsa = updates.tanggalKadaluwarsa?.toISOString() || null; // Map tanggalKadaluwarsa
      } else if (updates.tanggalKadaluwarsa === null) { // Handle explicit null
        updateData.tanggal_kadaluwarsa = null;
      }

      const { error } = await supabase
        .from('bahan_baku')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating bahan baku:', error);
        toast.error(`Gagal mengupdate bahan baku: ${error.message}`);
        return false;
      }

      // Update state lokal
      setBahanBaku(prev =>
        prev.map(item =>
          item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
        )
      );
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
        toast.error(`Gagal menghapus bahan baku: ${error.message}`);
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

  const getBahanBakuByName = (nama: string): BahanBaku | undefined => {
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  };

  const reduceStok = (nama: string, jumlah: number): boolean => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan) {
      toast.error(`Stok ${nama} tidak ditemukan.`);
      return false;
    }
    if (bahan.stok < jumlah) {
      toast.error(`Stok ${nama} tidak cukup. Tersisa ${bahan.stok} ${bahan.satuan}.`);
      return false;
    }
    // Panggil updateBahanBaku yang akan sync ke cloud
    updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    return true;
  };

  return {
    bahanBaku,
    loading,
    loadBahanBaku, // Expose loadBahanBaku for manual refresh if needed
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    getBahanBakuByName,
    reduceStok,
    setBahanBaku, // Expose setter for replaceAllData in AppDataContext
  };
};
