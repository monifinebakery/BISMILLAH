// src/contexts/BahanBakuContext.tsx
// VERSI REALTIME - DENGAN PERBAIKAN PADA DELETE

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/recipe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface BahanBakuContextType {
  bahanBaku: BahanBaku[];
  isLoading: boolean;
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();
  
  // --- HELPER FUNCTION ---
  const transformBahanBakuFromDB = (dbItem: any): BahanBaku => ({
    id: dbItem.id,
    nama: dbItem.nama,
    kategori: dbItem.kategori,
    stok: Number(dbItem.stok) || 0,
    satuan: dbItem.satuan,
    hargaSatuan: Number(dbItem.harga_satuan) || 0,
    minimum: Number(dbItem.minimum) || 0,
    supplier: dbItem.supplier,
    tanggalKadaluwarsa: safeParseDate(dbItem.tanggal_kadaluwarsa),
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
    jumlahBeliKemasan: dbItem.jumlah_beli_kemasan,
    satuanKemasan: dbItem.satuan_kemasan,
    hargaTotalBeliKemasan: dbItem.harga_total_beli_kemasan,
  });

  // --- EFEK UTAMA: FETCH DATA & REALTIME LISTENER ---
  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      setBahanBaku([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialBahanBaku = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) toast.error(`Gagal memuat bahan baku: ${error.message}`);
      else if (data) setBahanBaku(data.map(transformBahanBakuFromDB));
      setIsLoading(false);
    };

    fetchInitialBahanBaku();

    const channel = supabase
      .channel(`realtime-bahan-baku-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bahan_baku', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[BahanBakuContext] Perubahan realtime diterima:', payload);
          const transform = transformBahanBakuFromDB;

          if (payload.eventType === 'INSERT') {
            setBahanBaku(current => [transform(payload.new), ...current].sort((a, b) => a.nama.localeCompare(b.nama)));
          }
          if (payload.eventType === 'UPDATE') {
            setBahanBaku(current => current.map(item => item.id === payload.new.id ? transform(payload.new) : item));
          }
          
          // =========================================================
          // --- PERBAIKAN UTAMA ADA DI SINI ---
          // Menambahkan penanganan untuk event DELETE
          // =========================================================
          // --- TAMBAHKAN BLOK INI ---
      if (payload.eventType === 'DELETE') {
        const deletedItemId = payload.old.id;
        // Filter state, hapus item yang ID-nya cocok
        setBahanBaku(currentItems => currentItems.filter(item => item.id !== deletedItemId));
      }
    }
  )
  .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- FUNGSI-FUNGSI (Disederhanakan) ---
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk menambahkan bahan baku'); return false; }
    
    // ... (Logika insert sudah benar) ...
    const bahanToInsert = { user_id: user.id, nama: bahan.nama, kategori: bahan.kategori, stok: bahan.stok, satuan: bahan.satuan, harga_satuan: bahan.hargaSatuan, minimum: bahan.minimum, supplier: bahan.supplier, tanggal_kadaluwarsa: bahan.tanggalKadaluwarsa, jumlah_beli_kemasan: bahan.jumlahBeliKemasan, satuan_kemasan: bahan.satuanKemasan, harga_total_beli_kemasan: bahan.hargaTotalBeliKemasan };
    const { error } = await supabase.from('bahan_baku').insert(bahanToInsert);
    if (error) { toast.error(`Gagal menambahkan bahan baku: ${error.message}`); return false; }
    addActivity({ title: 'Bahan Baku Ditambahkan', description: `${bahan.nama} telah ditambahkan`, type: 'stok', value: null });
    toast.success(`${bahan.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk memperbarui bahan baku'); return false; }
    
    // ... (Logika update sudah benar) ...
    const bahanToUpdate: { [key: string]: any } = {};
    if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
    if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
    if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
    if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
    const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id);
    if (error) { toast.error(`Gagal memperbarui bahan baku: ${error.message}`); return false; }
    toast.success(`Bahan baku berhasil diperbarui!`);
    return true;
  };
  
  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) { toast.error("Anda harus login untuk menghapus bahan baku."); return false; }
    
    const bahanToDelete = bahanBaku.find(b => b.id === id); // Cari nama untuk log aktivitas

    // Kirim perintah hapus ke database
    const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
    if (error) {
       toast.error(`Gagal menghapus bahan baku: ${error.message}`);
       return false;
    }

    // TIDAK PERLU 'setBahanBaku' di sini. UI akan di-update oleh listener realtime.
    
    if (bahanToDelete) {
      addActivity({ title: 'Bahan Baku Dihapus', description: `${bahanToDelete.nama} telah dihapus.`, type: 'stok', value: null });
    }
    toast.success("Bahan baku berhasil dihapus.");
    return true;
  }

  // Fungsi get dan reduce tidak perlu diubah
  const getBahanBakuByName = useCallback((nama: string): BahanBaku | undefined => {
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  }, [bahanBaku]);

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan) { toast.error(`Bahan baku ${nama} tidak ditemukan.`); return false; }
    if (bahan.stok < jumlah) { toast.error(`Stok ${nama} (${bahan.stok}) tidak cukup untuk dikurangi ${jumlah}.`); return false; }
    const success = await updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    if (success) { addActivity({ title: 'Stok Berkurang', description: `Stok ${nama} berkurang ${jumlah} ${bahan.satuan}`, type: 'stok', value: null }); }
    return success;
  };
  
  const value: BahanBakuContextType = {
    bahanBaku,
    isLoading,
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