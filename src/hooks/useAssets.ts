// src/hooks/useAssets.ts

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset } from '@/types/asset'; // Pastikan ini mengimpor tipe Asset yang benar
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers'; // Ini adalah fungsi umum loadFromStorage
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; // Impor helper tanggal

const STORAGE_KEY = 'hpp_app_assets'; // Kunci penyimpanan khusus untuk useAssets

export const useAssets = (userId: string | undefined, initialData?: Asset[]) => {
  // PERBAIKAN UTAMA DI SINI: Implementasi parsing kustom untuk data dari localStorage
  const [assets, setAssets] = useState<Asset[]>(() => {
    const storedAssets = loadFromStorage(STORAGE_KEY, []); // Ambil data mentah dari localStorage
    return storedAssets.map((item: any) => {
      const parsedTanggalPembelian = safeParseDate(item.tanggalPembelian || item.tanggal_beli);
      const parsedCreatedAt = safeParseDate(item.createdAt || item.created_at);
      const parsedUpdatedAt = safeParseDate(item.updatedAt || item.updated_at);

      return {
        ...item, // Pastikan semua properti lain ikut disertakan
        id: item.id, // Pastikan ID ada
        nama: item.nama || '',
        kategori: item.kategori || item.jenis || null, // Fallback untuk nama lama
        nilaiAwal: parseFloat(item.nilaiAwal || item.nilai) || 0, // Fallback untuk nama lama
        nilaiSaatIni: parseFloat(item.nilaiSaatIni || item.nilai_sekarang) || 0, // Fallback untuk nama lama
        
        // Pastikan tanggalPembelian selalu Date yang valid. Jika tidak, pakai fallback.
        tanggalPembelian: (parsedTanggalPembelian instanceof Date && !isNaN(parsedTanggalPembelian.getTime()))
                          ? parsedTanggalPembelian
                          : new Date('1970-01-01T00:00:00Z'), // Default/fallback date
        
        kondisi: item.kondisi || null,
        lokasi: item.lokasi || '',
        deskripsi: item.deskripsi || null,
        depresiasi: parseFloat(item.depresiasi) ?? null,
        
        userId: item.userId || item.user_id, // Fallback untuk nama lama
        
        createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime()))
                   ? parsedCreatedAt
                   : new Date(), // Default/fallback date
        updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime()))
                   ? parsedUpdatedAt
                   : new Date(), // Default/fallback date
      } as Asset; // Pastikan hasilnya sesuai tipe Asset
    });
  });
  
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!isMounted.current) return;
      setLoading(true);

      try {
        if (!userId) {
          console.warn('No userId provided, using local storage data only');
          // PERBAIKAN: Jika tidak ada userId, kita sudah memuat dari localStorage di useState awal,
          // jadi kita hanya perlu memastikan loading selesai.
          if (isMounted.current) setLoading(false);
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
          // PERBAIKAN: Jika ada error Supabase, jangan langsung fallback ke loadFromStorage mentah
          // karena parsing sudah dilakukan di initial useState. Cukup log dan pastikan loading false.
          const localData = assets; // Gunakan data yang sudah ada di state (yang sudah di-parse)
          if (isMounted.current && localData.length > 0) {
            setAssets(localData); // Perbarui state dengan data yang sudah di-parse sebelumnya
            console.log('Falling back to previously loaded local storage data:', localData);
          }
        } else {
          const transformedData = data.map((item: any) => {
            const rawTanggalPembelian = item.tanggal_beli;
            const rawCreatedAt = item.created_at;
            const rawUpdatedAt = item.updated_at;

            let parsedTanggalPembelian = safeParseDate(rawTanggalPembelian);
            // Explicit check for invalid Date
            if (!(parsedTanggalPembelian instanceof Date) || isNaN(parsedTanggalPembelian.getTime())) {
              console.warn(`Invalid tanggalPembelian for asset ${item.id}: ${rawTanggalPembelian}, falling back to default date`);
              parsedTanggalPembelian = new Date('1970-01-01T00:00:00Z');
            }

            const parsedCreatedAt = safeParseDate(rawCreatedAt);
            const parsedUpdatedAt = safeParseDate(rawUpdatedAt);

            return {
              id: item.id,
              nama: item.nama || '',
              kategori: item.kategori || null, // Sesuaikan dengan nama kolom DB
              nilaiAwal: parseFloat(item.nilai_awal) || 0, // Sesuaikan dengan nama kolom DB
              nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0, // Sesuaikan dengan nama kolom DB
              tanggalPembelian: parsedTanggalPembelian,
              kondisi: item.kondisi || null,
              lokasi: item.lokasi || '',
              deskripsi: item.deskripsi || null,
              depresiasi: parseFloat(item.depresiasi) ?? null,
              userId: item.user_id, // Map DB user_id to frontend userId
              createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime())) ? parsedCreatedAt : new Date(),
              updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime())) ? parsedUpdatedAt : new Date(),
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
        // PERBAIKAN: Jika ada error unexpected, gunakan data yang sudah ada di state
        const localData = assets; 
        if (isMounted.current && localData.length > 0) {
          setAssets(localData);
          console.log('Falling back to previously loaded local storage data:', localData);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchAssets();

    return () => {
      isMounted.current = false;
    };
  }, [userId]); // Dependency array dipertahankan

  useEffect(() => {
    // Ini adalah useEffect yang terpisah untuk menyimpan assets setiap kali berubah.
    // Pastikan assets di sini sudah berupa Date object yang valid.
    saveToStorage(STORAGE_KEY, assets);
  }, [assets]);

  // Fungsi addAsset, updateAsset, deleteAsset tetap sama seperti revisi terakhir
  // (tanpa umurManfaat dan penyusutanPerBulan)
  const addAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
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
      
      const { error } = await supabase.from('assets').insert({
        id: newAssetId,
        user_id: session.user.id,
        nama: asset.nama,
        kategori: asset.kategori,
        nilai_awal: asset.nilaiAwal,
        tanggal_beli: toSafeISOString(asset.tanggalPembelian),
        nilai_sekarang: asset.nilaiSaatIni,
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
        userId: session.user.id,
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
      if (updates.kategori !== undefined) updateData.kategori = updates.kategori;
      if (updates.nilaiAwal !== undefined) updateData.nilai_awal = updates.nilaiAwal;
      if (updates.nilaiSaatIni !== undefined) updateData.nilai_sekarang = updates.nilaiSaatIni;
      if (updates.tanggalPembelian !== undefined) {
        updateData.tanggal_beli = toSafeISOString(updates.tanggalPembelian);
      } else if (Object.prototype.hasOwnProperty.call(updates, 'tanggalPembelian') && updates.tanggalPembelian === null) {
        updateData.tanggal_beli = null;
      }
      if (updates.kondisi !== undefined) updateData.kondisi = updates.kondisi;
      if (updates.lokasi !== undefined) updateData.lokasi = updates.lokasi;
      if (updates.deskripsi !== undefined) updateData.deskripsi = updates.deskripsi || null;
      if (updates.depresiasi !== undefined) updateData.depresiasi = updates.depresiasi;

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