// src/contexts/BahanBakuContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/bahanBaku';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
// 🔔 FIXED NOTIFICATION IMPORTS
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
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
  // 🔔 NEW FUNCTIONS FOR NOTIFICATIONS
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

  // 🔔 HELPER FUNCTION - Get days until expiry
  const getDaysUntilExpiry = (expiryDate: Date | null): number => {
    if (!expiryDate) return Infinity;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 🔔 HELPER FUNCTION - Check if item is expiring soon
  const isExpiringSoon = (item: BahanBaku, days: number = 7): boolean => {
    if (!item.tanggalKadaluwarsa) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.tanggalKadaluwarsa);
    return daysUntilExpiry <= days && daysUntilExpiry > 0;
  };

  // 🔔 GET INVENTORY ANALYTICS
  const getLowStockItems = useCallback((): BahanBaku[] => {
    return bahanBaku.filter(item => item.stok > 0 && item.stok <= item.minimum);
  }, [bahanBaku]);

  const getOutOfStockItems = useCallback((): BahanBaku[] => {
    return bahanBaku.filter(item => item.stok === 0);
  }, [bahanBaku]);

  const getExpiringItems = useCallback((days: number = 7): BahanBaku[] => {
    return bahanBaku.filter(item => isExpiringSoon(item, days));
  }, [bahanBaku]);

  // 🔔 COMPREHENSIVE INVENTORY ALERT CHECKER
  const checkInventoryAlerts = useCallback(async (): Promise<void> => {
    if (!user || bahanBaku.length === 0) return;

    try {
      const lowStockItems = getLowStockItems();
      const outOfStockItems = getOutOfStockItems();
      const expiringItems = getExpiringItems(7); // 7 days warning
      const criticalExpiringItems = getExpiringItems(3); // 3 days critical

      // 🚫 OUT OF STOCK ALERTS (Priority 4 - Urgent)
      for (const item of outOfStockItems) {
        await addNotification({
          title: '🚫 Stok Habis!',
          message: `${item.nama} sudah habis. Segera lakukan pembelian untuk menghindari gangguan produksi.`,
          type: 'error',
          icon: 'alert-circle',
          priority: 4,
          related_type: 'inventory',
          action_url: '/inventory',
          is_read: false,
          is_archived: false
        });
      }

      // ⚠️ LOW STOCK ALERTS (Priority 3 - High)
      for (const item of lowStockItems) {
        await addNotification({
          title: '⚠️ Stok Menipis!',
          message: `${item.nama} tersisa ${item.stok} ${item.satuan} dari minimum ${item.minimum}. Pertimbangkan untuk melakukan pembelian.`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'inventory',
          action_url: '/inventory',
          is_read: false,
          is_archived: false
        });
      }

      // 🔥 CRITICAL EXPIRING ALERTS (Priority 4 - Urgent)
      for (const item of criticalExpiringItems) {
        const daysLeft = getDaysUntilExpiry(item.tanggalKadaluwarsa);
        await addNotification({
          title: '🔥 Segera Expired!',
          message: `${item.nama} akan expired dalam ${daysLeft} hari! Gunakan segera atau akan mengalami kerugian ${formatCurrency(item.stok * item.hargaSatuan)}.`,
          type: 'error',
          icon: 'calendar',
          priority: 4,
          related_type: 'inventory',
          action_url: '/inventory',
          is_read: false,
          is_archived: false
        });
      }

      // ⏰ EXPIRING SOON ALERTS (Priority 3 - High)
      for (const item of expiringItems) {
        if (!criticalExpiringItems.includes(item)) { // Don't duplicate critical items
          const daysLeft = getDaysUntilExpiry(item.tanggalKadaluwarsa);
          await addNotification({
            title: '⏰ Akan Expired',
            message: `${item.nama} akan expired dalam ${daysLeft} hari. Pertimbangkan untuk menggunakannya terlebih dahulu.`,
            type: 'warning',
            icon: 'calendar',
            priority: 3,
            related_type: 'inventory',
            action_url: '/inventory',
            is_read: false,
            is_archived: false
          });
        }
      }

    } catch (error) {
      console.error('Error checking inventory alerts:', error);
    }
  }, [user, bahanBaku, addNotification, getLowStockItems, getOutOfStockItems, getExpiringItems]);

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
      
      const transformedData = data.map(transformBahanBakuFromDB);
      setBahanBaku(transformedData);

      // 🔔 AUTO CHECK ALERTS AFTER LOADING DATA
      setTimeout(() => {
        checkInventoryAlerts();
      }, 1000);

    } catch (err: any) {
      console.error('Error fetching bahan baku:', err);
      toast.error(`Gagal memuat bahan baku: ${err.message}`);
      
      // 🔔 SYSTEM ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal memuat data inventory: ${err.message}`
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification, checkInventoryAlerts]);

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
      
      // Activity log
      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahan.nama} telah ditambahkan ke gudang.`,
        type: 'stok',
      });

      // Success toast
      toast.success(`${bahan.nama} berhasil ditambahkan ke inventory!`);

      // 🔔 SUCCESS NOTIFICATION
      await addNotification({
        title: '📦 Item Baru Ditambahkan!',
        message: `${bahan.nama} berhasil ditambahkan dengan stok ${bahan.stok} ${bahan.satuan} dan nilai ${formatCurrency(bahan.stok * bahan.hargaSatuan)}`,
        type: 'success',
        icon: 'package',
        priority: 2,
        related_type: 'inventory',
        action_url: '/inventory',
        is_read: false,
        is_archived: false
      });

      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      console.error('Error adding bahan baku:', error);
      toast.error(`Gagal menambahkan: ${error.message}`);
      
      // 🔔 ERROR NOTIFICATION
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

      const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id);
      if (error) throw error;
      
      const itemName = updatedBahan.nama ?? itemBeforeUpdate.nama;
      const oldStock = itemBeforeUpdate.stok;
      const newStock = updatedBahan.stok ?? itemBeforeUpdate.stok;
      const minStock = updatedBahan.minimum ?? itemBeforeUpdate.minimum;

      // 🔔 STOCK CHANGE NOTIFICATIONS
      if (updatedBahan.stok !== undefined && oldStock !== newStock) {
        
        // Stock increased (restock)
        if (newStock > oldStock) {
          const increase = newStock - oldStock;
          await addNotification({
            title: '📈 Stok Ditambahkan',
            message: `${itemName} bertambah ${increase} ${itemBeforeUpdate.satuan}. Total stok sekarang ${newStock} ${itemBeforeUpdate.satuan}`,
            type: 'success',
            icon: 'trending-up',
            priority: 1,
            related_type: 'inventory',
            action_url: '/inventory',
            is_read: false,
            is_archived: false
          });
        }
        
        // Stock decreased
        else if (newStock < oldStock) {
          const decrease = oldStock - newStock;
          
          // Stock went to zero (out of stock)
          if (newStock === 0) {
            await addNotification({
              title: '🚫 Stok Habis!',
              message: `${itemName} sudah habis setelah pengurangan ${decrease} ${itemBeforeUpdate.satuan}. Segera lakukan pembelian!`,
              type: 'error',
              icon: 'alert-circle',
              priority: 4,
              related_type: 'inventory',
              action_url: '/inventory',
              is_read: false,
              is_archived: false
            });
          }
          // Stock below minimum (low stock)
          else if (newStock <= minStock) {
            await addNotification({
              title: '⚠️ Stok Menipis!',
              message: `${itemName} berkurang ${decrease} ${itemBeforeUpdate.satuan}. Stok sekarang ${newStock} (minimum: ${minStock}). Pertimbangkan untuk melakukan pembelian.`,
              type: 'warning',
              icon: 'alert-triangle',
              priority: 3,
              related_type: 'inventory',
              action_url: '/inventory',
              is_read: false,
              is_archived: false
            });
          }
          // Normal stock decrease
          else {
            await addNotification({
              title: '📉 Stok Berkurang',
              message: `${itemName} berkurang ${decrease} ${itemBeforeUpdate.satuan}. Sisa stok ${newStock} ${itemBeforeUpdate.satuan}`,
              type: 'info',
              icon: 'trending-down',
              priority: 1,
              related_type: 'inventory',
              action_url: '/inventory',
              is_read: false,
              is_archived: false
            });
          }
        }
      }

      // 🔔 EXPIRY DATE CHANGE NOTIFICATION
      if (updatedBahan.tanggalKadaluwarsa !== undefined) {
        const oldExpiry = itemBeforeUpdate.tanggalKadaluwarsa;
        const newExpiry = updatedBahan.tanggalKadaluwarsa;
        
        if (oldExpiry?.getTime() !== newExpiry?.getTime()) {
          if (newExpiry) {
            const daysUntilExpiry = getDaysUntilExpiry(newExpiry);
            if (daysUntilExpiry <= 7) {
              await addNotification({
                title: '⏰ Tanggal Expired Diperbarui',
                message: `${itemName} akan expired dalam ${daysUntilExpiry} hari. Gunakan segera!`,
                type: 'warning',
                icon: 'calendar',
                priority: 3,
                related_type: 'inventory',
                action_url: '/inventory',
                is_read: false,
                is_archived: false
              });
            }
          }
        }
      }

      // Success toast
      toast.success(`${itemName} berhasil diperbarui!`);

      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      console.error('Error updating bahan baku:', error);
      toast.error(`Gagal memperbarui: ${error.message}`);
      
      // 🔔 ERROR NOTIFICATION
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

      // Success toast
      toast.success(`${itemToDelete?.nama || 'Item'} berhasil dihapus!`);

      // 🔔 DELETE NOTIFICATION
      if (itemToDelete) {
        await addNotification({
          title: '🗑️ Item Dihapus',
          message: `${itemToDelete.nama} telah dihapus dari inventory`,
          type: 'warning',
          icon: 'trash-2',
          priority: 2,
          related_type: 'inventory',
          action_url: '/inventory',
          is_read: false,
          is_archived: false
        });
      }

      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      console.error('Error deleting bahan baku:', error);
      toast.error(`Gagal menghapus: ${error.message}`);
      
      // 🔔 ERROR NOTIFICATION
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
      toast.success(`${ids.length} bahan baku berhasil dihapus!`);

      // 🔔 BULK DELETE NOTIFICATION
      await addNotification({
        title: '🗑️ Bulk Delete Inventory',
        message: `${ids.length} item berhasil dihapus dari inventory (${itemsToDelete.map(i => i.nama).join(', ').substring(0, 50)}${itemsToDelete.length > 3 ? '...' : ''})`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'inventory',
        action_url: '/inventory',
        is_read: false,
        is_archived: false
      });

      await fetchBahanBaku();
      return true;
    } catch (error: any) {
      console.error('Error bulk deleting:', error);
      toast.error(`Gagal menghapus: ${error.message}`);
      
      // 🔔 ERROR NOTIFICATION
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
      
      // 🔔 NOT FOUND NOTIFICATION
      await addNotification({
        title: '❌ Item Tidak Ditemukan',
        message: `Bahan baku "${nama}" tidak ditemukan saat mencoba mengurangi stok`,
        type: 'error',
        icon: 'alert-circle',
        priority: 3,
        related_type: 'inventory',
        action_url: '/inventory',
        is_read: false,
        is_archived: false
      });
      
      return false;
    }
    if (bahan.stok < jumlah) {
      toast.error(`Stok ${nama} (${bahan.stok}) tidak cukup untuk dikurangi ${jumlah}.`);
      
      // 🔔 INSUFFICIENT STOCK NOTIFICATION
      await addNotification({
        title: '⚠️ Stok Tidak Cukup',
        message: `${nama} hanya tersisa ${bahan.stok} ${bahan.satuan}, tidak cukup untuk dikurangi ${jumlah}`,
        type: 'warning',
        icon: 'alert-triangle',
        priority: 3,
        related_type: 'inventory',
        action_url: '/inventory',
        is_read: false,
        is_archived: false
      });
      
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
    // 🔔 NEW NOTIFICATION FUNCTIONS
    checkInventoryAlerts, getExpiringItems, getLowStockItems, getOutOfStockItems,
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