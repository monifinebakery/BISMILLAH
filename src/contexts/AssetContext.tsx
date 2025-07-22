// src/contexts/AssetContext.tsx
// VERSI REALTIME - DATABASE SEBAGAI SATU-SATUNYA SUMBER KEBENARAN

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Asset } from '@/types/asset';
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
  error: string | null;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- DEPENDENSI ---
  const contextValue = useAuth();
  const activityContextValue = useActivity();
  
  const user = contextValue?.user;
  const addActivity = activityContextValue?.addActivity || (() => {});

  // --- HELPER FUNCTION ---
  // Helper untuk mengubah data dari format DB (snake_case) ke format aplikasi (camelCase)
  const transformAssetFromDB = useCallback((dbAsset: any): Asset | null => {
    try {
      if (!dbAsset || !dbAsset.id) {
        console.warn('Invalid asset data received from database:', dbAsset);
        return null;
      }

      return {
        id: dbAsset.id,
        nama: dbAsset.nama || '',
        kategori: dbAsset.kategori || null,
        nilaiAwal: parseFloat(dbAsset.nilai_awal) || 0,
        nilaiSaatIni: parseFloat(dbAsset.nilai_sekarang) || 0,
        tanggalPembelian: safeParseDate(dbAsset.tanggal_beli),
        kondisi: dbAsset.kondisi || null,
        lokasi: dbAsset.lokasi || '',
        deskripsi: dbAsset.deskripsi || null,
        depresiasi: dbAsset.depresiasi ? parseFloat(dbAsset.depresiasi) : null,
        userId: dbAsset.user_id,
        createdAt: safeParseDate(dbAsset.created_at),
        updatedAt: safeParseDate(dbAsset.updated_at),
      };
    } catch (error) {
      console.error('Error transforming asset from DB:', error);
      return null;
    }
  }, []);

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
      setError(null);
      return;
    }

    // --- PENGGUNA LOGIN ---
    
    // 1. Ambil data awal dari Supabase
    const fetchInitialAssets = async () => {
      try {
        console.log(`[AssetContext] User terdeteksi (${user.id}), memuat data aset...`);
        setIsLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data) {
          const transformedAssets = data
            .map(transformAssetFromDB)
            .filter((asset): asset is Asset => asset !== null);
          
          setAssets(transformedAssets);
          console.log(`[AssetContext] Loaded ${transformedAssets.length} assets`);
        } else {
          setAssets([]);
        }
      } catch (error) {
        console.error('[AssetContext] Error fetching assets:', error);
        setError(error instanceof Error ? error.message : 'Gagal memuat aset');
        toast.error(`Gagal memuat aset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
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
          try {
            console.log('[AssetContext] Perubahan realtime diterima:', payload);
            
            if (payload.eventType === 'INSERT' && payload.new) {
              const newAsset = transformAssetFromDB(payload.new);
              if (newAsset) {
                setAssets(currentAssets => [newAsset, ...currentAssets]);
              }
            }
            
            if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedAsset = transformAssetFromDB(payload.new);
              if (updatedAsset) {
                setAssets(currentAssets => 
                  currentAssets.map(a => (a.id === updatedAsset.id ? updatedAsset : a))
                );
              }
            }
            
            if (payload.eventType === 'DELETE' && payload.old?.id) {
              const deletedAssetId = payload.old.id;
              setAssets(currentAssets => currentAssets.filter(a => a.id !== deletedAssetId));
            }
          } catch (error) {
            console.error('[AssetContext] Error handling realtime event:', error);
          }
        }
      )
      .subscribe();

    // 3. Cleanup: Wajib untuk unsubscribe channel saat komponen unmount atau user berubah
    return () => {
      console.log("[AssetContext] Membersihkan channel realtime aset.");
      supabase.removeChannel(channel);
    };
  }, [user, transformAssetFromDB]); // KUNCI UTAMA: Bereaksi hanya terhadap perubahan `user`.

  // ===================================================================
  // --- FUNGSI-FUNGSI CRUD (Disederhanakan) ---
  // ===================================================================
  const addAsset = useCallback(async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menambah aset.");
      return false;
    }
    
    try {
      // Transformasi ke snake_case untuk DB
      const assetToInsert = {
        user_id: user.id,
        nama: asset.nama?.trim(),
        kategori: asset.kategori,
        nilai_awal: asset.nilaiAwal,
        nilai_sekarang: asset.nilaiSaatIni,
        tanggal_beli: asset.tanggalPembelian,
        kondisi: asset.kondisi,
        lokasi: asset.lokasi?.trim(),
        deskripsi: asset.deskripsi?.trim() || null,
        depresiasi: asset.depresiasi,
      };

      const { data, error } = await supabase
        .from('assets')
        .insert(assetToInsert)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }

      // UI akan diupdate oleh listener, tapi kita tetap bisa melakukan aksi lain di sini
      addActivity({
        title: 'Aset Ditambahkan',
        description: `${asset.nama} telah ditambahkan ke daftar aset.`,
        type: 'aset',
        value: null,
      });

      return true;
    } catch (error) {
      console.error('[AssetContext] Error adding asset:', error);
      toast.error(`Gagal menyimpan aset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [user, addActivity]);

  const updateAsset = useCallback(async (id: string, asset: Partial<Omit<Asset, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk memperbarui aset.");
      return false;
    }

    if (!id) {
      toast.error("ID aset tidak valid.");
      return false;
    }
    
    try {
      // Transformasi ke snake_case
      const assetToUpdate: { [key: string]: any } = {};
      
      if (asset.nama !== undefined) assetToUpdate.nama = asset.nama?.trim();
      if (asset.kategori !== undefined) assetToUpdate.kategori = asset.kategori;
      if (asset.nilaiAwal !== undefined) assetToUpdate.nilai_awal = asset.nilaiAwal;
      if (asset.nilaiSaatIni !== undefined) assetToUpdate.nilai_sekarang = asset.nilaiSaatIni;
      if (asset.tanggalPembelian !== undefined) assetToUpdate.tanggal_beli = asset.tanggalPembelian;
      if (asset.kondisi !== undefined) assetToUpdate.kondisi = asset.kondisi;
      if (asset.lokasi !== undefined) assetToUpdate.lokasi = asset.lokasi?.trim();
      if (asset.deskripsi !== undefined) assetToUpdate.deskripsi = asset.deskripsi?.trim() || null;
      if (asset.depresiasi !== undefined) assetToUpdate.depresiasi = asset.depresiasi;

      const { error } = await supabase
        .from('assets')
        .update(assetToUpdate)
        .eq('id', id)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('[AssetContext] Error updating asset:', error);
      toast.error(`Gagal memperbarui aset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [user]);

  const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menghapus aset.");
      return false;
    }

    if (!id) {
      toast.error("ID aset tidak valid.");
      return false;
    }

    try {
      const assetToDelete = assets.find(a => a.id === id);
      
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        throw new Error(error.message);
      }

      if (assetToDelete) {
        addActivity({
          title: 'Aset Dihapus',
          description: `${assetToDelete.nama} telah dihapus.`,
          type: 'aset',
          value: null,
        });
      }

      return true;
    } catch (error) {
      console.error('[AssetContext] Error deleting asset:', error);
      toast.error(`Gagal menghapus aset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [user, assets, addActivity]);

  const value: AssetContextType = {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    isLoading,
    error
  };

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
};

export const useAssets = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};