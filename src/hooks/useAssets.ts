// src/hooks/useAssets.ts

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset, AssetCategory, AssetCondition } from '@/types/asset'; // PERBAIKAN: Import AssetCategory dan AssetCondition
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';

const STORAGE_KEY = 'hpp_app_assets';

export const useAssets = (userId: string | undefined, initialData?: Asset[]) => {
  const [assets, setAssets] = useState<Asset[]>(() =>
    loadFromStorage(STORAGE_KEY, [])
  );
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!isMounted.current) return;
      setLoading(true);

      try {
        if (!userId) {
          console.warn('No userId provided, using local storage data only');
          const localData = loadFromStorage(STORAGE_KEY, []);
          if (isMounted.current) {
            setAssets(localData); // PERBAIKAN: Pastikan state terupdate meskipun tanpa userId
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .timeout(5000);

        if (error) {
          console.error('Error loading assets from Supabase:', error);
          toast.error(`Gagal memuat aset dari server: ${error.message}`);
          const localData = loadFromStorage(STORAGE_KEY, []);
          if (isMounted.current && localData.length > 0) {
            setAssets(localData);
            console.log('Falling back to local storage data:', localData);
          }
        } else {
          const transformedData = data.map((item: any) => {
            const rawTanggalPembelian = item.tanggal_beli;
            const rawCreatedAt = item.created_at;
            const rawUpdatedAt = item.updated_at;

            let parsedTanggalPembelian = safeParseDate(rawTanggalPembelian);
            if (!(parsedTanggalPembelian instanceof Date) || isNaN(parsedTanggalPembelian.getTime())) {
              console.warn(`Invalid tanggalPembelian for asset ${item.id}: ${rawTanggalPembelian}, falling back to default date`);
              parsedTanggalPembelian = new Date('1970-01-01T00:00:00Z'); // Atau Date yang lebih sesuai
            }

            const parsedCreatedAt = safeParseDate(rawCreatedAt) || new Date();
            const parsedUpdatedAt = safeParseDate(rawUpdatedAt) || new Date();

            return {
              id: item.id,
              nama: item.nama || '',
              kategori: item.kategori || 'Peralatan', // PERBAIKAN: Gunakan item.kategori
              nilaiAwal: parseFloat(item.nilai_awal) || 0,
              nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0, // PERBAIKAN: Sesuaikan dengan nilai_sekarang
              tanggalPembelian: parsedTanggalPembelian,
              kondisi: item.kondisi || 'Baik',
              lokasi: item.lokasi || '',
              deskripsi: item.deskripsi || null,
              depresiasi: parseFloat(item.depresiasi) || null,
              umurManfaat: parseFloat(item.umur_manfaat) || 0, // PERBAIKAN: Tambahkan umurManfaat
              penyusutanPerBulan: parseFloat(item.penyusutan_per_bulan) || 0, // PERBAIKAN: Tambahkan penyusutanPerBulan
              userId: item.user_id, // PERBAIKAN: Ubah ke userId (camelCase)
              createdAt: parsedCreatedAt,
              updatedAt: parsedUpdatedAt,
            } as Asset;
          });
          if (isMounted.current) {
            setAssets(transformedData);
            saveToStorage(STORAGE_KEY, transformedData);
            console.log('Assets loaded and saved to local storage:', transformedData);
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching assets:', error);
        toast.error('Terjadi kesalahan tak terduga saat memuat aset');
        const localData = loadFromStorage(STORAGE_KEY, []);
        if (isMounted.current && localData.length > 0) {
          setAssets(localData);
          console.log('Falling back to local storage data:', localData);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchAssets();

    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, assets);
  }, [assets]);

  // PERBAIKAN: Sesuaikan Omit agar match dengan Asset input yang dibutuhkan
  const addAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'penyusutanPerBulan' | 'nilaiSaatIni'>) => {
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

      // Pastikan asset.umurManfaat tersedia dan valid
      if (typeof asset.umurManfaat !== 'number' || asset.umurManfaat <= 0) {
        toast.error('Umur Manfaat tidak valid atau tidak boleh nol.');
        return false;
      }

      // Pastikan asset.nilaiAwal tersedia dan valid
      if (typeof asset.nilaiAwal !== 'number' || asset.nilaiAwal < 0) {
        toast.error('Nilai Awal tidak valid.');
        return false;
      }
      
      const calculatedPenyusutanPerBulan = asset.nilaiAwal / (asset.umurManfaat * 12);
      const calculatedNilaiSaatIni = asset.nilaiAwal; // Nilai saat ini adalah nilai awal saat baru ditambahkan

      console.log('Adding Asset with tanggal_beli:', asset.tanggalPembelian.toISOString());

      const { error } = await supabase.from('assets').insert({
        id: newAssetId,
        user_id: session.user.id,
        nama: asset.nama,
        kategori: asset.kategori, // PERBAIKAN: Ubah 'jenis' menjadi 'kategori'
        nilai_awal: asset.nilaiAwal,
        umur_manfaat: asset.umurManfaat, // PERBAIKAN: Pastikan ini ada di DB
        tanggal_beli: asset.tanggalPembelian.toISOString(),
        penyusutan_per_bulan: calculatedPenyusutanPerBulan, // PERBAIKAN: Pastikan ini ada di DB
        nilai_sekarang: calculatedNilaiSaatIni, // PERBAIKAN: Pastikan ini ada di DB
        kondisi: asset.kondisi,
        lokasi: asset.lokasi,
        deskripsi: asset.deskripsi || null,
        depresiasi: asset.depresiasi || null,
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
        userId: session.user.id, // PERBAIKAN: Gunakan userId
        penyusutanPerBulan: calculatedPenyusutanPerBulan,
        nilaiSaatIni: calculatedNilaiSaatIni,
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
      if (updates.kategori !== undefined) updateData.kategori = updates.kategori; // PERBAIKAN: Ubah 'jenis' menjadi 'kategori'
      if (updates.nilaiAwal !== undefined) updateData.nilai_awal = updates.nilaiAwal;
      if (updates.nilaiSaatIni !== undefined) updateData.nilai_sekarang = updates.nilaiSaatIni; // PERBAIKAN: Tambahkan nilai_sekarang
      if (updates.tanggalPembelian !== undefined) {
        updateData.tanggal_beli = updates.tanggalPembelian instanceof Date && !isNaN(updates.tanggalPembelian.getTime())
          ? updates.tanggalPembelian.toISOString()
          : null;
      } else if (Object.prototype.hasOwnProperty.call(updates, 'tanggalPembelian') && updates.tanggalPembelian === null) {
        updateData.tanggal_beli = null;
      }
      if (updates.kondisi !== undefined) updateData.kondisi = updates.kondisi;
      if (updates.lokasi !== undefined) updateData.lokasi = updates.lokasi;
      if (updates.deskripsi !== undefined) updateData.deskripsi = updates.deskripsi || null;
      if (updates.depresiasi !== undefined) updateData.depresiasi = updates.depresiasi;
      if (updates.umurManfaat !== undefined) updateData.umur_manfaat = updates.umurManfaat; // PERBAIKAN: Tambahkan umur_manfaat
      if (updates.penyusutanPerBulan !== undefined) updateData.penyusutan_per_bulan = updates.penyusutanPerBulan; // PERBAIKAN: Tambahkan penyusutan_per_bulan


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