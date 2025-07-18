// src/hooks/useAssets.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset } from '@/types/asset'; // Pastikan Asset diimpor dari types/asset
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
import { safeParseDate } from '@/utils/dateUtils';

const STORAGE_KEY = 'hpp_app_assets';

export const useAssets = (userId: string | undefined, initialData?: Asset[]) => {
  const [assets, setAssets] = useState<Asset[]>(() => 
    loadFromStorage(STORAGE_KEY, []) // Mulai dengan data dari localStorage
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        if (!userId) {
          console.warn('No userId provided, using local storage data only');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading assets from Supabase:', error);
          toast.error(`Gagal memuat aset dari server: ${error.message}`);
          // Fallback ke data lokal jika fetch gagal
          const localData = loadFromStorage(STORAGE_KEY, []);
          if (localData.length > 0) {
            setAssets(localData);
            console.log('Falling back to local storage data:', localData);
          }
        } else {
          const transformedData = data.map((item: any) => {
            const parsedTanggalPembelian = safeParseDate(item.tanggal_beli);
            const parsedCreatedAt = safeParseDate(item.created_at) || new Date();
            const parsedUpdatedAt = safeParseDate(item.updated_at) || new Date();

            if (!parsedTanggalPembelian) {
              console.warn(`Failed to parse tanggal_beli for asset ${item.id}:`, item.tanggal_beli);
            }

            console.log('DEBUG Asset Transformation:', {
              id: item.id,
              nama: item.nama,
              tanggal_beli: item.tanggal_beli,
              parsedTanggalPembelian,
              created_at: item.created_at,
              parsedCreatedAt,
              updated_at: item.updated_at,
              parsedUpdatedAt,
            });

            return {
              id: item.id,
              nama: item.nama,
              kategori: item.kategori,
              nilaiAwal: parseFloat(item.nilai_awal) || 0,
              nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0,
              tanggalPembelian: parsedTanggalPembelian || null,
              kondisi: item.kondisi,
              lokasi: item.lokasi,
              deskripsi: item.deskripsi || undefined,
              depresiasi: parseFloat(item.depresiasi) || null,
              penyusutanPerBulan: 0, // Placeholder, karena tidak ada di tabel
              user_id: item.user_id,
              createdAt: parsedCreatedAt,
              updatedAt: parsedUpdatedAt,
            } as Asset;
          });
          setAssets(transformedData);
          saveToStorage(STORAGE_KEY, transformedData);
          console.log('Assets loaded and saved to local storage:', transformedData);
        }
      } catch (error) {
        console.error('Unexpected error fetching assets:', error);
        toast.error('Terjadi kesalahan tak terduga saat memuat aset');
        // Fallback ke data lokal
        const localData = loadFromStorage(STORAGE_KEY, []);
        if (localData.length > 0) {
          setAssets(localData);
          console.log('Falling back to local storage data:', localData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [userId]); // Tetap gunakan userId sebagai dependency, tapi pastikan fetch dijalankan

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
        kategori: asset.kategori,
        nilai_awal: asset.nilaiAwal,
        nilai_sekarang: asset.nilaiSaatIni,
        tanggal_beli: asset.tanggalPembelian instanceof Date && !isNaN(asset.tanggalPembelian.getTime())
          ? asset.tanggalPembelian.toISOString()
          : null,
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
      if (updates.deskripsi !== undefined) updateData.deskripsi = updates.deskripsi;
      else if (Object.prototype.hasOwnProperty.call(updates, 'deskripsi') && updates.deskripsi === null) {
        updateData.deskripsi = null;
      }
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