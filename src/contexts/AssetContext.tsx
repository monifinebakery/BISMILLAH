// src/contexts/AssetContext.tsx
// VERSI REALTIME - DATABASE SEBAGAI SATU-SATUNYA SUMBER KEBENARAN

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Asset } from '@/types/asset'; // Pastikan path tipe data Anda benar
import { toast } from 'sonner';

// --- Dependensi ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { supabase } from '@/integrations/supabase/client';
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateAsset: (id: string, asset: Partial<Omit<Asset, 'id' | 'userId'>>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- DEPENDENSI ---
  const { user } = useAuth();
  const { addActivity } = useActivity();

  // --- HELPER FUNCTION ---
  // Helper untuk mengubah data dari format DB (snake_case) ke format aplikasi (camelCase)
  // Ini mencegah duplikasi kode antara fetch awal dan listener realtime.
  const transformAssetFromDB = (dbAsset: any): Asset => ({
    id: dbAsset.id,
    nama: dbAsset.nama || '',
    kategori: dbAsset.kategori || null,
    nilaiAwal: parseFloat(dbAsset.nilai_awal) || 0,
    nilaiSaatIni: parseFloat(dbAsset.nilai_sekarang) || 0,
    tanggalPembelian: safeParseDate(dbAsset.tanggal_beli),
    kondisi: dbAsset.kondisi || null,
    lokasi: dbAsset.lokasi || null,
    deskripsi: dbAsset.deskripsi || null,
    depresiasi: dbAsset.depresiasi,
    userId: dbAsset.user_id,
    createdAt: safeParseDate(dbAsset.created_at),
    updatedAt: safeParseDate(dbAsset.updated_at),
  });


  // ===================================================================
  // --- EFEK UTAMA: FETCH DATA AWAL & SET UP REALTIME LISTENER ---
  // ===================================================================
  useEffect(() => {
    // Jika status user belum jelas, jangan lakukan apa-apa.
    if (user === undefined) {
      return;
    }

    // Jika pengguna logout, bersihkan state.
    if (!user) {
      console.log("[AssetContext] User logout, membersihkan data aset.");
      setAssets([]);
      setIsLoading(false);
      return;
    }

    // --- PENGGUNA LOGIN ---
    
    // 1. Ambil data awal dari Supabase
    const fetchInitialAssets = async () => {
      console.log(`[AssetContext] User terdeteksi (${user.id}), memuat data aset...`);
      setIsLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error(`Gagal memuat aset: ${error.message}`);
      } else if (data) {
        setAssets(data.map(transformAssetFromDB));
      }
      setIsLoading(false);
    };
    
    fetchInitialAssets();

    // 2. Setup Realtime Subscription
    const channel = supabase
      .channel(`realtime-assets-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Dengarkan semua event (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'assets',
          filter: `user_id=eq.${user.id}`, // Filter hanya untuk user yang sedang login
        },
        (payload) => {
          console.log('[AssetContext] Perubahan realtime diterima:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newAsset = transformAssetFromDB(payload.new);
            setAssets(currentAssets => [newAsset, ...currentAssets]);
          }
          if (payload.eventType === 'UPDATE') {
            const updatedAsset = transformAssetFromDB(payload.new);
            setAssets(currentAssets => 
              currentAssets.map(a => (a.id === updatedAsset.id ? updatedAsset : a))
            );
          }
          if (payload.eventType === 'DELETE') {
            const deletedAssetId = payload.old.id;
            setAssets(currentAssets => currentAssets.filter(a => a.id !== deletedAssetId));
          }
        }
      )
      .subscribe();

    // 3. Cleanup: Wajib untuk unsubscribe channel saat komponen unmount atau user berubah
    return () => {
      console.log("[AssetContext] Membersihkan channel realtime aset.");
      supabase.removeChannel(channel);
    };
  }, [user]); // KUNCI UTAMA: Bereaksi hanya terhadap perubahan `user`.


  // ===================================================================
  // --- FUNGSI-FUNGSI CRUD (Disederhanakan) ---
  // Tugasnya hanya mengirim data ke DB. Pembaruan UI ditangani oleh listener.
  // ===================================================================
  const addAsset = async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menambah aset.");
      return false;
    }
    
    // Transformasi ke snake_case untuk DB
    const assetToInsert = {
        user_id: user.id, nama: asset.nama, kategori: asset.kategori,
        nilai_awal: asset.nilaiAwal, nilai_sekarang: asset.nilaiSaatIni,
        tanggal_beli: asset.tanggalPembelian, kondisi: asset.kondisi,
        lokasi: asset.lokasi, deskripsi: asset.deskripsi, depresiasi: asset.depresiasi,
    };

    const { data, error } = await supabase.from('assets').insert(assetToInsert).select().single();
    if (error) {
      toast.error("Gagal menyimpan aset: " + error.message);
      return false;
    }

    // UI akan diupdate oleh listener, tapi kita tetap bisa melakukan aksi lain di sini
    addActivity({
      title: 'Aset Ditambahkan',
      description: `${asset.nama} telah ditambahkan ke daftar aset.`,
      type: 'aset', value: null,
    });
    toast.success("Aset berhasil ditambahkan.");
    return true;
  };

  const updateAsset = async (id: string, asset: Partial<Omit<Asset, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk memperbarui aset.");
      return false;
    }
    
    // Transformasi ke snake_case
    const assetToUpdate: { [key: string]: any } = {};
    if (asset.nama !== undefined) assetToUpdate.nama = asset.nama;
    if (asset.kategori !== undefined) assetToUpdate.kategori = asset.kategori;
    if (asset.nilaiAwal !== undefined) assetToUpdate.nilai_awal = asset.nilaiAwal;
    if (asset.nilaiSaatIni !== undefined) assetToUpdate.nilai_sekarang = asset.nilaiSaatIni;
    if (asset.tanggalPembelian !== undefined) assetToUpdate.tanggal_beli = asset.tanggalPembelian;
    // ...tambahkan field lain jika perlu...

    const { error } = await supabase.from('assets').update(assetToUpdate).eq('id', id);
    if (error) {
       toast.error("Gagal memperbarui aset: " + error.message);
       return false;
    }

    toast.success("Aset berhasil diperbarui.");
    return true;
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menghapus aset.");
      return false;
    }
    const assetToDelete = assets.find(a => a.id === id); // Cari nama sebelum dihapus untuk log
    if (!assetToDelete) return false;

    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
       toast.error("Gagal menghapus aset: " + error.message);
       return false;
    }

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