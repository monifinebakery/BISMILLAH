// src/components/warehouse/context/SimpleBahanBakuContext.tsx
// ⚡ DEBUGGING VERSION - Simplified untuk test performance

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BahanBaku } from '../types/warehouse';

interface SimpleBahanBakuContextType {
  bahanBaku: BahanBaku[];
  loading: boolean;
  addBahanBaku: (item: any) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: any) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  selectedItems: string[];
  isSelectionMode: boolean;
  isBulkDeleting: boolean;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: () => BahanBaku[];
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  checkInventoryAlerts: () => Promise<void>;
  getExpiringItems: (days?: number) => BahanBaku[];
  getLowStockItems: () => BahanBaku[];
  getOutOfStockItems: () => BahanBaku[];
  isConnected: boolean;
}

const SimpleBahanBakuContext = createContext<SimpleBahanBakuContextType | undefined>(undefined);

export const SimpleBahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  console.log('🚀 SimpleBahanBakuProvider render', { userExists: !!user, itemCount: bahanBaku.length });

  // Simple data fetch without services
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setBahanBaku([]);
        setLoading(false);
        return;
      }

      console.log('📡 Fetching data...');
      const start = performance.now();

      try {
        const { data, error } = await supabase
          .from('bahan_baku')
          .select('*')
          .eq('user_id', user.id)
          .order('nama', { ascending: true });

        if (error) throw error;

        const transformedData = (data || []).map(item => ({
          id: item.id,
          nama: item.nama || '',
          kategori: item.kategori || '',
          stok: Number(item.stok) || 0,
          satuan: item.satuan || '',
          hargaSatuan: Number(item.harga_satuan) || 0,
          minimum: Number(item.minimum) || 0,
          supplier: item.supplier || '',
          tanggalKadaluwarsa: item.tanggal_kadaluwarsa ? new Date(item.tanggal_kadaluwarsa) : null,
          userId: item.user_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          jumlahBeliKemasan: Number(item.jumlah_beli_kemasan) || 0,
          satuanKemasan: item.satuan_kemasan || '',
          hargaTotalBeliKemasan: Number(item.harga_total_beli_kemasan) || 0,
        }));

        const end = performance.now();
        console.log(`⚡ Data fetched in ${(end - start).toFixed(2)}ms`);

        setBahanBaku(transformedData);
      } catch (error) {
        console.error('❌ Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Simple implementations
  const addBahanBaku = async (item: any): Promise<boolean> => {
    console.log('➕ Adding item:', item.nama);
    return true; // Placeholder
  };

  const updateBahanBaku = async (id: string, updates: any): Promise<boolean> => {
    console.log('✏️ Updating item:', id);
    return true; // Placeholder
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    console.log('🗑️ Deleting item:', id);
    return true; // Placeholder
  };

  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
    console.log('🗑️ Bulk deleting:', ids.length, 'items');
    return true; // Placeholder
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedItems(bahanBaku.map(item => item.id));
  const clearSelection = () => setSelectedItems([]);
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) clearSelection();
  };
  const isSelected = (id: string) => selectedItems.includes(id);
  const getSelectedItems = () => bahanBaku.filter(item => selectedItems.includes(item.id));

  const getBahanBakuByName = (nama: string) => 
    bahanBaku.find(item => item.nama.toLowerCase() === nama.toLowerCase());

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => true;
  const refreshData = async () => {};
  const checkInventoryAlerts = async () => {};
  
  const getExpiringItems = (days = 7) => 
    bahanBaku.filter(item => {
      if (!item.tanggalKadaluwarsa) return false;
      const diffTime = new Date(item.tanggalKadaluwarsa).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days && diffDays > 0;
    });

  const getLowStockItems = () => bahanBaku.filter(item => item.stok > 0 && item.stok <= item.minimum);
  const getOutOfStockItems = () => bahanBaku.filter(item => item.stok === 0);

  const value: SimpleBahanBakuContextType = {
    bahanBaku,
    loading,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    bulkDeleteBahanBaku,
    selectedItems,
    isSelectionMode,
    isBulkDeleting,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    getSelectedItems,
    getBahanBakuByName,
    reduceStok,
    refreshData,
    checkInventoryAlerts,
    getExpiringItems,
    getLowStockItems,
    getOutOfStockItems,
    isConnected: true,
  };

  return (
    <SimpleBahanBakuContext.Provider value={value}>
      {children}
    </SimpleBahanBakuContext.Provider>
  );
};

export const useSimpleBahanBaku = (): SimpleBahanBakuContextType => {
  const context = useContext(SimpleBahanBakuContext);
  if (!context) {
    throw new Error('useSimpleBahanBaku must be used within SimpleBahanBakuProvider');
  }
  return context;
};