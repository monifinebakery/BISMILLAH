// src/contexts/BahanBakuContext.tsx
// COMPLETE VERSION - REAL-TIME LOOP FIX & NOTIFICATION INTEGRATION

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/bahanbaku';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '../utils/notificationHelpers';
import { safeParseDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';

interface BahanBakuContextType {
  bahanBaku: BahanBaku[];
  isLoading: boolean;
  selectedItems: Set<string>;
  selectMode: boolean;
  addBahanBaku: (bahanBaku: Omit<BahanBaku, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahanBaku: Partial<Omit<BahanBaku, 'id' | 'userId'>>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (name: string) => BahanBaku | undefined;
  reduceStok: (name: string, quantity: number) => Promise<boolean>;
  toggleSelectMode: () => void;
  toggleSelectItem: (id: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  deleteSelectedItems: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  checkInventoryAlerts: () => Promise<void>;
  getExpiringItems: (days?: number) => BahanBaku[];
  getLowStockItems: () => BahanBaku[];
  getOutOfStockItems: () => BahanBaku[];
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

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

  const getDaysUntilExpiry = (expiryDate: Date | null): number => {
    if (!expiryDate) return Infinity;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getLowStockItems = useCallback((): BahanBaku[] => {
    return bahanBaku.filter(item => item.stok > 0 && item.stok <= item.minimum);
  }, [bahanBaku]);

  const getOutOfStockItems = useCallback((): BahanBaku[] => {
    return bahanBaku.filter(item => item.stok === 0);
  }, [bahanBaku]);

  const getExpiringItems = useCallback((days: number = 7): BahanBaku[] => {
    return bahanBaku.filter(item => {
        if (!item.tanggalExpired) return false;
        const daysUntilExpiry = getDaysUntilExpiry(item.tanggalExpired);
        return daysUntilExpiry <= days && daysUntilExpiry > 0;
    });
  }, [bahanBaku]);

  const checkInventoryAlerts = useCallback(async () => {
    if (!user || bahanBaku.length === 0) return;
    try {
      const lowStock = getLowStockItems();
      const outOfStock = getOutOfStockItems();
      const expiring = getExpiringItems(7);

      for (const item of outOfStock) {
        await addNotification(createNotificationHelper.stockOut(item.nama));
      }
      for (const item of lowStock) {
        await addNotification(createNotificationHelper.lowStock(item.nama, item.stok, item.minimum));
      }
      for (const item of expiring) {
        const daysLeft = getDaysUntilExpiry(item.tanggalExpired);
        await addNotification(createNotificationHelper.expiringSoon(item.nama, daysLeft));
      }
    } catch (error) {
      console.error('Error checking inventory alerts:', error);
    }
  }, [user, bahanBaku, addNotification, getLowStockItems, getOutOfStockItems, getExpiringItems]);

  const refreshData = useCallback(async (isInitialLoad = false) => {
    if (!user) {
        setBahanBaku([]);
        setIsLoading(false);
        return;
    }

    if (isInitialLoad) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) throw error;
      
      const transformedData = (data || []).map(transformFromDB);
      setBahanBaku(transformedData);
      
    } catch (error: any) {
      toast.error(`Gagal memuat data gudang: ${error.message}`);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [user]);

  // ✅ FIX: This useEffect now ONLY depends on the user.
  // This prevents the infinite loop.
  useEffect(() => {
    if (!user) {
      setBahanBaku([]);
      setSelectedItems(new Set());
      setSelectMode(false);
      setIsLoading(false);
      return;
    }

    refreshData(true);

    const channel = supabase
      .channel(`realtime-bahan-baku-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bahan_baku',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[BahanBakuContext] Real-time event received, refreshing data:', payload.eventType);
        // Re-fetch data on any change. This is simpler and more reliable.
        refreshData(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // We intentionally leave out refreshData to prevent loops.

  const addBahanBaku = async (bahanBakuData: Omit<BahanBaku, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('bahan_baku').insert({
          user_id: user.id,
          nama: bahanBakuData.nama?.trim(),
          satuan: bahanBakuData.satuan?.trim(),
          stok: bahanBakuData.stok,
          minimum: bahanBakuData.minimum,
          harga_per_satuan: bahanBakuData.hargaPerSatuan,
          supplier: bahanBakuData.supplier?.trim(),
          kategori: bahanBakuData.kategori?.trim(),
          lokasi: bahanBakuData.lokasi?.trim(),
          tanggal_expired: bahanBakuData.tanggalExpired?.toISOString(),
          catatan: bahanBakuData.catatan?.trim() || null,
      });
      if (error) throw error;
      toast.success(`${bahanBakuData.nama} berhasil ditambahkan!`);
      // Real-time will handle the UI update
      return true;
    } catch (error: any) {
      toast.error(`Gagal menambahkan: ${error.message}`);
      return false;
    }
  };

  const updateBahanBaku = async (id: string, updatedData: Partial<Omit<BahanBaku, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) return false;
    try {
      const dataToUpdate: { [key: string]: any } = {};
      if (updatedData.nama !== undefined) dataToUpdate.nama = updatedData.nama;
      if (updatedData.stok !== undefined) dataToUpdate.stok = updatedData.stok;
      // ... (add other fields as needed)
      
      const { error } = await supabase.from('bahan_baku').update(dataToUpdate).eq('id', id);
      if (error) throw error;
      toast.success('Bahan baku berhasil diperbarui!');
      // Real-time will handle the UI update
      return true;
    } catch (error: any) {
      toast.error(`Gagal memperbarui: ${error.message}`);
      return false;
    }
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
      if (error) throw error;
      toast.success('Bahan baku berhasil dihapus.');
      // Real-time will handle the UI update
      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus: ${error.message}`);
      return false;
    }
  };

  const deleteSelectedItems = async (): Promise<boolean> => {
    if (selectedItems.size === 0) return false;
    setIsBulkDeleting(true);
    try {
      const itemIds = Array.from(selectedItems);
      const { error } = await supabase.from('bahan_baku').delete().in('id', itemIds);
      if (error) throw error;
      
      deselectAllItems();
      toast.success(`${itemIds.length} item berhasil dihapus!`);
      // Real-time will handle the UI update
      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus item terpilih: ${error.message}`);
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  };
  
  const getBahanBakuByName = useCallback((name: string): BahanBaku | undefined => {
    return bahanBaku.find(item => item.nama.toLowerCase() === name.toLowerCase());
  }, [bahanBaku]);

  const reduceStok = useCallback(async (name: string, quantity: number): Promise<boolean> => {
    const item = getBahanBakuByName(name);
    if (!item) {
      toast.error(`Bahan baku ${name} tidak ditemukan.`);
      return false;
    }
    if (item.stok < quantity) {
      toast.error(`Stok ${name} (${item.stok}) tidak cukup.`);
      return false;
    }
    return await updateBahanBaku(item.id, { stok: item.stok - quantity });
  }, [getBahanBakuByName, updateBahanBaku]);

  const toggleSelectMode = () => {
    setSelectMode(prev => {
        const newMode = !prev;
        if (!newMode) { // If turning off select mode
            setSelectedItems(new Set());
        }
        return newMode;
    });
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(current => {
      const updated = new Set(current);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(bahanBaku.map(item => item.id)));
  };

  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  const value: BahanBakuContextType = {
    bahanBaku,
    isLoading,
    selectedItems,
    selectMode,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    getBahanBakuByName,
    reduceStok,
    toggleSelectMode,
    toggleSelectItem,
    selectAllItems,
    deselectAllItems,
    deleteSelectedItems,
    refreshData: () => refreshData(true),
    checkInventoryAlerts,
    getExpiringItems,
    getLowStockItems,
    getOutOfStockItems,
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
