// src/contexts/BahanBakuContext.tsx
// FIXED VERSION - NO RENDERING LOOPS & WORKING SELECTION

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { BahanBaku } from '@/types/bahanBaku';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '../utils/notificationHelpers';
import { safeParseDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';

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
  checkInventoryAlerts: () => Promise<void>;
  getExpiringItems: (days?: number) => BahanBaku[];
  getLowStockItems: () => BahanBaku[];
  getOutOfStockItems: () => BahanBaku[];
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
  const { addNotification } = useNotification();

  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const alertsCheckedRef = useRef<boolean>(false); // 🔧 FIX: Prevent infinite alerts

  logger.context('BahanBakuContext', 'Provider render', { 
    user: user?.id,
    itemCount: bahanBaku.length,
    selectedCount: selectedItems.length,
    selectionMode: isSelectionMode
  });

  const transformBahanBakuFromDB = useCallback((dbItem: any): BahanBaku => ({
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
  }), []);

  const getDaysUntilExpiry = useCallback((expiryDate: Date | null): number => {
    if (!expiryDate) return Infinity;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const isExpiringSoon = useCallback((item: BahanBaku, days: number = 7): boolean => {
    if (!item.tanggalKadaluwarsa) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.tanggalKadaluwarsa);
    return daysUntilExpiry <= days && daysUntilExpiry > 0;
  }, [getDaysUntilExpiry]);

  // 🔧 FIX: Simple helper functions without dependencies on bahanBaku
  const getLowStockItems = useCallback((items: BahanBaku[] = bahanBaku): BahanBaku[] => {
    return items.filter(item => item.stok > 0 && item.stok <= item.minimum);
  }, [bahanBaku]);

  const getOutOfStockItems = useCallback((items: BahanBaku[] = bahanBaku): BahanBaku[] => {
    return items.filter(item => item.stok === 0);
  }, [bahanBaku]);

  const getExpiringItems = useCallback((days: number = 7, items: BahanBaku[] = bahanBaku): BahanBaku[] => {
    return items.filter(item => isExpiringSoon(item, days));
  }, [bahanBaku, isExpiringSoon]);

  // 🔧 FIX: Isolated alert check function
  const checkInventoryAlerts = useCallback(async (itemsToCheck?: BahanBaku[]): Promise<void> => {
    if (!user) return;
    
    const items = itemsToCheck || bahanBaku;
    if (items.length === 0) return;

    logger.context('BahanBakuContext', 'Checking inventory alerts for', items.length, 'items');

    try {
      const lowStockItems = getLowStockItems(items);
      const outOfStockItems = getOutOfStockItems(items);
      const expiringItems = getExpiringItems(7, items);
      const criticalExpiringItems = getExpiringItems(3, items);

      logger.context('BahanBakuContext', 'Alert counts:', {
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        expiring: expiringItems.length,
        criticalExpiring: criticalExpiringItems.length
      });

      // Create notifications for critical issues
      for (const item of outOfStockItems.slice(0, 3)) { // Limit to prevent spam
        await addNotification({
          title: '🚫 Stok Habis!',
          message: `${item.nama} sudah habis. Segera lakukan pembelian untuk menghindari gangguan produksi.`,
          type: 'error',
          icon: 'alert-circle',
          priority: 4,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false
        });
      }

      for (const item of lowStockItems.slice(0, 3)) { // Limit to prevent spam
        await addNotification({
          title: '⚠️ Stok Menipis!',
          message: `${item.nama} tersisa ${item.stok} ${item.satuan} dari minimum ${item.minimum}. Pertimbangkan untuk melakukan pembelian.`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false
        });
      }

      for (const item of criticalExpiringItems.slice(0, 2)) { // Limit to prevent spam
        const daysLeft = getDaysUntilExpiry(item.tanggalKadaluwarsa);
        await addNotification({
          title: '🔥 Segera Expired!',
          message: `${item.nama} akan expired dalam ${daysLeft} hari! Gunakan segera atau akan mengalami kerugian ${formatCurrency(item.stok * item.hargaSatuan)}.`,
          type: 'error',
          icon: 'calendar',
          priority: 4,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false
        });
      }

      // Summary notification for multiple issues
      const totalIssues = outOfStockItems.length + lowStockItems.length + criticalExpiringItems.length;
      if (totalIssues > 5) {
        await addNotification({
          title: '📊 Ringkasan Alert Gudang',
          message: `${outOfStockItems.length} habis, ${lowStockItems.length} menipis, ${criticalExpiringItems.length} akan expired`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false
        });
      }

      alertsCheckedRef.current = true; // Mark as checked
    } catch (error) {
      logger.error('BahanBakuContext - Error checking inventory alerts:', error);
    }
  }, [user, bahanBaku, addNotification, getLowStockItems, getOutOfStockItems, getExpiringItems, getDaysUntilExpiry]);

  // 🔧 FIX: Separate fetch function without alert check
  const fetchBahanBaku = useCallback(async (shouldCheckAlerts: boolean = false) => {
    if (!user) {
      setBahanBaku([]);
      setIsLoading(false);
      return;
    }

    logger.context('BahanBakuContext', 'Fetching data...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) {
        throw new Error(`Gagal mengambil data: ${error.message}`);
      }

      const transformedData = data.map(transformBahanBakuFromDB);
      logger.context('BahanBakuContext', 'Data loaded:', transformedData.length, 'items');
      setBahanBaku(transformedData);

      // 🔧 FIX: Only check alerts on initial load, not on every fetch
      if (shouldCheckAlerts && !alertsCheckedRef.current && transformedData.length > 0) {
        setTimeout(() => {
          checkInventoryAlerts(transformedData);
        }, 2000); // Delay to prevent immediate loop
      }
    } catch (err: any) {
      logger.error('BahanBakuContext - Error fetching bahan baku:', err);
      toast.error(`Gagal memuat bahan baku: ${err.message}`);
      await addNotification(createNotificationHelper.systemError(
        `Gagal memuat data inventory: ${err.message}`
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, transformBahanBakuFromDB, addNotification, checkInventoryAlerts]);

  // 🔧 FIX: Separate refresh function
  const refreshData = useCallback(async () => {
    await fetchBahanBaku(false); // Don't check alerts on refresh
  }, [fetchBahanBaku]);

  // Setup subscription once on mount
  useEffect(() => {
    if (!user || subscriptionRef.current) return;

    logger.context('BahanBakuContext', 'Setting up subscription for user:', user.id);

    const channel = supabase
      .channel(`bahan_baku_changes_${user.id}`) // Unique channel name
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bahan_baku',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        logger.context('BahanBakuContext', 'Real-time event:', payload.eventType, payload.new?.id || payload.old?.id);
        
        setBahanBaku((prev) => {
          if (payload.eventType === 'DELETE') {
            const filtered = prev.filter((item) => item.id !== payload.old.id);
            // Remove from selection if deleted
            setSelectedItems(current => current.filter(id => id !== payload.old.id));
            return filtered;
          }
          if (payload.eventType === 'INSERT') {
            const newItem = transformBahanBakuFromDB(payload.new);
            return [...prev, newItem].sort((a, b) => a.nama.localeCompare(b.nama));
          }
          if (payload.eventType === 'UPDATE') {
            const updatedItem = transformBahanBakuFromDB(payload.new);
            return prev.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ).sort((a, b) => a.nama.localeCompare(b.nama));
          }
          return prev;
        });
      })
      .subscribe((status) => {
        logger.context('BahanBakuContext', 'Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          subscriptionRef.current = channel;
        }
      });

    return () => {
      if (subscriptionRef.current) {
        logger.context('BahanBakuContext', 'Cleaning up subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, transformBahanBakuFromDB]);

  // Initial data load
  useEffect(() => {
    logger.context('BahanBakuContext', 'Initial data load for user:', user?.id);
    fetchBahanBaku(true); // Check alerts on initial load
    setSelectedItems([]);
    setIsSelectionMode(false);
    alertsCheckedRef.current = false; // Reset alert check flag
  }, [user]); // 🔧 FIX: Only depend on user, not fetchBahanBaku

  // 🔧 FIX: Simplified selection functions
  const toggleSelection = useCallback((id: string) => {
    logger.context('BahanBakuContext', 'Toggle selection:', id);
    setSelectedItems(prev => {
      const isCurrentlySelected = prev.includes(id);
      if (isCurrentlySelected) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    logger.context('BahanBakuContext', 'Select all items');
    setSelectedItems(bahanBaku.map(item => item.id));
  }, [bahanBaku]);

  const clearSelection = useCallback(() => {
    logger.context('BahanBakuContext', 'Clear selection');
    setSelectedItems([]);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    logger.context('BahanBakuContext', 'Toggle selection mode');
    setIsSelectionMode(prev => {
      if (prev) {
        // Exiting selection mode - clear selections
        setSelectedItems([]);
      }
      return !prev;
    });
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id);
  }, [selectedItems]);

  const getSelectedItems = useCallback(() => {
    return bahanBaku.filter(item => selectedItems.includes(item.id));
  }, [bahanBaku, selectedItems]);

  // CRUD Operations (simplified)
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

      const { error } = await supabase
        .from('bahan_baku')
        .insert(bahanToInsert);

      if (error) throw error;

      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahan.nama} telah ditambahkan ke gudang.`,
        type: 'stok',
      });

      toast.success(`${bahan.nama} berhasil ditambahkan ke inventory!`);

      // Create success notification
      await addNotification({
        title: '📦 Item Baru Ditambahkan!',
        message: `${bahan.nama} berhasil ditambahkan dengan stok ${bahan.stok} ${bahan.satuan}`,
        type: 'success',
        icon: 'package',
        priority: 2,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error: any) {
      logger.error('BahanBakuContext - Error adding bahan baku:', error);
      toast.error(`Gagal menambahkan: ${error.message}`);
      await addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan ${bahan.nama}: ${error.message}`
      ));
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
      if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
      if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
      if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
      if (updatedBahan.satuan !== undefined) bahanToUpdate.satuan = updatedBahan.satuan;
      if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
      if (updatedBahan.minimum !== undefined) bahanToUpdate.minimum = updatedBahan.minimum;
      if (updatedBahan.supplier !== undefined) bahanToUpdate.supplier = updatedBahan.supplier;
      if (updatedBahan.tanggalKadaluwarsa !== undefined) bahanToUpdate.tanggal_kadaluwarsa = updatedBahan.tanggalKadaluwarsa;
      if (updatedBahan.jumlahBeliKemasan !== undefined) bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan;
      if (updatedBahan.satuanKemasan !== undefined) bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan;
      if (updatedBahan.hargaTotalBeliKemasan !== undefined) bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan;

      const { error } = await supabase
        .from('bahan_baku')
        .update(bahanToUpdate)
        .eq('id', id);

      if (error) throw error;

      const itemName = updatedBahan.nama ?? itemBeforeUpdate.nama;
      toast.success(`${itemName} berhasil diperbarui!`);

      return true;
    } catch (error: any) {
      logger.error('BahanBakuContext - Error updating bahan baku:', error);
      toast.error(`Gagal memperbarui: ${error.message}`);
      await addNotification(createNotificationHelper.systemError(
        `Gagal mengubah stok: ${error.message}`
      ));
      return false;
    }
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menghapus bahan baku.");
      return false;
    }

    try {
      const itemToDelete = bahanBaku.find(b => b.id === id);
      const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
      if (error) throw error;

      toast.success(`${itemToDelete?.nama || 'Item'} berhasil dihapus!`);

      if (itemToDelete) {
        await addNotification({
          title: '🗑️ Item Dihapus',
          message: `${itemToDelete.nama} telah dihapus dari inventory`,
          type: 'warning',
          icon: 'trash-2',
          priority: 2,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false
        });
      }

      return true;
    } catch (error: any) {
      logger.error('BahanBakuContext - Error deleting bahan baku:', error);
      toast.error(`Gagal menghapus: ${error.message}`);
      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus item: ${error.message}`
      ));
      return false;
    }
  };

  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
    if (!user || ids.length === 0) return false;
    
    setIsBulkDeleting(true);
    try {
      const itemsToDelete = bahanBaku.filter(b => ids.includes(b.id));
      const { error } = await supabase.from('bahan_baku').delete().in('id', ids).eq('user_id', user.id);
      if (error) throw error;

      clearSelection();
      setIsSelectionMode(false);
      toast.success(`${ids.length} bahan baku berhasil dihapus!`);

      await addNotification({
        title: '🗑️ Bulk Delete Inventory',
        message: `${ids.length} item berhasil dihapus dari inventory`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error: any) {
      logger.error('BahanBakuContext - Error bulk deleting:', error);
      toast.error(`Gagal menghapus: ${error.message}`);
      await addNotification(createNotificationHelper.systemError(
        `Gagal bulk delete: ${error.message}`
      ));
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

  const value: BahanBakuContextType = {
    bahanBaku,
    isLoading,
    selectedItems,
    isSelectionMode,
    isBulkDeleting,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    getBahanBakuByName,
    reduceStok,
    bulkDeleteBahanBaku,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    getSelectedItems,
    refreshData,
    checkInventoryAlerts,
    getExpiringItems,
    getLowStockItems,
    getOutOfStockItems,
  };

  logger.context('BahanBakuContext', 'Providing context value:', {
    itemCount: bahanBaku.length,
    selectedCount: selectedItems.length,
    selectionMode: isSelectionMode,
    loading: isLoading
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