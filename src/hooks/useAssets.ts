// src/hooks/useAssets.ts

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset } from '@/types/asset'; // PERBAIKAN: Import hanya Asset
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
            setAssets(localData);
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
              parsedTanggalPembelian = new Date('1970-01-01T00:00:00Z');
            }

            const parsedCreatedAt = safeParseDate(rawCreatedAt) || new Date();
            const parsedUpdatedAt = safeParseDate(rawUpdatedAt) || new Date();

            return {
              id: item.id,
              nama: item.nama || '',
              kategori: item.kategori || 'Peralatan',
              nilaiAwal: parseFloat(item.nilai_awal) || 0,
              nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0,
              tanggalPembelian: parsedTanggalPembelian,
              kondisi: item.kondisi || 'Baik',
              lokasi: item.lokasi || '',
              deskripsi: item.deskripsi || null,
              depresiasi: parseFloat(item.depresiasi) || null,
              // --- DIHAPUS: umurManfaat dan penyusutanPerBulan
              userId: item.user_id,
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

  // PERBAIKAN: Sesuaikan Omit, hapus umurManfaat dan penyusutanPerBulan
  // Sekarang nilaiSaatIni juga di-input dari form, bukan di-omit
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
      
      const nilaiSaatIniOnAdd = asset.nilaiSaatIni; 

      console.log('Adding Asset with tanggal_beli:', asset.tanggalPembelian.toISOString());

      const { error } = await supabase.from('assets').insert({
        id: newAssetId,
        user_id: session.user.id,
        nama: asset.nama,
        kategori: asset.kategori,
        nilai_awal: asset.nilaiAwal,
        tanggal_beli: asset.tanggalPembelian.toISOString(),
        nilai_sekarang: nilaiSaatIniOnAdd,
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
      // --- DIHAPUS: umurManfaat dan penyusutanPerBulan

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