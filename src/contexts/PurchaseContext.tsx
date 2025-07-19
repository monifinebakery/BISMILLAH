// src/contexts/PurchaseContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Purchase } from '@/types/supplier'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useBahanBaku } from './BahanBakuContext'; // <-- Dependensi krusial

// --- INTERFACE & CONTEXT ---
interface PurchaseContextType {
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// --- CONSTANTS ---
const STORAGE_KEY = 'hpp_app_purchases';

// --- PROVIDER COMPONENT ---
export const PurchaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();
  const { addActivity } = useActivity();
  const { addBahanBaku, updateBahanBaku, getBahanBakuByName } = useBahanBaku();

  // --- LOAD & SAVE EFFECTS ---
  useEffect(() => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const dataWithDates = parsed.map((item: any) => ({
                ...item,
                tanggal: safeParseDate(item.tanggal),
                createdAt: safeParseDate(item.createdAt),
                updatedAt: safeParseDate(item.updatedAt),
            }));
            setPurchases(dataWithDates);
        }
    } catch (error) {
        console.error("Gagal memuat pembelian dari localStorage:", error);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  }, [purchases]);
  
  // --- FUNCTIONS ---
  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!session) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }
    
    const newPurchase: Purchase = {
      ...purchase,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // ... (logika insert 'purchase' ke Supabase sama seperti di kode asli)
    // ...
    
    // Ini adalah bagian penting: interaksi antar konteks
    // Menggunakan fungsi dari useBahanBaku untuk memperbarui stok
    await Promise.all(purchase.items.map(async (item) => {
      const existingBahan = getBahanBakuByName(item.namaBarang);
      if (existingBahan) {
        await updateBahanBaku(existingBahan.id, {
          stok: existingBahan.stok + item.jumlah,
          hargaSatuan: item.hargaSatuan, // Mungkin Anda ingin update harga juga
        });
      } else {
        await addBahanBaku({
          nama: item.namaBarang,
          kategori: item.kategori || 'Lainnya',
          stok: item.jumlah,
          satuan: item.satuan || 'unit',
          minimum: 10,
          hargaSatuan: item.hargaSatuan,
          supplier: purchase.supplier,
          tanggalKadaluwarsa: null, // Default
        });
      }
    }));
    
    setPurchases(prev => [...prev, newPurchase]);

    addActivity({
      title: 'Pembelian Ditambahkan',
      description: `Pembelian dari ${purchase.supplier} senilai Rp ${purchase.totalNilai.toLocaleString('id-ID')}`,
      type: 'purchase',
      value: null
    });
    
    toast.success('Pembelian berhasil ditambahkan dan stok diperbarui!');
    return true;
  };
  
  const updatePurchase = async (id: string, updatedPurchase: Partial<Purchase>): Promise<boolean> => {
    // ... Implementasi sama seperti kode asli, tidak ada dependensi kompleks di sini
    return true;
  }
  
  const deletePurchase = async (id: string): Promise<boolean> => {
    // ... Implementasi sama seperti kode asli. 
    // PERHATIAN: Versi ini tidak mengembalikan stok. Jika diperlukan, logika pengurangan stok harus ditambahkan.
    return true;
  }

  const value: PurchaseContextType = {
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
};

// --- CUSTOM HOOK ---
export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};