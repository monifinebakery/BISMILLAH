// src/components/warehouse/context/SimpleBahanBakuContext.tsx
// ⚡ DEBUGGING VERSION - Ultra simple untuk isolasi masalah

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Minimal types untuk debugging
interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  hargaSatuan: number;
  supplier: string;
  tanggalKadaluwarsa: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  jumlahBeliKemasan: number;
  satuanKemasan: string;
  hargaTotalBeliKemasan: number;
}

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

// Create context dengan default value
const SimpleBahanBakuContext = createContext<SimpleBahanBakuContextType | undefined>(undefined);

export const SimpleBahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  console.log('🔧 SimpleBahanBakuProvider mounted', { 
    userExists: !!user, 
    itemCount: bahanBaku.length,
    loading 
  });

  // Ultra simple data fetch
  useEffect(() => {
    const fetchData = async () => {
      console.log('📡 Starting simple fetch...');
      setLoading(true);

      if (!user) {
        console.log('👤 No user, setting empty data');
        setBahanBaku([]);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching from Supabase...');
        const { data, error } = await supabase
          .from('bahan_baku')
          .select('*')
          .eq('user_id', user.id)
          .limit(10); // Limit untuk testing

        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }

        console.log('✅ Raw data from Supabase:', data);

        // Ultra simple transformation
        const transformedData = (data || []).map(item => ({
          id: item.id || 'unknown',
          nama: item.nama || 'Unknown Item',
          kategori: item.kategori || 'Unknown',
          stok: Number(item.stok) || 0,
          satuan: item.satuan || 'pcs',
          hargaSatuan: Number(item.harga_satuan) || 0,
          minimum: Number(item.minimum) || 0,
          supplier: item.supplier || 'Unknown',
          tanggalKadaluwarsa: item.tanggal_kadaluwarsa ? new Date(item.tanggal_kadaluwarsa) : null,
          userId: item.user_id || '',
          createdAt: new Date(item.created_at || Date.now()),
          updatedAt: new Date(item.updated_at || Date.now()),
          jumlahBeliKemasan: Number(item.jumlah_beli_kemasan) || 0,
          satuanKemasan: item.satuan_kemasan || '',
          hargaTotalBeliKemasan: Number(item.harga_total_beli_kemasan) || 0,
        }));

        console.log('🔄 Transformed data:', transformedData);
        setBahanBaku(transformedData);

      } catch (error) {
        console.error('❌ Fetch error:', error);
        setBahanBaku([]); // Fallback to empty array
      } finally {
        setLoading(false);
        console.log('✅ Simple fetch completed');
      }
    };

    fetchData();
  }, [user?.id]);

  // Minimal implementations - semua return placeholder values
  const addBahanBaku = async (item: any): Promise<boolean> => {
    console.log('➕ Add placeholder:', item?.nama);
    return true;
  };

  const updateBahanBaku = async (id: string, updates: any): Promise<boolean> => {
    console.log('✏️ Update placeholder:', id);
    return true;
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    console.log('🗑️ Delete placeholder:', id);
    return true;
  };

  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
    console.log('🗑️ Bulk delete placeholder:', ids.length);
    return true;
  };

  // Selection functions
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

  // Utility functions
  const getBahanBakuByName = (nama: string) => 
    bahanBaku.find(item => item.nama.toLowerCase() === nama.toLowerCase());

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    console.log('📉 Reduce stock placeholder:', nama, jumlah);
    return true;
  };

  const refreshData = async () => {
    console.log('🔄 Refresh placeholder');
  };

  const checkInventoryAlerts = async () => {
    console.log('🔔 Check alerts placeholder');
  };
  
  const getExpiringItems = (days = 7) => {
    return bahanBaku.filter(item => {
      if (!item.tanggalKadaluwarsa) return false;
      const diffTime = new Date(item.tanggalKadaluwarsa).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days && diffDays > 0;
    });
  };

  const getLowStockItems = () => bahanBaku.filter(item => item.stok > 0 && item.stok <= item.minimum);
  const getOutOfStockItems = () => bahanBaku.filter(item => item.stok === 0);

  // Context value
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

  console.log('🎯 SimpleBahanBakuProvider value ready:', {
    itemCount: bahanBaku.length,
    loading,
    selectedCount: selectedItems.length
  });

  return (
    <SimpleBahanBakuContext.Provider value={value}>
      {children}
    </SimpleBahanBakuContext.Provider>
  );
};

export const useSimpleBahanBaku = (): SimpleBahanBakuContextType => {
  console.log('🎣 useSimpleBahanBaku called');
  const context = useContext(SimpleBahanBakuContext);
  
  if (!context) {
    console.error('❌ useSimpleBahanBaku: Context is undefined!');
    console.error('❌ Make sure component is wrapped with SimpleBahanBakuProvider');
    throw new Error('useSimpleBahanBaku must be used within SimpleBahanBakuProvider');
  }
  
  console.log('✅ useSimpleBahanBaku: Context found', { itemCount: context.bahanBaku.length });
  return context;
};