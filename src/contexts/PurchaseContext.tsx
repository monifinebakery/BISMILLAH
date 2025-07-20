// src/contexts/PurchaseContext.tsx
// VERSI REALTIME DENGAN RPC (Setelah Konfigurasi Supabase Publications & Perbaikan Update)

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchase } from '@/types/supplier'; 
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; // Pastikan toSafeISOString diimpor

// --- INTERFACE & CONTEXT ---
interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
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
    items: dbItem.items || [],
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
    status: dbItem.status, // Pastikan status dimuat dari DB
    metodePerhitungan: dbItem.metode_perhitungan || 'FIFO', // Pastikan metode_perhitungan dimuat dari DB
  });

  // --- FUNGSI UTAMA: FETCH DATA & REALTIME LISTENER ---
  useEffect(() => {
    if (!user) {
      console.log('[PurchaseContext] User tidak ditemukan, mengosongkan pembelian.');
      setPurchases([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialPurchases = async () => {
      setIsLoading(true);
      console.log('[PurchaseContext] Memulai fetchInitialPurchases untuk user:', user.id);
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) {
        console.error('[PurchaseContext] Gagal memuat pembelian:', error.message);
        toast.error(`Gagal memuat pembelian: ${error.message}`);
      } else if (data) {
        const transformedData = data.map(transformPurchaseFromDB);
        console.log('[PurchaseContext] Data pembelian berhasil dimuat (transformed):', transformedData);
        setPurchases(transformedData);
      }
      setIsLoading(false);
      console.log('[PurchaseContext] fetchInitialPurchases selesai.');
    };

    fetchInitialPurchases();

    // Realtime listener - ini akan berfungsi JIKA tabel 'purchases' diaktifkan di Supabase Publications
    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          console.log('[PurchaseContext] Perubahan realtime diterima:', payload);
          const transform = transformPurchaseFromDB;

          if (payload.eventType === 'INSERT') {
            setPurchases(current => [transform(payload.new), ...current].sort((a, b) => new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime())); 
          } else if (payload.eventType === 'UPDATE') {
            setPurchases(current => current.map(item => item.id === payload.new.id ? transform(payload.new) : item));
          } else if (payload.eventType === 'DELETE') {
            setPurchases(current => current.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[PurchaseContext] Menghapus channel realtime.');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- FUNGSI-FUNGSI CUD ---
  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    const purchaseDataForRPC = {
      user_id: user.id,
      supplier: purchase.supplier,
      total_nilai: purchase.totalNilai,
      tanggal: toSafeISOString(purchase.tanggal), // Menggunakan toSafeISOString
      items: purchase.items,
      status: purchase.status, // Menyertakan status untuk INSERT
      metode_perhitungan: purchase.metodePerhitungan, // Menyertakan metode_perhitungan untuk INSERT
    };

    console.log('[PurchaseContext] Mengirim data pembelian baru ke RPC:', purchaseDataForRPC);
    const { error } = await supabase.rpc('add_purchase_and_update_stock', { purchase_data: purchaseDataForRPC });

    if (error) {
      toast.error(`Gagal memproses pembelian: ${error.message}`);
      console.error('[PurchaseContext] Error dari RPC "add_purchase_and_update_stock":', error);
      return false;
    }
    
    addActivity({ title: 'Pembelian Ditambahkan', description: `Pembelian dari ${purchase.supplier} senilai Rp ${purchase.totalNilai.toLocaleString('id-ID')}`, type: 'purchase', value: null });
    toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');
    return true;
  };

  // --- UPDATE FUNGSI: PERBAIKAN UTAMA ADA DI SINI ---
  const updatePurchase = async (id: string, updatedData: Partial<Purchase>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui pembelian.');
      return false;
    }

    const purchaseToUpdate: { [key: string]: any } = {
      updated_at: new Date().toISOString(), 
    };

    // Pastikan semua properti yang akan diupdate dipetakan ke snake_case
    if (updatedData.supplier !== undefined) purchaseToUpdate.supplier = updatedData.supplier;
    if (updatedData.totalNilai !== undefined) purchaseToUpdate.total_nilai = updatedData.totalNilai;
    if (updatedData.tanggal !== undefined) purchaseToUpdate.tanggal = toSafeISOString(updatedData.tanggal);
    if (updatedData.items !== undefined) purchaseToUpdate.items = updatedData.items;
    
    // *** PENTING: BARIS INI AKAN MEMPERBAIKI MASALAH STATUS ***
    if (updatedData.status !== undefined) purchaseToUpdate.status = updatedData.status;
    // *** PENTING: SERTAKAN JUGA METODE PERHITUNGAN JIKA ADA DI DB ***
    if (updatedData.metodePerhitungan !== undefined) purchaseToUpdate.metode_perhitungan = updatedData.metodePerhitungan;


    console.log('[PurchaseContext] Mengirim update pembelian:', id, purchaseToUpdate);
    const { error } = await supabase.from('purchases').update(purchaseToUpdate).eq('id', id);

    if (error) {
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);
      console.error('[PurchaseContext] Error memperbarui pembelian:', error);
      return false;
    }
    toast.success('Pembelian berhasil diperbarui!');
    return true;
  };

  // --- DELETE FUNGSI ---
  const deletePurchase = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus pembelian.');
      return false;
    }

    const purchaseToDelete = purchases.find(p => p.id === id);

    console.log('[PurchaseContext] Mengirim perintah hapus pembelian:', id);
    const { error } = await supabase.from('purchases').delete().eq('id', id);

    if (error) {
      toast.error(`Gagal menghapus pembelian: ${error.message}`);
      console.error('[PurchaseContext] Error menghapus pembelian:', error);
      return false;
    }

    if (purchaseToDelete) {
      addActivity({ title: 'Pembelian Dihapus', description: `Pembelian dari ${purchaseToDelete.supplier} telah dihapus.`, type: 'purchase', value: null });
    }
    toast.success('Pembelian berhasil dihapus.');
    return true;
  };

  const value: PurchaseContextType = {
    purchases,
    isLoading,
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