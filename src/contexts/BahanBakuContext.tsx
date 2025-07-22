// src/contexts/BahanBakuContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/bahanBaku';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useNotification } from './NotificationContext'; // <-- 1. IMPORT NotificationContext
import { createNotificationHelper } from '@/utils/notificationHelpers'; // <-- 2. IMPORT Helper
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface BahanBakuContextType {
  bahanBaku: BahanBaku[];
  isLoading: boolean;
  selectedItems: string[];
  isSelectionMode: boolean;
  isBulkDeleting: boolean;
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: () => BahanBaku[];
  refreshData: () => Promise<void>;
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification(); // <-- 3. GUNAKAN HOOK NOTIFIKASI

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

  const fetchBahanBaku = useCallback(async () => {
    if (!user) {
      setBahanBaku([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) throw error;
      
      setBahanBaku(data.map(transformBahanBakuFromDB));
    } catch (err: any) {
      toast.error(`Gagal memuat bahan baku: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBahanBaku();
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, [fetchBahanBaku]);

  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan bahan baku');
      return false;
    }
    try {
      const bahanToInsert = {
          user_id: user.id,
          nama: bahan.nama,
          kategori: bahan.kategori,
          stok: bahan.stok,
          satuan: bahan.satuan,
          harga_satuan: bahan.hargaSatuan,
          minimum: bahan.minimum,
          supplier: bahan.supplier,
          tanggal_kadaluwarsa: bahan.tanggalKadaluwarsa,
          jumlah_beli_kemasan: bahan.jumlahBeliKemasan,
          satuan_kemasan: bahan.satuanKemasan,
          harga_total_beli_kemasan: bahan.hargaTotalBeliKemasan
      };
      const { error } = await supabase.from('bahan_baku').insert(bahanToInsert).select().single();
      if (error) throw error;
      
      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahan.nama} telah ditambahkan ke gudang.`,
        type: 'stok',
      });
      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      toast.error(`Gagal menambahkan: ${error.message}`);
      return false;
    }
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui bahan baku');
      return false;
    }
    try {
      const itemBeforeUpdate = bahanBaku.find(b => b.id === id);
      if (!itemBeforeUpdate) throw new Error("Item tidak ditemukan untuk diperbarui.");

      const bahanToUpdate: { [key: string]: any } = {};
      // ... (mapping properti camelCase ke snake_case)
      if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
      if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
      if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
      if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
      if (updatedBahan.minimum !== undefined) bahanToUpdate.minimum = updatedBahan.minimum;
      if (updatedBahan.supplier !== undefined) bahanToUpdate.supplier = updatedBahan.supplier;
      if (updatedBahan.tanggalKadaluwarsa !== undefined) bahanToUpdate.tanggal_kadaluwarsa = updatedBahan.tanggalKadaluwarsa;

      const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id);
      if (error) throw error;
      
      // 🔔 INTEGRASI NOTIFIKASI
      if (updatedBahan.stok !== undefined) {
        const newStock = updatedBahan.stok;
        const minStock = updatedBahan.minimum ?? itemBeforeUpdate.minimum;
        const itemName = updatedBahan.nama ?? itemBeforeUpdate.nama;

        // Cek stok habis
        if (newStock === 0 && itemBeforeUpdate.stok > 0) {
          await addNotification(createNotificationHelper.outOfStock(itemName));
        } 
        // Cek stok menipis
        else if (newStock > 0 && newStock <= minStock && itemBeforeUpdate.stok > minStock) {
          await addNotification(createNotificationHelper.lowStock(itemName, newStock, minStock));
        }
      }

      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      toast.error(`Gagal memperbarui: ${error.message}`);
      await addNotification(createNotificationHelper.systemError(`Gagal mengubah stok: ${error.message}`));
      return false;
    }
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menghapus bahan baku.");
      return false;
    }
    try {
      const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
      if (error) throw error;
      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus: ${error.message}`);
      return false;
    }
  };

  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
    if (!user || ids.length === 0) return false;
    setIsBulkDeleting(true);
    try {
      const { error } = await supabase.from('bahan_baku').delete().in('id', ids).eq('user_id', user.id);
      if (error) throw error;
      
      clearSelection();
      toast.success(`${ids.length} bahan baku berhasil dihapus!`);
      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus: ${error.message}`);
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
      toast.error(`Stok ${nama} (${bahan.stok}) tidak cukup untuk dikurangi ${jumlah}.`);
      return false;
    }
    return await updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
  };

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(bahanBaku.map(item => item.id));
  }, [bahanBaku]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedItems([]);
    }
  }, [isSelectionMode]);

  const isSelected = useCallback((id: string) => selectedItems.includes(id), [selectedItems]);

  const getSelectedItems = useCallback(() => {
    return bahanBaku.filter(item => selectedItems.includes(item.id));
  }, [bahanBaku, selectedItems]);

  const value: BahanBakuContextType = {
    bahanBaku, isLoading, selectedItems, isSelectionMode, isBulkDeleting,
    addBahanBaku, updateBahanBaku, deleteBahanBaku, getBahanBakuByName, reduceStok,
    bulkDeleteBahanBaku, toggleSelection, selectAll, clearSelection,
    toggleSelectionMode, isSelected, getSelectedItems, refreshData: fetchBahanBaku,
  };

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
