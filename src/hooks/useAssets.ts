import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset } from '@/types/asset'; // Pastikan Asset diimpor dari types/asset
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
import { safeParseDate } from '@/hooks/useSupabaseSync'; // MODIFIED: Import safeParseDate

const STORAGE_KEY = 'hpp_app_assets';

export const useAssets = (userId: string | undefined, initialData?: Asset[]) => {
  const [assets, setAssets] = useState<Asset[]>(() => 
    initialData || loadFromStorage(STORAGE_KEY, [])
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading assets:', error);
        toast.error(`Gagal memuat aset: ${error.message}`);
      } else {
        const transformedData = data.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          jenis: item.jenis,
          nilaiAwal: parseFloat(item.nilai_awal) || 0, // DB: nilai_awal -> local: nilaiAwal
          umurManfaat: parseFloat(item.umur_manfaat) || 0, // DB: umur_manfaat -> local: umurManfaat
          tanggalPembelian: item.tanggal_beli ? safeParseDate(item.tanggal_beli) : undefined, // MODIFIED: Gunakan safeParseDate
          penyusutanPerBulan: parseFloat(item.penyusutan_per_bulan) || 0, // DB: penyusutan_per_bulan -> local: penyusutanPerBulan
          nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0, // DB: nilai_sekarang -> local: nilaiSaatIni
          kondisi: item.kondisi,
          lokasi: item.lokasi,
          deskripsi: item.deskripsi || undefined, // Pastikan undefined jika null
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at) || new Date(), // Pastikan selalu Date yang valid
          updatedAt: safeParseDate(item.updated_at) || new Date(), // Pastikan selalu Date yang valid
        }));
        setAssets(transformedData);
        saveToStorage(STORAGE_KEY, transformedData);
      }
      setLoading(false);
    };

    fetchAssets();
  }, [userId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, assets);
  }, [assets]);

  const addAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambahkan aset');
        return false;
      }

      const newAssetId = generateUUID();
      const now = new Date();

      const { error } = await supabase.from('assets').insert({
        id: newAssetId,
        user_id: session.user.id,
        nama: asset.nama,
        jenis: asset.jenis,
        nilai_awal: asset.nilaiAwal,
        umur_manfaat: asset.umurManfaat,
        tanggal_beli: asset.tanggalPembelian instanceof Date ? asset.tanggalPembelian.toISOString() : null, // MODIFIED: Cek instanceof Date
        penyusutan_per_bulan: asset.penyusutanPerBulan,
        nilai_sekarang: asset.nilaiSaatIni,
        kondisi: asset.kondisi,
        lokasi: asset.lokasi,
        deskripsi: asset.deskripsi || null, // Pastikan null jika undefined
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
      if (error) {
        console.error('Error adding asset to DB:', error);
        toast.error(`Gagal menambahkan aset: ${error.message}`);
        return false;
      }

      setAssets(prev => [...prev, {
        ...asset,
        id: newAssetId,
        createdAt: now,
        updatedAt: now,
      }]);
      toast.success(`${asset.nama} berhasil ditambahkan!`);
      return true;
    } catch (error) {
      console.error('Error in addAsset:', error);
      toast.error('Gagal menambahkan aset');
      return false;
    }
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk memperbarui aset');
        return false;
      }

      const updateData: Partial<any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.nama !== undefined) updateData.nama = updates.nama;
      if (updates.jenis !== undefined) updateData.jenis = updates.jenis;
      if (updates.nilaiAwal !== undefined) updateData.nilai_awal = updates.nilaiAwal;
      if (updates.umurManfaat !== undefined) updateData.umur_manfaat = updates.umurManfaat;
      if (updates.tanggalPembelian !== undefined) {
        updateData.tanggal_beli = updates.tanggalPembelian instanceof Date ? updates.tanggalPembelian.toISOString() : null; // MODIFIED: Cek instanceof Date
      } else if (updates.tanggalPembelian === null) {
        updateData.tanggal_beli = null;
      }
      if (updates.penyusutanPerBulan !== undefined) updateData.penyusutan_per_bulan = updates.penyusutanPerBulan;
      if (updates.nilaiSaatIni !== undefined) updateData.nilai_sekarang = updates.nilaiSaatIni;
      if (updates.kondisi !== undefined) updateData.kondisi = updates.kondisi;
      if (updates.lokasi !== undefined) updateData.lokasi = updates.lokasi;
      if (updates.deskripsi !== undefined) updateData.deskripsi = updates.deskripsi;
      else if (Object.prototype.hasOwnProperty.call(updates, 'deskripsi') && updates.deskripsi === null) {
        updateData.deskripsi = null;
      }


      const { error } = await supabase.from('assets').update(updateData).eq('id', id).eq('user_id', session.user.id);
      if (error) {
        console.error('Error updating asset:', error);
        toast.error(`Gagal memperbarui aset: ${error.message}`);
        return false;
      }

      setAssets(prev => 
        prev.map(asset => 
          asset.id === id ? { ...asset, ...updates, updatedAt: new Date() } : asset
        )
      );
      toast.success(`Aset berhasil diperbarui!`);
      return true;
    } catch (error) {
      console.error('Error in updateAsset:', error);
      toast.error('Gagal memperbarui aset');
      return false;
    }
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus aset');
        return false;
      }

      const { error } = await supabase.from('assets').delete().eq('id', id).eq('user_id', session.user.id);
      if (error) {
        console.error('Error deleting asset:', error);
        toast.error(`Gagal menghapus aset: ${error.message}`);
        return false;
      }

      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success(`Aset berhasil dihapus!`);
      return true;
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      toast.error('Gagal menghapus aset');
      return false;
    }
  };

  return {
    assets,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    setAssets,
  };
};
