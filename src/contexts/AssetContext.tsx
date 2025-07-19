// src/contexts/AssetContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Asset, AssetCategory, AssetCondition } from '@/types/asset'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';

// --- INTERFACE & CONTEXT ---
interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

// --- CONSTANTS ---
const STORAGE_KEY = 'hpp_app_assets';

// --- PROVIDER COMPONENT ---
export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [assets, setAssets] = useState<Asset[]>([]);

  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();
  const { addActivity } = useActivity();

  // --- LOAD & SAVE EFFECTS ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Logika parsing kompleks dari AppDataContext asli
        const parsed = JSON.parse(stored).map((item: any) => {
            const parsedTanggalPembelian = safeParseDate(item.tanggalPembelian || item.tanggal_beli);
            const parsedCreatedAt = safeParseDate(item.createdAt || item.created_at);
            const parsedUpdatedAt = safeParseDate(item.updatedAt || item.updated_at);
            return {
              ...item,
              id: item.id,
              nama: item.nama || '',
              kategori: item.kategori || item.jenis || null,
              nilaiAwal: parseFloat(item.nilaiAwal || item.nilai) || 0,
              nilaiSaatIni: parseFloat(item.nilaiSaatIni || item.nilai_sekarang) || 0,
              tanggalPembelian: (parsedTanggalPembelian instanceof Date && !isNaN(parsedTanggalPembelian.getTime())) ? parsedTanggalPembelian : null,
              kondisi: item.kondisi || null,
              lokasi: item.lokasi || '',
              deskripsi: item.deskripsi || null,
              depresiasi: parseFloat(item.depresiasi) ?? null,
              userId: item.userId || item.user_id,
              createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime())) ? parsedCreatedAt : null,
              updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime())) ? parsedUpdatedAt : null,
            };
        });
        setAssets(parsed);
      }
    } catch (error) {
      console.error("Gagal memuat aset dari localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  // --- FUNCTIONS ---
  const addAsset = async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!session) {
        toast.error("Anda harus login untuk menambah aset");
        return false;
    }
    const newAsset: Asset = {
        ...asset,
        id: generateUUID(),
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    // ... Logika insert ke Supabase ...
    setAssets(prev => [...prev, newAsset]);
    addActivity({
        title: 'Aset Ditambahkan',
        description: `${asset.nama} telah ditambahkan`,
        type: 'aset',
        value: null,
    });
    toast.success(`Aset ${asset.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateAsset = async (id: string, updatedAsset: Partial<Asset>): Promise<boolean> => {
     if (!session) {
        toast.error("Anda harus login untuk memperbarui aset");
        return false;
    }
    // ... Implementasi lengkap sama seperti di AppDataContext asli ...
    setAssets(prev => prev.map(item => item.id === id ? { ...item, ...updatedAsset, updatedAt: new Date() } : item));
    toast.success(`Aset berhasil diperbarui!`);
    return true;
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
     if (!session) {
        toast.error("Anda harus login untuk menghapus aset");
        return false;
    }
    const asset = assets.find(a => a.id === id);
    // ... Logika delete dari Supabase ...
    setAssets(prev => prev.filter(a => a.id !== id));
    if (asset) {
        addActivity({
            title: 'Aset Dihapus',
            description: `${asset.nama} telah dihapus`,
            type: 'aset',
            value: null,
        });
        toast.success(`Aset ${asset.nama} berhasil dihapus!`);
    }
    return true;
  };

  const value: AssetContextType = {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
  };

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useAsset = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAsset must be used within an AssetProvider');
  }
  return context;
};