import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset } from '@/types/asset';
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
import { safeParseDate, formatDateForDisplay, formatDateToYYYYMMDD } from '@/utils/dateUtils';

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
        console.log('DEBUG Raw Supabase Data:', data);
        const transformedData = data.map((item: any) => {
          const tanggalPembelian = safeParseDate(item.tanggal_beli);
          return {
            id: item.id,
            nama: item.nama,
            kategori: item.jenis, // Adjusted to match schema if needed
            nilaiAwal: parseFloat(item.nilai_awal) || 0,
            umurManfaat: parseFloat(item.umur_manfaat) || 0,
            tanggalPembelian: tanggalPembelian || new Date(),
            penyusutanPerBulan: parseFloat(item.penyusutan_per_bulan) || 0,
            nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0,
            kondisi: item.kondisi,
            lokasi: item.lokasi,
            deskripsi: item.deskripsi || undefined,
            user_id: item.user_id,
            createdAt: safeParseDate(item.created_at) || new Date(),
            updatedAt: safeParseDate(item.updated_at) || new Date(),
          };
        });
        console.log('Transformed Data with Local Time:', transformedData);
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
      if (!(asset.tanggalPembelian instanceof Date) || isNaN(asset.tanggalPembelian.getTime())) {
        toast.error('Tanggal Pembelian tidak valid');
        return false;
      }

      const newAssetId = generateUUID();
      const now = new Date();

      console.log('Adding Asset with tanggal_beli:', asset.tanggalPembelian.toISOString());

      const { error } = await supabase.from('assets').insert({
        id: newAssetId,
        user_id: session.user.id,
        nama: asset.nama,
        kategori: asset.kategori, // Adjusted to match schema if needed
        nilai_awal: asset.nilaiAwal,
        umur_manfaat: asset.umurManfaat,
        tanggal_beli: asset.tanggalPembelian.toISOString(),
        penyusutan_per_bulan: asset.penyusutanPerBulan,
        nilai_sekarang: asset.nilaiSaatIni,
        kondisi: asset.kondisi,
        lokasi: asset.lokasi,
        deskripsi: asset.deskripsi || null,
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
      if (updates.kategori !== undefined) updateData.jenis = updates.kategori;
      if (updates.nilaiAwal !== undefined) updateData.nilai_awal = updates.nilaiAwal;
      if (updates.umurManfaat !== undefined) updateData.umur_manfaat = updates.umurManfaat;
      if (updates.tanggalPembelian !== undefined) {
        updateData.tanggal_beli = updates.tanggalPembelian instanceof Date && !isNaN(updates.tanggalPembelian.getTime())
          ? updates.tanggalPembelian.toISOString()
          : null;
      }
      if (updates.penyusutanPerBulan !== undefined) updateData.penyusutan_per_bulan = updates.penyusutanPerBulan;
      if (updates.nilaiSaatIni !== undefined) updateData.nilai_sekarang = updates.nilaiSaatIni;
      if (updates.kondisi !== undefined) updateData.kondisi = updates.kondisi;
      if (updates.lokasi !== undefined) updateData.lokasi = updates.lokasi;
      if (updates.deskripsi !== undefined) updateData.deskripsi = updates.deskripsi || null;

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