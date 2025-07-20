// src/contexts/PurchaseContext.tsx
// VERSI REALTIME DENGAN RPC

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchase } from '@/types/supplier'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  // update dan delete untuk saat ini kita sederhanakan, bisa dikembangkan nanti
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const PurchaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();
  
  // --- HELPER FUNCTION ---
  const transformPurchaseFromDB = (dbItem: any): Purchase => ({
    id: dbItem.id,
    supplier: dbItem.supplier,
    totalNilai: Number(dbItem.total_nilai) || 0,
    tanggal: safeParseDate(dbItem.tanggal),
    items: dbItem.items || [], // Asumsi items adalah JSONB
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  // --- EFEK UTAMA: FETCH DATA & REALTIME LISTENER ---
  useEffect(() => {
    if (!user) {
      setPurchases([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialPurchases = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) {
        toast.error(`Gagal memuat pembelian: ${error.message}`);
      } else if (data) {
        setPurchases(data.map(transformPurchaseFromDB));
      }
      setIsLoading(false);
    };

    fetchInitialPurchases();

    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchases', filter: `user_id=eq.${user.id}` },
        (payload) => {
          // Kita hanya perlu listen INSERT karena update stok sudah terjadi di DB.
          // BahanBakuContext juga akan menerima update stoknya sendiri secara realtime.
          setPurchases(current => [transformPurchaseFromDB(payload.new), ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- FUNGSI-FUNGSI ---
  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    const purchaseDataForRPC = {
      user_id: user.id,
      supplier: purchase.supplier,
      total_nilai: purchase.totalNilai,
      tanggal: purchase.tanggal,
      items: purchase.items, // Pastikan items memiliki namaBarang, jumlah, hargaSatuan, dll.
    };

    // Panggil fungsi RPC yang telah kita buat
    const { error } = await supabase.rpc('add_purchase_and_update_stock', { purchase_data: purchaseDataForRPC });

    if (error) {
      toast.error(`Gagal memproses pembelian: ${error.message}`);
      return false;
    }
    
    // TIDAK PERLU `setPurchases` DI SINI. Listener realtime akan menanganinya.
    // Listener di BahanBakuContext juga akan menangani update stoknya. Ajaib!
    
    addActivity({ title: 'Pembelian Ditambahkan', description: `Pembelian dari ${purchase.supplier} senilai Rp ${purchase.totalNilai.toLocaleString('id-ID')}`, type: 'purchase', value: null });
    toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');
    return true;
  };

  const value: PurchaseContextType = {
    purchases,
    isLoading,
    addPurchase,
    // update dan delete perlu implementasi lebih lanjut jika diperlukan
    updatePurchase: async () => { console.warn("Update purchase not implemented"); return false; },
    deletePurchase: async () => { console.warn("Delete purchase not implemented"); return false; },
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