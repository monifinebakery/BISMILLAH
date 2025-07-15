// src/hooks/useBahanBaku.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { safeParseDate } from '@/hooks/useSupabaseSync'; // Import safeParseDate

// MODIFIED: Update BahanBaku Interface
export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  hargaSatuan: number;
  supplier: string;
  tanggalKadaluwarsa?: Date; // Tetap Date | undefined
  createdAt?: Date; // Tetap Date | undefined
  updatedAt?: Date; // Tetap Date | undefined
  // NEW FIELDS: Tambahkan properti baru
  jumlahBeliKemasan?: number | null;
  satuanKemasan?: string | null;
  hargaTotalBeliKemasan?: number | null;
}

export const useBahanBaku = (userId: string | undefined) => {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>(() =>
    [] // Pastikan loadFromStorage jika digunakan di sini juga menghasilkan Date | undefined
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
        return;
      }

      const formattedBahanBaku: BahanBaku[] = data?.map((item: any) => ({
        id: item.id,
        nama: item.nama,
        kategori: item.kategori,
        stok: parseFloat(item.stok) || 0,
        satuan: item.satuan,
        minimum: parseFloat(item.minimum) || 0,
        hargaSatuan: parseFloat(item.harga_satuan) || 0,
        supplier: item.supplier || '',
        tanggalKadaluwarsa: safeParseDate(item.tanggal_kadaluwarsa),
        createdAt: safeParseDate(item.created_at),
        updatedAt: safeParseDate(item.updated_at),
        // MODIFIED: Pastikan membaca kolom baru dari DB (snake_case)
        jumlahBeliKemasan: parseFloat(item.jumlah_beli_kemasan) || null,
        satuanKemasan: item.satuan_kemasan || null,
        hargaTotalBeliKemasan: parseFloat(item.harga_total_beli_kemasan) || null,
      })) || [];

      setBahanBaku(formattedBahanBaku);
      // saveToStorage(STORAGE_KEY, formattedBahanBaku); // Jika Anda menggunakan localStorage, pastikan ini diaktifkan dan menangani Date | undefined
    } catch (error) {
      console.error('Error in loadBahanBaku:', error);
      toast.error('Gagal memuat data bahan baku');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBahanBaku();
  }, [userId]);

  // useEffect(() => {
  //   saveToStorage(STORAGE_KEY, bahanBaku); // Pastikan ini juga menangani Date | undefined
  // }, [bahanBaku]);


  // MODIFIED: addBahanBaku function
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah bahan baku');
        return false;
      }

      // Pastikan `generateUUID` tersedia jika Anda menggunakannya
      // const newBahanId = generateUUID(); 
      const now = new Date();

      const { data, error } = await supabase
        .from('bahan_baku')
        .insert({
          // id: newBahanId, // Supabase biasanya auto-generates ID, hapus jika tidak perlu manual
          user_id: session.user.id,
          nama: bahan.nama,
          kategori: bahan.kategori,
          stok: bahan.stok,
          satuan: bahan.satuan,
          minimum: bahan.minimum,
          harga_satuan: bahan.hargaSatuan,
          supplier: bahan.supplier,
          tanggal_kadaluwarsa: bahan.tanggalKadaluwarsa instanceof Date ? bahan.tanggalKadaluwarsa.toISOString() : null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          // MODIFIED: Sertakan kolom baru dengan nama snake_case
          jumlah_beli_kemasan: bahan.jumlahBeliKemasan || null,
          satuan_kemasan: bahan.satuanKemasan || null,
          harga_total_beli_kemasan: bahan.hargaTotalBeliKemasan || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bahan baku:', error);
        toast.error(`Gagal menambah bahan baku: ${error.message}`);
        return false;
      }

      setBahanBaku(prev => [...prev, {
        ...bahan,
        id: data.id, // Gunakan ID yang dikembalikan dari Supabase
        createdAt: safeParseDate(data.created_at)!, // Konversi kembali ke Date
        updatedAt: safeParseDate(data.updated_at)!, // Konversi kembali ke Date
      }]);
      toast.success('Bahan baku berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addBahanBaku:', error);
      toast.error('Gagal menambah bahan baku');
      return false;
    }
  };

  // MODIFIED: updateBahanBaku function
  const updateBahanBaku = async (id: string, updates: Partial<BahanBaku>) => {
    try {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate bahan baku');
        return false;
      }

      const updateData: { [key: string]: any } = {
        updated_at: new Date().toISOString(),
      };

      if (updates.nama !== undefined) updateData.nama = updates.nama;
      if (updates.kategori !== undefined) updateData.kategori = updates.kategori;
      if (updates.stok !== undefined) updateData.stok = updates.stok;
      if (updates.satuan !== undefined) updateData.satuan = updates.satuan;
      if (updates.minimum !== undefined) updateData.minimum = updates.minimum;
      if (updates.hargaSatuan !== undefined) updateData.harga_satuan = updates.hargaSatuan;
      if (updates.supplier !== undefined) updateData.supplier = updates.supplier;
      if (updates.tanggalKadaluwarsa !== undefined) {
        updateData.tanggal_kadaluwarsa = updates.tanggalKadaluwarsa instanceof Date ? updates.tanggalKadaluwarsa.toISOString() : null;
      } else if (Object.prototype.hasOwnProperty.call(updates, 'tanggalKadaluwarsa') && updates.tanggalKadaluwarsa === null) {
        updateData.tanggal_kadaluwarsa = null;
      }
      // MODIFIED: Sertakan kolom baru dalam update dengan nama snake_case
      if (updates.jumlahBeliKemasan !== undefined) updateData.jumlah_beli_kemasan = updates.jumlahBeliKemasan;
      if (updates.satuanKemasan !== undefined) updateData.satuan_kemasan = updates.satuanKemasan;
      if (updates.hargaTotalBeliKemasan !== undefined) updateData.harga_total_beli_kemasan = updates.hargaTotalBeliKemasan;


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
      const { data: { session } = {} } = await supabase.auth.getSession();
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
    updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    return true;
  };

  return {
    bahanBaku,
    loading,
    loadBahanBaku,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    getBahanBakuByName,
    reduceStok,
    setBahanBaku,
  };
};