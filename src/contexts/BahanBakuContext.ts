// src/contexts/BahanBakuContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/recipe'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';

// --- INTERFACE & CONTEXT ---
interface BahanBakuContextType {
  bahanBaku: BahanBaku[];
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

// --- CONSTANTS ---
const STORAGE_KEY = 'hpp_app_bahan_baku';

// --- PROVIDER COMPONENT ---
export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  
  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();
  const { addActivity } = useActivity();

  // --- LOAD & SAVE EFFECTS ---
  // Load dari Local Storage saat komponen pertama kali dimuat
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const dataWithDates = parsed.map((item: any) => ({
          ...item,
          tanggalKadaluwarsa: safeParseDate(item.tanggalKadaluwarsa),
          createdAt: safeParseDate(item.createdAt),
          updatedAt: safeParseDate(item.updatedAt),
        }));
        setBahanBaku(dataWithDates);
      }
    } catch (error) {
        console.error("Gagal memuat bahan baku dari localStorage:", error);
    }
  }, []);

  // Simpan ke Local Storage setiap kali state berubah
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bahanBaku));
  }, [bahanBaku]);


  // --- FUNCTIONS ---
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!session) {
      toast.error('Anda harus login untuk menambahkan bahan baku');
      return false;
    }
    
    const newBahan: BahanBaku = {
      ...bahan,
      id: generateUUID(),
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bahanToInsert = {
        id: newBahan.id,
        nama: newBahan.nama,
        kategori: newBahan.kategori,
        stok: newBahan.stok,
        satuan: newBahan.satuan,
        harga_satuan: newBahan.hargaSatuan,
        minimum: newBahan.minimum,
        supplier: newBahan.supplier,
        tanggal_kadaluwarsa: toSafeISOString(newBahan.tanggalKadaluwarsa),
        user_id: newBahan.userId,
        created_at: toSafeISOString(newBahan.createdAt),
        updated_at: toSafeISOString(newBahan.updatedAt),
        jumlah_beli_kemasan: newBahan.jumlahBeliKemasan ?? null,
        satuan_kemasan: newBahan.satuanKemasan ?? null,
        harga_total_beli_kemasan: newBahan.hargaTotalBeliKemasan ?? null,
    };

    const { error } = await supabase.from('bahan_baku').insert([bahanToInsert]);

    if (error) {
      console.error('Error adding bahan baku to DB:', error);
      toast.error(`Gagal menambahkan bahan baku: ${error.message}`);
      return false;
    }

    setBahanBaku(prev => [...prev, newBahan]);
    addActivity({
      title: 'Bahan Baku Ditambahkan',
      description: `${bahan.nama} telah ditambahkan ke gudang`,
      type: 'stok',
      value: null,
    });
    toast.success(`${bahan.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> => {
    if (!session) {
      toast.error('Anda harus login untuk memperbarui bahan baku');
      return false;
    }

    // ... (Logika konversi ke snake_case untuk update sama seperti kode asli Anda)
    // ...
    const { error } = await supabase.from('bahan_baku').update({ /* data update */ }).eq('id', id);

    if (error) {
      console.error('Error updating bahan baku in DB:', error);
      toast.error(`Gagal memperbarui bahan baku: ${error.message}`);
      return false;
    }

    setBahanBaku(prev => prev.map(item => item.id === id ? { ...item, ...updatedBahan, updatedAt: new Date() } : item));
    toast.success(`Bahan baku berhasil diperbarui!`);
    return true;
  };
  
  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    // ... Implementasi sama seperti kode asli, menggunakan session dari useAuth ...
    return true;
  }

  const getBahanBakuByName = useCallback((nama: string): BahanBaku | undefined => {
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  }, [bahanBaku]);

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan) {
      toast.error(`Bahan baku ${nama} tidak ditemukan.`);
      return false;
    }
    if (bahan.stok < jumlah) {
      toast.error(`Stok ${nama} (${bahan.stok}) tidak cukup.`);
      return false;
    }

    const success = await updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    if (success) {
      addActivity({
        title: 'Stok Berkurang',
        description: `${nama} berkurang ${jumlah} ${bahan.satuan}`,
        type: 'stok',
        value: null,
      });
    }
    return success;
  };
  
  const value: BahanBakuContextType = {
    bahanBaku,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    getBahanBakuByName,
    reduceStok,
  };

  return (
    <BahanBakuContext.Provider value={value}>
      {children}
    </BahanBakuContext.Provider>
  );
};

// --- CUSTOM HOOK ---
export const useBahanBaku = () => {
  const context = useContext(BahanBakuContext);
  if (context === undefined) {
    throw new Error('useBahanBaku must be used within a BahanBakuProvider');
  }
  return context;
};