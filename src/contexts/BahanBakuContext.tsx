// src/contexts/BahanBakuContext.tsx
// TEMPORARY VERSION - WITHOUT NOTIFICATION INTEGRATION
// Use this to test if the issue is with notification integration

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BahanBaku } from '@/types/bahanbaku';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

interface BahanBakuContextType {
  bahanBaku: BahanBaku[];
  isLoading: boolean;
  addBahanBaku: (bahanBaku: Omit<BahanBaku, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahanBaku: Partial<Omit<BahanBaku, 'id' | 'userId'>>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();

  console.log('[BahanBakuContext] Provider initialized', { user: user?.id });

  const transformFromDB = (dbItem: any): BahanBaku => ({
    id: dbItem.id,
    nama: dbItem.nama,
    satuan: dbItem.satuan,
    stok: Number(dbItem.stok) || 0,
    minimum: Number(dbItem.minimum) || 0,
    hargaPerSatuan: Number(dbItem.harga_per_satuan) || 0,
    supplier: dbItem.supplier,
    kategori: dbItem.kategori,
    lokasi: dbItem.lokasi,
    tanggalExpired: dbItem.tanggal_expired ? safeParseDate(dbItem.tanggal_expired) : null,
    catatan: dbItem.catatan,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  useEffect(() => {
    console.log('[BahanBakuContext] useEffect triggered', { user: user?.id });
    
    if (!user) {
      console.log('[BahanBakuContext] No user, clearing data');
      setBahanBaku([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      console.log('[BahanBakuContext] Fetching initial data...');
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('bahan_baku')
          .select('*')
          .eq('user_id', user.id)
          .order('nama', { ascending: true });

        console.log('[BahanBakuContext] Query result:', { data, error });

        if (error) {
          console.error('[BahanBakuContext] Database error:', error);
          toast.error(`Gagal memuat bahan baku: ${error.message}`);
        } else {
          const transformedData = (data || []).map(transformFromDB);
          console.log('[BahanBakuContext] Data transformed:', transformedData.length, 'items');
          setBahanBaku(transformedData);
        }
      } catch (error) {
        console.error('[BahanBakuContext] Unexpected error:', error);
        toast.error('Terjadi kesalahan saat memuat data');
      } finally {
        console.log('[BahanBakuContext] Loading finished');
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`realtime-bahan-baku-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bahan_baku',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[BahanBakuContext] Real-time event:', payload);
        
        if (payload.eventType === 'INSERT') {
          setBahanBaku(current => [transformFromDB(payload.new), ...current].sort((a, b) => a.nama.localeCompare(b.nama)));
        }
        if (payload.eventType === 'UPDATE') {
          setBahanBaku(current => current.map(item => item.id === payload.new.id ? transformFromDB(payload.new) : item));
        }
        if (payload.eventType === 'DELETE') {
          setBahanBaku(current => current.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      console.log('[BahanBakuContext] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]); // ONLY user dependency

  const addBahanBaku = async (bahanBaku: Omit<BahanBaku, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan bahan baku');
      return false;
    }

    try {
      const bahanBakuToInsert = {
        user_id: user.id,
        nama: bahanBaku.nama,
        satuan: bahanBaku.satuan,
        stok: bahanBaku.stok,
        minimum: bahanBaku.minimum,
        harga_per_satuan: bahanBaku.hargaPerSatuan,
        supplier: bahanBaku.supplier,
        kategori: bahanBaku.kategori,
        lokasi: bahanBaku.lokasi,
        tanggal_expired: bahanBaku.tanggalExpired?.toISOString(),
        catatan: bahanBaku.catatan,
      };

      const { error } = await supabase.from('bahan_baku').insert(bahanBakuToInsert);
      
      if (error) throw error;

      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahanBaku.nama} telah ditambahkan ke gudang`,
        type: 'gudang',
        value: null,
      });

      toast.success(`${bahanBaku.nama} berhasil ditambahkan!`);
      return true;
    } catch (error) {
      console.error('[BahanBakuContext] Error adding:', error);
      toast.error(`Gagal menambahkan bahan baku: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const updateBahanBaku = async (id: string, bahanBaku: Partial<Omit<BahanBaku, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui bahan baku');
      return false;
    }

    try {
      const dataToUpdate: { [key: string]: any } = {};
      
      if (bahanBaku.nama !== undefined) dataToUpdate.nama = bahanBaku.nama;
      if (bahanBaku.satuan !== undefined) dataToUpdate.satuan = bahanBaku.satuan;
      if (bahanBaku.stok !== undefined) dataToUpdate.stok = bahanBaku.stok;
      if (bahanBaku.minimum !== undefined) dataToUpdate.minimum = bahanBaku.minimum;
      if (bahanBaku.hargaPerSatuan !== undefined) dataToUpdate.harga_per_satuan = bahanBaku.hargaPerSatuan;
      if (bahanBaku.supplier !== undefined) dataToUpdate.supplier = bahanBaku.supplier;
      if (bahanBaku.kategori !== undefined) dataToUpdate.kategori = bahanBaku.kategori;
      if (bahanBaku.lokasi !== undefined) dataToUpdate.lokasi = bahanBaku.lokasi;
      if (bahanBaku.tanggalExpired !== undefined) dataToUpdate.tanggal_expired = bahanBaku.tanggalExpired?.toISOString();
      if (bahanBaku.catatan !== undefined) dataToUpdate.catatan = bahanBaku.catatan;

      const { error } = await supabase.from('bahan_baku').update(dataToUpdate).eq('id', id);
      
      if (error) throw error;

      toast.success('Bahan baku berhasil diperbarui!');
      return true;
    } catch (error) {
      console.error('[BahanBakuContext] Error updating:', error);
      toast.error(`Gagal memperbarui bahan baku: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus bahan baku');
      return false;
    }

    try {
      const bahanBakuToDelete = bahanBaku.find(item => item.id === id);
      
      const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
      
      if (error) throw error;

      if (bahanBakuToDelete) {
        addActivity({
          title: 'Bahan Baku Dihapus',
          description: `${bahanBakuToDelete.nama} telah dihapus dari gudang`,
          type: 'gudang',
          value: null,
        });
      }

      toast.success('Bahan baku berhasil dihapus!');
      return true;
    } catch (error) {
      console.error('[BahanBakuContext] Error deleting:', error);
      toast.error(`Gagal menghapus bahan baku: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const value: BahanBakuContextType = {
    bahanBaku,
    isLoading,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
  };

  console.log('[BahanBakuContext] Providing value:', { 
    itemCount: bahanBaku.length, 
    isLoading,
    hasUser: !!user 
  });

  return (
    <BahanBakuContext.Provider value={value}>
      {children}
    </BahanBakuContext.Provider>
  );
};

export const useBahanBaku = () => {
  const context = useContext(BahanBakuContext);
  if (context === undefined) {
    throw new Error('useBahanBaku must be used within a BahanBakuProvider');
  }
  return context;
};