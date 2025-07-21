import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/bahanBaku';
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

    // --- FUNGSI UNTUK MENGAMBIL ULANG DATA (REFETCH) ---
    const fetchBahanBaku = async () => {
        if (!user) {
            setBahanBaku([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        console.log('[BahanBakuContext] Memulai fetchBahanBaku untuk user:', user.id); // Log untuk debugging
        const { data, error } = await supabase
            .from('bahan_baku')
            .select('*')
            .eq('user_id', user.id)
            .order('nama', { ascending: true });

        if (error) {
            console.error('[BahanBakuContext] Gagal memuat bahan baku:', error.message); // Log error
            toast.error(`Gagal memuat bahan baku: ${error.message}`);
        } else if (data) {
            const transformedData = data.map(transformBahanBakuFromDB);
            console.log('[BahanBakuContext] Data bahan baku berhasil dimuat (transformed):', transformedData); // Log data
            setBahanBaku(transformedData);
        }
        setIsLoading(false);
        console.log('[BahanBakuContext] fetchBahanBaku selesai.'); // Log selesai
    };

  // --- EFEK UTAMA: FETCH DATA ---
  useEffect(() => {
    console.log('[BahanBakuContext] useEffect dipicu, user:', user?.id); // Log useEffect
    fetchBahanBaku(); // Panggil saat mount atau user berubah

    // --- PENTING: BAGIAN REALTIME LISTENER DIHAPUS JIKA FITUR TIDAK TERSEDIA ---
    // Karena Anda mengatakan Replication/Realtime "Coming Soon", listener ini TIDAK AKAN BEKERJA.
    // Jika nanti fitur ini tersedia dan Anda mengaktifkannya di Supabase Publications,
    // Anda bisa mengembalikan kode listener di sini.

    // const channel = supabase
    //   .channel(`realtime-bahan-baku-${user.id}`)
    //   .on(
    //     'postgres_changes',
    //     { event: '*', schema: 'public', table: 'bahan_baku', filter: `user_id=eq.${user.id}` },
    //     (payload) => {
    //       console.log('[BahanBakuContext] Perubahan realtime diterima:', payload);
    //       const transform = transformBahanBakuFromDB;
    //       if (payload.eventType === 'INSERT') {
    //         setBahanBaku(current => [transform(payload.new), ...current].sort((a, b) => a.nama.localeCompare(b.nama)));
    //       }
    //       if (payload.eventType === 'UPDATE') {
    //         setBahanBaku(current => current.map(item => item.id === payload.new.id ? transform(payload.new) : item));
    //       }
    //       if (payload.eventType === 'DELETE') {
    //         const deletedItemId = payload.old.id;
    //         setBahanBaku(currentItems => currentItems.filter(item => item.id !== deletedItemId));
    //       }
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   // if (channel) supabase.removeChannel(channel); // Cleanup jika channel diaktifkan
    // };
  }, [user]); // Dependensi user memastikan listener di-setup ulang jika user berubah

  // --- FUNGSI-FUNGSI CUD (Disesuaikan untuk Refetch) ---
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk menambahkan bahan baku'); return false; }
    
    const bahanToInsert = { user_id: user.id, nama: bahan.nama, kategori: bahan.kategori, stok: bahan.stok, satuan: bahan.satuan, harga_satuan: bahan.hargaSatuan, minimum: bahan.minimum, supplier: bahan.supplier, tanggal_kadaluwarsa: bahan.tanggalKadaluwarsa, jumlah_beli_kemasan: bahan.jumlahBeliKemasan, satuan_kemasan: bahan.satuanKemasan, harga_total_beli_kemasan: bahan.hargaTotalBeliKemasan };
    console.log('[BahanBakuContext] Mengirim data bahan baku baru:', bahanToInsert); // Log pengiriman
    const { error } = await supabase.from('bahan_baku').insert(bahanToInsert);
    if (error) { 
        toast.error(`Gagal menambahkan bahan baku: ${error.message}`); 
        console.error('[BahanBakuContext] Error menambahkan bahan baku:', error);
        return false; 
    }
    addActivity({ title: 'Bahan Baku Ditambahkan', description: `${bahan.nama} telah ditambahkan`, type: 'stok', value: null });
    toast.success(`${bahan.nama} berhasil ditambahkan!`);
    console.log('[BahanBakuContext] Bahan baku berhasil ditambahkan di DB, memicu fetchBahanBaku.');
    await fetchBahanBaku(); // Refetch setelah sukses
    return true;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk memperbarui bahan baku'); return false; }
    
    const bahanToUpdate: { [key: string]: any } = {};
    if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
    if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
    if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
    if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
    // Tambahkan field lain yang mungkin diupdate
    if (updatedBahan.minimum !== undefined) bahanToUpdate.minimum = updatedBahan.minimum;
    if (updatedBahan.supplier !== undefined) bahanToUpdate.supplier = updatedBahan.supplier;
    if (updatedBahan.tanggalKadaluwarsa !== undefined) bahanToUpdate.tanggal_kadaluwarsa = updatedBahan.tanggalKadaluwarsa;
    if (updatedBahan.jumlahBeliKemasan !== undefined) bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan;
    if (updatedBahan.satuanKemasan !== undefined) bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan;
    if (updatedBahan.hargaTotalBeliKemasan !== undefined) bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan;


    console.log('[BahanBakuContext] Mengirim update bahan baku:', id, bahanToUpdate); // Log pengiriman update
    const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id);
    if (error) { 
        toast.error(`Gagal memperbarui bahan baku: ${error.message}`); 
        console.error('[BahanBakuContext] Error memperbarui bahan baku:', error);
        return false; 
    }
    toast.success(`Bahan baku berhasil diperbarui!`);
    console.log('[BahanBakuContext] Bahan baku berhasil diperbarui di DB, memicu fetchBahanBaku.');
    await fetchBahanBaku(); // Refetch setelah sukses
    return true;
  };
  
  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) { toast.error("Anda harus login untuk menghapus bahan baku."); return false; }
    
    const bahanToDelete = bahanBaku.find(b => b.id === id); 
    console.log('[BahanBakuContext] Mengirim perintah hapus bahan baku:', id); // Log pengiriman delete
    const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
    if (error) {
       toast.error(`Gagal menghapus bahan baku: ${error.message}`);
        console.error('[BahanBakuContext] Error menghapus bahan baku:', error);
       return false;
    }

    // TIDAK PERLU 'setBahanBaku' di sini. UI akan di-update oleh refetch.
    if (bahanToDelete) {
      addActivity({ title: 'Bahan Baku Dihapus', description: `${bahanToDelete.nama} telah dihapus.`, type: 'stok', value: null });
    }
    toast.success("Bahan baku berhasil dihapus.");
    console.log('[BahanBakuContext] Bahan baku berhasil dihapus dari DB, memicu fetchBahanBaku.');
    await fetchBahanBaku(); // Refetch setelah sukses
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