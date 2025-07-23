// src/contexts/BahanBakuContext.tsx
// COMPLETE VERSION - FULL NOTIFICATION INTEGRATION & SUPABASE SYNC

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/bahanbaku';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '../utils/notificationHelpers';
import { safeParseDate } from '@/utils/dateUtils';

interface BahanBakuContextType {
  bahanBaku: BahanBaku[];
  isLoading: boolean;
  selectedItems: Set<string>;
  selectMode: boolean;
  addBahanBaku: (bahanBaku: Omit<BahanBaku, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahanBaku: Partial<Omit<BahanBaku, 'id' | 'userId'>>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  toggleSelectMode: () => void;
  toggleSelectItem: (id: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  deleteSelectedItems: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

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

  // 🔔 Smart low stock check with notification
  const checkLowStock = useCallback(async (items: BahanBaku[]) => {
    if (!user || items.length === 0) return;

    try {
      const lowStockItems = items.filter(item => item.stok <= item.minimum && item.minimum > 0);
      const outOfStockItems = items.filter(item => item.stok === 0);
      
      console.log('[BahanBakuContext] Stock check:', { 
        total: items.length, 
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length 
      });

      // Create notifications for out of stock items (high priority)
      for (const item of outOfStockItems) {
        await addNotification(createNotificationHelper.stockOut(item.nama));
      }

      // Create notifications for low stock items (but not out of stock)
      const justLowStock = lowStockItems.filter(item => item.stok > 0);
      for (const item of justLowStock) {
        await addNotification(createNotificationHelper.lowStock(item.nama, item.stok, item.minimum));
      }

      // Create summary notification if there are multiple issues
      if (lowStockItems.length > 3) {
        await addNotification({
          title: '📊 Ringkasan Stok Gudang',
          message: `${outOfStockItems.length} item habis, ${justLowStock.length} item stok menipis`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false
        });
      }
    } catch (error) {
      console.warn('[BahanBakuContext] Error in stock check:', error);
    }
  }, [user, addNotification]);

  // 🔄 Refresh data function
  const refreshData = useCallback(async () => {
    if (!user) return;

    console.log('[BahanBakuContext] Refreshing data...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) {
        console.error('[BahanBakuContext] Refresh error:', error);
        toast.error(`Gagal memuat data: ${error.message}`);
        
        // Create error notification
        await addNotification(createNotificationHelper.systemError(
          `Gagal memuat data gudang: ${error.message}`
        ));
      } else {
        const transformedData = (data || []).map(transformFromDB);
        console.log('[BahanBakuContext] Data refreshed:', transformedData.length, 'items');
        setBahanBaku(transformedData);
        
        // Check stock after refresh (with delay to avoid spam)
        setTimeout(() => checkLowStock(transformedData), 2000);
      }
    } catch (error) {
      console.error('[BahanBakuContext] Unexpected refresh error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification, checkLowStock]);

  // 🚀 Initial data load and real-time setup
  useEffect(() => {
    console.log('[BahanBakuContext] useEffect triggered', { user: user?.id });
    
    if (!user) {
      console.log('[BahanBakuContext] No user, clearing data');
      setBahanBaku([]);
      setSelectedItems(new Set());
      setSelectMode(false);
      setIsLoading(false);
      return;
    }

    // Initial data load
    refreshData();

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
        
        try {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newItem = transformFromDB(payload.new);
            setBahanBaku(current => {
              const updated = [newItem, ...current].sort((a, b) => a.nama.localeCompare(b.nama));
              // Check stock for new item
              setTimeout(() => checkLowStock([newItem]), 1000);
              return updated;
            });
          }
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedItem = transformFromDB(payload.new);
            setBahanBaku(current => {
              const updated = current.map(item => item.id === updatedItem.id ? updatedItem : item);
              // Check stock for updated item
              setTimeout(() => checkLowStock([updatedItem]), 1000);
              return updated;
            });
          }
          
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            const deletedId = payload.old.id;
            setBahanBaku(current => current.filter(item => item.id !== deletedId));
            // Remove from selection if it was selected
            setSelectedItems(current => {
              const updated = new Set(current);
              updated.delete(deletedId);
              return updated;
            });
          }
        } catch (error) {
          console.error('[BahanBakuContext] Error handling real-time event:', error);
        }
      })
      .subscribe((status) => {
        console.log('[BahanBakuContext] Real-time subscription status:', status);
      });

    return () => {
      console.log('[BahanBakuContext] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, refreshData, checkLowStock]);

  // 📦 CRUD Operations
  const addBahanBaku = async (bahanBaku: Omit<BahanBaku, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan bahan baku');
      return false;
    }

    try {
      const bahanBakuToInsert = {
        user_id: user.id,
        nama: bahanBaku.nama?.trim(),
        satuan: bahanBaku.satuan?.trim(),
        stok: bahanBaku.stok,
        minimum: bahanBaku.minimum,
        harga_per_satuan: bahanBaku.hargaPerSatuan,
        supplier: bahanBaku.supplier?.trim(),
        kategori: bahanBaku.kategori?.trim(),
        lokasi: bahanBaku.lokasi?.trim(),
        tanggal_expired: bahanBaku.tanggalExpired?.toISOString(),
        catatan: bahanBaku.catatan?.trim() || null,
      };

      console.log('[BahanBakuContext] Adding item:', bahanBakuToInsert);
      const { error } = await supabase.from('bahan_baku').insert(bahanBakuToInsert);
      
      if (error) {
        console.error('[BahanBakuContext] Insert error:', error);
        throw new Error(error.message);
      }

      // Activity log
      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahanBaku.nama} telah ditambahkan ke gudang`,
        type: 'gudang',
        value: null,
      });

      // Success toast
      toast.success(`${bahanBaku.nama} berhasil ditambahkan!`);

      // 🔔 Success notification
      await addNotification({
        title: '📦 Bahan Baku Baru!',
        message: `${bahanBaku.nama} berhasil ditambahkan dengan stok ${bahanBaku.stok} ${bahanBaku.satuan}`,
        type: 'success',
        icon: 'package',
        priority: 2,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[BahanBakuContext] Error adding:', error);
      const errorMessage = `Gagal menambahkan bahan baku: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMessage);
      
      // 🔔 Error notification
      await addNotification(createNotificationHelper.systemError(errorMessage));
      return false;
    }
  };

  const updateBahanBaku = async (id: string, bahanBaku: Partial<Omit<BahanBaku, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui bahan baku');
      return false;
    }

    try {
      const existingItem = bahanBaku.find(item => item.id === id);
      const dataToUpdate: { [key: string]: any } = {};
      
      if (bahanBaku.nama !== undefined) dataToUpdate.nama = bahanBaku.nama?.trim();
      if (bahanBaku.satuan !== undefined) dataToUpdate.satuan = bahanBaku.satuan?.trim();
      if (bahanBaku.stok !== undefined) dataToUpdate.stok = bahanBaku.stok;
      if (bahanBaku.minimum !== undefined) dataToUpdate.minimum = bahanBaku.minimum;
      if (bahanBaku.hargaPerSatuan !== undefined) dataToUpdate.harga_per_satuan = bahanBaku.hargaPerSatuan;
      if (bahanBaku.supplier !== undefined) dataToUpdate.supplier = bahanBaku.supplier?.trim();
      if (bahanBaku.kategori !== undefined) dataToUpdate.kategori = bahanBaku.kategori?.trim();
      if (bahanBaku.lokasi !== undefined) dataToUpdate.lokasi = bahanBaku.lokasi?.trim();
      if (bahanBaku.tanggalExpired !== undefined) dataToUpdate.tanggal_expired = bahanBaku.tanggalExpired?.toISOString();
      if (bahanBaku.catatan !== undefined) dataToUpdate.catatan = bahanBaku.catatan?.trim() || null;

      console.log('[BahanBakuContext] Updating item:', id, dataToUpdate);
      const { error } = await supabase.from('bahan_baku').update(dataToUpdate).eq('id', id).eq('user_id', user.id);
      
      if (error) {
        console.error('[BahanBakuContext] Update error:', error);
        throw new Error(error.message);
      }

      // Success toast
      toast.success('Bahan baku berhasil diperbarui!');

      // 🔔 Update notification (only for significant changes)
      if (bahanBaku.nama || bahanBaku.stok !== undefined) {
        await addNotification({
          title: '📝 Bahan Baku Diperbarui',
          message: `${bahanBaku.nama || existingItem?.nama || 'Item'} telah diperbarui`,
          type: 'info',
          icon: 'edit',
          priority: 1,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false
        });
      }

      return true;
    } catch (error) {
      console.error('[BahanBakuContext] Error updating:', error);
      const errorMessage = `Gagal memperbarui bahan baku: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMessage);
      
      // 🔔 Error notification
      await addNotification(createNotificationHelper.systemError(errorMessage));
      return false;
    }
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus bahan baku');
      return false;
    }

    try {
      const itemToDelete = bahanBaku.find(item => item.id === id);
      if (!itemToDelete) {
        toast.error('Item tidak ditemukan');
        return false;
      }

      console.log('[BahanBakuContext] Deleting item:', id);
      const { error } = await supabase.from('bahan_baku').delete().eq('id', id).eq('user_id', user.id);
      
      if (error) {
        console.error('[BahanBakuContext] Delete error:', error);
        throw new Error(error.message);
      }

      // Activity log
      addActivity({
        title: 'Bahan Baku Dihapus',
        description: `${itemToDelete.nama} telah dihapus dari gudang`,
        type: 'gudang',
        value: null,
      });

      // Remove from selection
      setSelectedItems(current => {
        const updated = new Set(current);
        updated.delete(id);
        return updated;
      });

      // Success toast
      toast.success('Bahan baku berhasil dihapus!');

      // 🔔 Delete notification
      await addNotification({
        title: '🗑️ Bahan Baku Dihapus',
        message: `${itemToDelete.nama} telah dihapus dari gudang`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[BahanBakuContext] Error deleting:', error);
      const errorMessage = `Gagal menghapus bahan baku: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMessage);
      
      // 🔔 Error notification
      await addNotification(createNotificationHelper.systemError(errorMessage));
      return false;
    }
  };

  // 🎯 Selection Functions
  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    if (selectMode) {
      setSelectedItems(new Set());
    }
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

  const deleteSelectedItems = async (): Promise<boolean> => {
    if (selectedItems.size === 0) {
      toast.error('Tidak ada item yang dipilih');
      return false;
    }

    try {
      const itemsToDelete = bahanBaku.filter(item => selectedItems.has(item.id));
      const itemIds = Array.from(selectedItems);

      console.log('[BahanBakuContext] Deleting selected items:', itemIds.length);
      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .in('id', itemIds)
        .eq('user_id', user?.id);

      if (error) {
        console.error('[BahanBakuContext] Bulk delete error:', error);
        throw new Error(error.message);
      }

      // Activity log
      addActivity({
        title: 'Bahan Baku Dihapus (Batch)',
        description: `${itemIds.length} item telah dihapus dari gudang`,
        type: 'gudang',
        value: null,
      });

      // Clear selection
      setSelectedItems(new Set());
      setSelectMode(false);

      // Success toast
      toast.success(`${itemIds.length} item berhasil dihapus!`);

      // 🔔 Bulk delete notification
      await addNotification({
        title: '🗑️ Batch Delete Berhasil',
        message: `${itemIds.length} bahan baku telah dihapus dari gudang`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[BahanBakuContext] Error deleting selected items:', error);
      const errorMessage = `Gagal menghapus item: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMessage);
      
      // 🔔 Error notification
      await addNotification(createNotificationHelper.systemError(errorMessage));
      return false;
    }
  };

  const value: BahanBakuContextType = {
    bahanBaku,
    isLoading,
    selectedItems,
    selectMode,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    toggleSelectMode,
    toggleSelectItem,
    selectAllItems,
    deselectAllItems,
    deleteSelectedItems,
    refreshData,
  };

  console.log('[BahanBakuContext] Providing value:', { 
    itemCount: bahanBaku.length, 
    isLoading,
    hasUser: !!user,
    selectedCount: selectedItems.size,
    selectMode
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