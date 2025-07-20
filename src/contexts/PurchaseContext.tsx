// src/contexts/PurchaseContext.tsx
// VERSI REALTIME DENGAN RPC (Setelah Konfigurasi Supabase Publications)

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchase } from '@/types/supplier'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; // *** TAMBAHKAN toSafeISOString DI SINI ***

// --- INTERFACE & CONTEXT ---
interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  // Untuk update dan delete, kita perlu implementasi lengkapnya jika ingin realtime update dari situ
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
    items: dbItem.items || [], // Asumsi items adalah JSONB
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
    // Pastikan tidak ada properti 'notes' di sini jika memang tidak ada di DB
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter: `user_id=eq.${user.id}` }, // Mengubah event menjadi '*' untuk menerima INSERT, UPDATE, DELETE
        (payload) => {
          console.log('[PurchaseContext] Perubahan realtime diterima:', payload);
          const transform = transformPurchaseFromDB;

          if (payload.eventType === 'INSERT') {
            setPurchases(current => [transform(payload.new), ...current].sort((a, b) => new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime())); // Urutkan untuk menjaga urutan tanggal descending
          } else if (payload.eventType === 'UPDATE') { // Tambahkan penanganan UPDATE
            setPurchases(current => current.map(item => item.id === payload.new.id ? transform(payload.new) : item));
          } else if (payload.eventType === 'DELETE') { // Tambahkan penanganan DELETE
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

    // PENTING: Pastikan objek ini TIDAK PERNAH berisi properti 'notes'
    const purchaseDataForRPC = {
      user_id: user.id,
      supplier: purchase.supplier,
      total_nilai: purchase.totalNilai,
      tanggal: purchase.tanggal, // Tanggal harus dalam format yang diterima RPC (misal, ISO string)
      items: purchase.items,
      // JANGAN sertakan "notes" di sini.
    };

    console.log('[PurchaseContext] Mengirim data pembelian baru ke RPC:', purchaseDataForRPC);
    // Panggil fungsi RPC yang telah kita buat. Pastikan namanya sama persis di DB.
    const { error } = await supabase.rpc('add_purchase_and_update_stock', { purchase_data: purchaseDataForRPC });

    if (error) {
      toast.error(`Gagal memproses pembelian: ${error.message}`);
      console.error('[PurchaseContext] Error dari RPC "add_purchase_and_update_stock":', error);
      return false;
    }
    
    // Tidak perlu `setPurchases` di sini. Listener realtime akan menanganinya
    // JIKA diaktifkan di Supabase Publications.
    
    addActivity({ title: 'Pembelian Ditambahkan', description: `Pembelian dari ${purchase.supplier} senilai Rp ${purchase.totalNilai.toLocaleString('id-ID')}`, type: 'purchase', value: null });
    toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');
    return true;
  };

  // --- UPDATE FUNGSI (Jika Anda ingin kemampuan edit realtime) ---
  const updatePurchase = async (id: string, updatedPurchase: Partial<Purchase>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui pembelian.');
      return false;
    }

    const purchaseToUpdate: { [key: string]: any } = {
      updated_at: new Date().toISOString(), // Pastikan kolom ini ada di DB
    };

    if (updatedPurchase.supplier !== undefined) purchaseToUpdate.supplier = updatedPurchase.supplier;
    if (updatedPurchase.totalNilai !== undefined) purchaseToUpdate.total_nilai = updatedPurchase.totalNilai;
    if (updatedPurchase.tanggal !== undefined) purchaseToUpdate.tanggal = toSafeISOString(updatedPurchase.tanggal);
    if (updatedPurchase.items !== undefined) purchaseToUpdate.items = updatedPurchase.items;
    // JANGAN sertakan "notes" di sini.

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

  // --- DELETE FUNGSI (Jika Anda ingin kemampuan hapus realtime) ---
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