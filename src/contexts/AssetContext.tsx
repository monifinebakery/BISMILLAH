import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Asset } from '@/types'; // Pastikan path ke tipe data Anda benar
import { toast } from 'sonner';

// --- Dependensi ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
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
  const { session } = useAuth();
  const { addActivity } = useActivity();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Efek 1: Muat data dari Local Storage saat pertama kali dibuka
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).map((item: any) => ({
            ...item,
            tanggalPembelian: safeParseDate(item.tanggalPembelian),
            createdAt: safeParseDate(item.createdAt),
            updatedAt: safeParseDate(item.updatedAt),
        }));
        setAssets(parsed);
      }
    } catch (error) {
      console.error("Gagal memuat aset dari localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  // Efek 2: Muat data dari Supabase HANYA JIKA sesi sudah ada
  useEffect(() => {
    const loadFromCloud = async () => {
      if (session) {
        setIsLoading(true);
        console.log("Session valid, fetching assets from cloud...");
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', session.user.id);

        if (error) {
          toast.error("Gagal mengambil data aset dari cloud: " + error.message);
        } else if (data) {
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
            createdAt: safeParseDate(item.created_at),
            updatedAt: safeParseDate(item.updated_at),
          }));
          setAssets(formattedData);
        }
        setIsLoading(false);
      } else {
         // Jika logout (sesi menjadi null), bersihkan state
        console.log("No session, clearing local assets.");
        setAssets([]);
      }
    };

    loadFromCloud();
  }, [session]);

  // Efek 3: Simpan ke Local Storage setiap kali state 'assets' berubah
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  const addAsset = async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!session) {
      toast.error("Anda harus login untuk menambah aset.");
      return false;
    }
    const newAsset: Asset = {
      ...asset,
      id: generateUUID(),
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Konversi ke format snake_case untuk Supabase
    const assetToInsert = {
        id: newAsset.id,
        user_id: newAsset.userId,
        nama: newAsset.nama,
        kategori: newAsset.kategori,
        nilai_awal: newAsset.nilaiAwal,
        nilai_sekarang: newAsset.nilaiSaatIni,
        tanggal_beli: toSafeISOString(newAsset.tanggalPembelian),
        kondisi: newAsset.kondisi,
        lokasi: newAsset.lokasi,
        deskripsi: newAsset.deskripsi,
        depresiasi: newAsset.depresiasi,
        created_at: toSafeISOString(newAsset.createdAt),
        updated_at: toSafeISOString(newAsset.updatedAt),
    };

    const { error } = await supabase.from('assets').insert([assetToInsert]);
    if (error) {
      toast.error("Gagal menyimpan aset: " + error.message);
      return false;
    }

    setAssets(prev => [...prev, newAsset]);
    addActivity({
      title: 'Aset Ditambahkan',
      description: `${asset.nama} telah ditambahkan ke daftar aset.`,
      type: 'aset',
      value: null,
    });
    toast.success("Aset berhasil ditambahkan.");
    return true;
  };

  const updateAsset = async (id: string, asset: Partial<Asset>): Promise<boolean> => {
     if (!session) {
      toast.error("Anda harus login untuk memperbarui aset.");
      return false;
    }
    const { error } = await supabase.from('assets').update({ /* ...data snake_case... */ }).eq('id', id);
    if (error) {
       toast.error("Gagal memperbarui aset: " + error.message);
       return false;
    }
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...asset, updatedAt: new Date() } : a));
    toast.success("Aset berhasil diperbarui.");
    return true;
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
     if (!session) {
      toast.error("Anda harus login untuk menghapus aset.");
      return false;
    }
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
       toast.error("Gagal menghapus aset: " + error.message);
       return false;
    }
    setAssets(prev => prev.filter(a => a.id !== id));
    toast.success("Aset berhasil dihapus.");
    return true;
  };

  const value = { assets, addAsset, updateAsset, deleteAsset, isLoading };

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
};

export const useAsset = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAsset must be used within an AssetProvider');
  }
  return context;
};