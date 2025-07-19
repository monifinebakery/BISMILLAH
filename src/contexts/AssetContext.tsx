// src/contexts/AssetContext.tsx
// VERSI FINAL - MENGGUNAKAN SATU useEffect UTAMA UNTUK MENGHINDARI RACE CONDITION

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAssets, AssetCategory, AssetCondition } from '@/types/asset'; // Pastikan path ke tipe data Anda benar
import { toast } from 'sonner';

// --- Dependensi ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext'; // Asumsi ActivityContext sudah ada dan berfungsi
import { supabase } from '@/integrations/supabase/client';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

const STORAGE_KEY = 'hpp_app_assets';

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); // Mengambil informasi pengguna dari AuthContext
  const { addActivity } = useActivity();

  // ===================================================================
  // --- EFEK UTAMA: SATU-SATUNYA SUMBER KEBENARAN UNTUK MEMUAT DATA ---
  // ===================================================================
  useEffect(() => {
    // Jika status user belum jelas (masih loading dari AuthContext), jangan lakukan apa-apa.
    if (user === undefined) {
      return; 
    }

    if (user) {
      // Jika pengguna login, ambil datanya dari Supabase.
      console.log(`[AssetContext] User terdeteksi (${user.id}), memuat data aset dari cloud...`);
      setIsLoading(true);
      supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            toast.error(`Gagal memuat aset: ${error.message}`);
          } else if (data) {
            // Transformasi data dari snake_case (database) ke camelCase (aplikasi)
            const formattedData = data.map((item: any) => ({
              id: item.id,
              nama: item.nama || '',
              kategori: item.kategori || null,
              nilaiAwal: parseFloat(item.nilai_awal) || 0,
              nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0,
              tanggalPembelian: safeParseDate(item.tanggal_beli),
              kondisi: item.kondisi || null,
              lokasi: item.lokasi || null,
              deskripsi: item.deskripsi || null,
              depresiasi: item.depresiasi,
              userId: item.user_id,
              createdAt: safeParseDate(item.created_at),
              updatedAt: safeParseDate(item.updated_at),
            }));
            setAssets(formattedData);
          }
          setIsLoading(false);
        });
    } else {
      // Jika pengguna logout, bersihkan state aset dan localStorage.
      console.log("[AssetContext] User logout, membersihkan data aset.");
      setAssets([]);
      localStorage.removeItem(STORAGE_KEY);
      setIsLoading(false);
    }
  }, [user]); // KUNCI UTAMA: Bereaksi hanya terhadap perubahan `user`.

  // Efek untuk menyimpan ke Local Storage setiap kali state 'assets' berubah
  useEffect(() => {
    // Hanya simpan jika ada data dan pengguna sedang login
    if (user && assets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    }
  }, [assets, user]);


  // --- FUNGSI-FUNGSI CRUD ---
  const addAsset = async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menambah aset.");
      return false;
    }
    const newAsset: Asset = {
      ...asset,
      id: generateUUID(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const assetToInsert = {
        id: newAsset.id, user_id: newAsset.userId, nama: newAsset.nama,
        kategori: newAsset.kategori, nilai_awal: newAsset.nilaiAwal, nilai_sekarang: newAsset.nilaiSaatIni,
        tanggal_beli: toSafeISOString(newAsset.tanggalPembelian), kondisi: newAsset.kondisi,
        lokasi: newAsset.lokasi, deskripsi: newAsset.deskripsi, depresiasi: newAsset.depresiasi,
        created_at: toSafeISOString(newAsset.createdAt), updated_at: toSafeISOString(newAsset.updatedAt),
    };

    const { error } = await supabase.from('assets').insert([assetToInsert]);
    if (error) {
      toast.error("Gagal menyimpan aset: " + error.message);
      return false;
    }

    setAssets(prev => [newAsset, ...prev]);
    addActivity({
      title: 'Aset Ditambahkan',
      description: `${asset.nama} telah ditambahkan ke daftar aset.`,
      type: 'aset', value: null,
    });
    toast.success("Aset berhasil ditambahkan.");
    return true;
  };

  const updateAsset = async (id: string, asset: Partial<Asset>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk memperbarui aset.");
      return false;
    }
    // Buat objek snake_case untuk dikirim ke Supabase
    const assetToUpdate: { [key: string]: any } = { updated_at: new Date().toISOString() };
    if (asset.nama !== undefined) assetToUpdate.nama = asset.nama;
    if (asset.kategori !== undefined) assetToUpdate.kategori = asset.kategori;
    if (asset.nilaiAwal !== undefined) assetToUpdate.nilai_awal = asset.nilaiAwal;
    if (asset.nilaiSaatIni !== undefined) assetToUpdate.nilai_sekarang = asset.nilaiSaatIni;
    if (asset.tanggalPembelian !== undefined) assetToUpdate.tanggal_beli = toSafeISOString(asset.tanggalPembelian);
    // ...tambahkan field lain jika perlu...

    const { error } = await supabase.from('assets').update(assetToUpdate).eq('id', id);
    if (error) {
       toast.error("Gagal memperbarui aset: " + error.message);
       return false;
    }
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...asset, updatedAt: new Date() } : a));
    toast.success("Aset berhasil diperbarui.");
    return true;
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menghapus aset.");
      return false;
    }
    const assetToDelete = assets.find(a => a.id === id);
    if (!assetToDelete) return false;

    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
       toast.error("Gagal menghapus aset: " + error.message);
       return false;
    }
    setAssets(prev => prev.filter(a => a.id !== id));
    addActivity({
      title: 'Aset Dihapus', description: `${assetToDelete.nama} telah dihapus.`, type: 'aset', value: null,
    });
    toast.success("Aset berhasil dihapus.");
    return true;
  };

  const value = { assets, addAsset, updateAsset, deleteAsset, isLoading };

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
};

export const useAssets = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};