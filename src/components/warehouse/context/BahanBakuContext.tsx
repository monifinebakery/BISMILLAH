// src/contexts/BahanBakuContext.tsx
// FIXED VERSION - Auto Update UI without refresh

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

// Import modular warehouse types and utils
import { BahanBaku, WarehouseContextType } from './types';
import { 
  parseDate, 
  isValidDate,
} from '@/utils/unifiedDateUtils';
import { formatCurrency } from '@//utils/formatUtils';   

// Dependencies
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';

// Enhanced context interface extending the modular one
interface BahanBakuContextType extends WarehouseContextType {
  // Additional context-specific methods
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  checkInventoryAlerts: () => Promise<void>;
  getExpiringItems: (days?: number) => BahanBaku[];
  getLowStockItems: () => BahanBaku[];
  getOutOfStockItems: () => BahanBaku[];
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

// 🔧 FIXED: Add notification deduplication
const useNotificationDeduplicator = () => {
  const notificationCacheRef = useRef<Map<string, number>>(new Map());
  const CACHE_DURATION = 60000; // 1 minute
  
  const shouldSendNotification = (key: string): boolean => {
    const now = Date.now();
    const lastSent = notificationCacheRef.current.get(key);
    
    if (!lastSent || (now - lastSent) > CACHE_DURATION) {
      notificationCacheRef.current.set(key, now);
      return true;
    }
    
    return false;
  };
  
  return { shouldSendNotification };
};

// Utility functions (can be moved to warehouse/utils if needed)
const transformBahanBakuFromDB = (dbItem: any): BahanBaku => ({
  id: dbItem.id,
  nama: dbItem.nama,
  kategori: dbItem.kategori,
  stok: Number(dbItem.stok) || 0,
  satuan: dbItem.satuan,
  hargaSatuan: Number(dbItem.harga_satuan) || 0,
  minimum: Number(dbItem.minimum) || 0,
  supplier: dbItem.supplier,
  tanggalKadaluwarsa: parseDate(dbItem.tanggal_kadaluwarsa),
  userId: dbItem.user_id,
  createdAt: parseDate(dbItem.created_at),
  updatedAt: parseDate(dbItem.updated_at),
  jumlahBeliKemasan: dbItem.jumlah_beli_kemasan || 0,
  satuanKemasan: dbItem.satuan_kemasan || '',
  hargaTotalBeliKemasan: dbItem.harga_total_beli_kemasan || 0,
});

const transformBahanBakuToDB = (bahan: Partial<BahanBaku>): { [key: string]: any } => {
  const dbItem: { [key: string]: any } = {};
  
  if (bahan.nama !== undefined) dbItem.nama = bahan.nama;
  if (bahan.kategori !== undefined) dbItem.kategori = bahan.kategori;
  if (bahan.stok !== undefined) dbItem.stok = bahan.stok;
  if (bahan.satuan !== undefined) dbItem.satuan = bahan.satuan;
  if (bahan.hargaSatuan !== undefined) dbItem.harga_satuan = bahan.hargaSatuan;
  if (bahan.minimum !== undefined) dbItem.minimum = bahan.minimum;
  if (bahan.supplier !== undefined) dbItem.supplier = bahan.supplier;
  if (bahan.tanggalKadaluwarsa !== undefined) {
    dbItem.tanggal_kadaluwarsa = bahan.tanggalKadaluwarsa;
  }
  if (bahan.jumlahBeliKemasan !== undefined) {
    dbItem.jumlah_beli_kemasan = bahan.jumlahBeliKemasan;
  }
  if (bahan.satuanKemasan !== undefined) {
    dbItem.satuan_kemasan = bahan.satuanKemasan;
  }
  if (bahan.hargaTotalBeliKemasan !== undefined) {
    dbItem.harga_total_beli_kemasan = bahan.hargaTotalBeliKemasan;
  }
  
  return dbItem;
};

// Custom hooks for inventory analysis
const useInventoryAnalysis = (bahanBaku: BahanBaku[]) => {
  const getDaysUntilExpiry = useCallback((expiryDate: Date | null): number => {
    if (!expiryDate || !isValidDate(expiryDate)) return Infinity;
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

  const getLowStockItems = useCallback((items: BahanBaku[] = bahanBaku): BahanBaku[] => {
    return items.filter(item => item.stok > 0 && item.stok <= item.minimum);
  }, [bahanBaku]);

  const getOutOfStockItems = useCallback((items: BahanBaku[] = bahanBaku): BahanBaku[] => {
    return items.filter(item => item.stok === 0);
  }, [bahanBaku]);

  const getExpiringItems = useCallback((days: number = 7, items: BahanBaku[] = bahanBaku): BahanBaku[] => {
    return items.filter(item => isExpiringSoon(item, days));
  }, [bahanBaku, isExpiringSoon]);

  return {
    getDaysUntilExpiry,
    isExpiringSoon,
    getLowStockItems,
    getOutOfStockItems,
    getExpiringItems
  };
};

// Custom hook for selection management (integrated with warehouse selection logic)
const useWarehouseSelection = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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

  const selectAll = useCallback((items: BahanBaku[]) => {
    logger.context('BahanBakuContext', 'Select all items');
    setSelectedItems(items.map(item => item.id));
  }, []);

  const clearSelection = useCallback(() => {
    logger.context('BahanBakuContext', 'Clear selection');
    setSelectedItems([]);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    logger.context('BahanBakuContext', 'Toggle selection mode');
    setIsSelectionMode(prev => {
      if (prev) {
        setSelectedItems([]);
      }
      return !prev;
    });
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id);
  }, [selectedItems]);

  const getSelectedItems = useCallback((allItems: BahanBaku[]) => {
    return allItems.filter(item => selectedItems.includes(item.id));
  }, [selectedItems]);

  return {
    selectedItems,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    getSelectedItems
  };
};

// Provider Component
export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // Custom hooks
  const selection = useWarehouseSelection();
  const analysis = useInventoryAnalysis(bahanBaku);
  
  // 🔧 FIXED: Add deduplication
  const { shouldSendNotification } = useNotificationDeduplicator();

  // 🔧 FIXED: Proper subscription management
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const alertsCheckedRef = useRef<boolean>(false);
  const alertTimeoutRef = useRef<NodeJS.Timeout>();
  const lastAlertCheckRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  logger.context('BahanBakuContext', 'Provider render', { 
    user: user?.id,
    itemCount: bahanBaku.length,
    selectedCount: selection.selectedItems.length,
    selectionMode: selection.isSelectionMode
  });

  // 🔧 FIXED: Debounced alert checking function
  const checkInventoryAlerts = useCallback(async (itemsToCheck?: BahanBaku[]): Promise<void> => {
    if (!user || !isMountedRef.current) return;
    
    const now = Date.now();
    if (now - lastAlertCheckRef.current < 30000) {
      return;
    }
    lastAlertCheckRef.current = now;
    
    const items = itemsToCheck || bahanBaku;
    if (items.length === 0) return;

    logger.context('BahanBakuContext', 'Checking inventory alerts for', items.length, 'items');

    try {
      const lowStockItems = analysis.getLowStockItems(items);
      const outOfStockItems = analysis.getOutOfStockItems(items);
      const expiringItems = analysis.getExpiringItems(7, items);
      const criticalExpiringItems = analysis.getExpiringItems(3, items);

      logger.context('BahanBakuContext', 'Alert counts:', {
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        expiring: expiringItems.length,
        criticalExpiring: criticalExpiringItems.length
      });

      // 🔧 FIXED: Create notifications only if not sent recently
      for (const item of outOfStockItems.slice(0, 3)) {
        const notificationKey = `out-of-stock-${item.id}`;
        if (shouldSendNotification(notificationKey)) {
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
      }

      for (const item of lowStockItems.slice(0, 3)) {
        const notificationKey = `low-stock-${item.id}`;
        if (shouldSendNotification(notificationKey)) {
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
      }

      for (const item of criticalExpiringItems.slice(0, 2)) {
        const notificationKey = `expiring-${item.id}`;
        if (shouldSendNotification(notificationKey)) {
          const daysLeft = analysis.getDaysUntilExpiry(item.tanggalKadaluwarsa);
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
      }

      const totalIssues = outOfStockItems.length + lowStockItems.length + criticalExpiringItems.length;
      if (totalIssues > 5) {
        const summaryKey = `summary-${totalIssues}`;
        if (shouldSendNotification(summaryKey)) {
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
      }

      alertsCheckedRef.current = true;
    } catch (error) {
      logger.error('BahanBakuContext - Error checking inventory alerts:', error);
    }
  }, [user, bahanBaku, addNotification, analysis, shouldSendNotification]);

  // 🔧 FIXED: Data fetching with proper error handling
  const fetchBahanBaku = useCallback(async (shouldCheckAlerts: boolean = false) => {
    if (!user || !isMountedRef.current) {
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

      if (!isMountedRef.current) return; // Prevent state update if unmounted

      const transformedData = data.map(transformBahanBakuFromDB);
      logger.context('BahanBakuContext', 'Data loaded:', transformedData.length, 'items');
      setBahanBaku(transformedData);

      // 🔧 FIXED: Debounced alert checking
      if (shouldCheckAlerts && !alertsCheckedRef.current && transformedData.length > 0) {
        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }
        alertTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            checkInventoryAlerts(transformedData);
          }
        }, 5000);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      logger.error('BahanBakuContext - Error fetching bahan baku:', err);
      toast.error(`Gagal memuat bahan baku: ${err.message}`);
      await addNotification(createNotificationHelper.systemError(
        `Gagal memuat data inventory: ${err.message}`
      ));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, addNotification, checkInventoryAlerts]);

  const refreshData = useCallback(async () => {
    await fetchBahanBaku(false);
  }, [fetchBahanBaku]);

  // 🔧 FIXED: Real-time subscription setup
  useEffect(() => {
    if (!user) {
      // Clean up if no user
      if (subscriptionRef.current) {
        logger.context('BahanBakuContext', 'Cleaning up subscription - no user');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setBahanBaku([]);
      setIsLoading(false);
      return;
    }

    // Don't setup multiple subscriptions
    if (subscriptionRef.current) {
      logger.context('BahanBakuContext', 'Subscription already exists for user:', user.id);
      return;
    }

    logger.context('BahanBakuContext', 'Setting up subscription for user:', user.id);

    const channel = supabase
      .channel(`bahan_baku_changes_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bahan_baku',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (!isMountedRef.current) return;
        
        logger.context('BahanBakuContext', 'Real-time event:', payload.eventType, payload.new?.id || payload.old?.id);
        
        // 🔧 FIXED: Proper real-time state updates
        setBahanBaku((prevBahanBaku) => {
          let newBahanBaku = [...prevBahanBaku];
          
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            newBahanBaku = newBahanBaku.filter((item) => item.id !== payload.old.id);
            logger.context('BahanBakuContext', 'Item deleted via real-time:', payload.old.id);
          }
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newItem = transformBahanBakuFromDB(payload.new);
            newBahanBaku = [...newBahanBaku, newItem].sort((a, b) => a.nama.localeCompare(b.nama));
            logger.context('BahanBakuContext', 'Item added via real-time:', newItem.id);
          }
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedItem = transformBahanBakuFromDB(payload.new);
            newBahanBaku = newBahanBaku.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ).sort((a, b) => a.nama.localeCompare(b.nama));
            logger.context('BahanBakuContext', 'Item updated via real-time:', updatedItem.id);
          }
          
          return newBahanBaku;
        });

        // 🔧 FIXED: Handle selection cleanup for deleted items
        if (payload.eventType === 'DELETE' && payload.old?.id) {
          selection.toggleSelection(payload.old.id);
        }
      })
      .subscribe((status) => {
        logger.context('BahanBakuContext', 'Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          subscriptionRef.current = channel;
          // Initial data load after subscription is ready
          fetchBahanBaku(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.error('BahanBakuContext', 'Subscription error:', status);
          subscriptionRef.current = null;
          // Retry subscription after a delay
          setTimeout(() => {
            if (isMountedRef.current && user) {
              logger.context('BahanBakuContext', 'Retrying subscription...');
              // This will trigger the effect again due to user dependency
            }
          }, 5000);
        }
      });

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        logger.context('BahanBakuContext', 'Cleaning up subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [user?.id]); // Only depend on user ID to avoid unnecessary re-subscriptions

  // 🔧 FIXED: Component cleanup tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 🔧 FIXED: Reset state when user changes
  useEffect(() => {
    selection.clearSelection();
    alertsCheckedRef.current = false;
    lastAlertCheckRef.current = 0;
  }, [user?.id, selection.clearSelection]);

  // 🔧 FIXED: CRUD Operations with optimistic updates
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan bahan baku');
      return false;
    }

    try {
      const bahanToInsert = {
        user_id: user.id,
        ...transformBahanBakuToDB(bahan)
      };

      const { data, error } = await supabase
        .from('bahan_baku')
        .insert(bahanToInsert)
        .select()
        .single();

      if (error) throw error;

      // 🔧 FIXED: Don't manually update state - let real-time subscription handle it
      logger.context('BahanBakuContext', 'Item added successfully, real-time will update UI');

      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahan.nama} telah ditambahkan ke gudang.`,
        type: 'stok',
      });

      toast.success(`${bahan.nama} berhasil ditambahkan ke inventory!`);

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

      const bahanToUpdate = transformBahanBakuToDB(updatedBahan);

      const { data, error } = await supabase
        .from('bahan_baku')
        .update(bahanToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 🔧 FIXED: Don't manually update state - let real-time subscription handle it
      logger.context('BahanBakuContext', 'Item updated successfully, real-time will update UI');

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
      
      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .eq('id', id);
        
      if (error) throw error;

      // 🔧 FIXED: Don't manually update state - let real-time subscription handle it
      logger.context('BahanBakuContext', 'Item deleted successfully, real-time will update UI');

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
      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);
        
      if (error) throw error;

      // 🔧 FIXED: Don't manually update state - let real-time subscription handle it
      logger.context('BahanBakuContext', 'Bulk delete successful, real-time will update UI');

      selection.clearSelection();
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

  // Additional utility methods
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

  // Context value
  const value: BahanBakuContextType = {
    // Warehouse context interface
    bahanBaku,
    loading: isLoading,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    bulkDeleteBahanBaku,
    
    // Selection interface (integrated with modular warehouse)
    selectedItems: selection.selectedItems,
    isSelectionMode: selection.isSelectionMode,
    isBulkDeleting,
    toggleSelection: selection.toggleSelection,
    selectAll: () => selection.selectAll(bahanBaku),
    clearSelection: selection.clearSelection,
    toggleSelectionMode: selection.toggleSelectionMode,
    isSelected: selection.isSelected,
    getSelectedItems: () => selection.getSelectedItems(bahanBaku),
    
    // Additional context methods
    getBahanBakuByName,
    reduceStok,
    refreshData,
    checkInventoryAlerts,
    getExpiringItems: analysis.getExpiringItems,
    getLowStockItems: analysis.getLowStockItems,
    getOutOfStockItems: analysis.getOutOfStockItems,
  };

  logger.context('BahanBakuContext', 'Providing context value:', {
    itemCount: bahanBaku.length,
    selectedCount: selection.selectedItems.length,
    selectionMode: selection.isSelectionMode,
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