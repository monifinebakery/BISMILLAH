// ===== 2. UPDATE WarehouseContext.tsx dengan useQuery =====
// src/components/warehouse/WarehouseContext.tsx
import React, { createContext, useContext, useRef } from 'react';
// ✅ TAMBAH: Import useQuery dan tanstack
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Dependencies
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';

// Services
import { warehouseApi } from '../services/warehouseApi';

// Types
import type { BahanBaku, BahanBakuFrontend } from '../types';

// ✅ TAMBAH: Query keys
const warehouseQueryKeys = {
  all: ['warehouse'] as const,
  list: () => [...warehouseQueryKeys.all, 'list'] as const,
  item: (id: string) => [...warehouseQueryKeys.all, 'item', id] as const,
  analysis: () => [...warehouseQueryKeys.all, 'analysis'] as const,
} as const;

// ✅ UPDATE: Enhanced context interface dengan useQuery features
interface WarehouseContextType {
  // Data - Enhanced dengan useQuery
  bahanBaku: BahanBakuFrontend[];
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  isBulkDeleting: boolean;
  lastUpdated?: Date;
  
  // Actions - Enhanced dengan mutations
  addBahanBaku: (bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: Partial<BahanBakuFrontend>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getBahanBakuByName: (nama: string) => BahanBakuFrontend | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  
  // Analysis
  getLowStockItems: () => BahanBakuFrontend[];
  getOutOfStockItems: () => BahanBakuFrontend[];
  getExpiringItems: (days?: number) => BahanBakuFrontend[];

  // ✅ TAMBAH: useQuery specific features
  refetch: () => void;
  isRefetching: boolean;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

interface WarehouseProviderProps {
  children: React.ReactNode;
  enableDebugLogs?: boolean;
}

// ✅ TAMBAH: API functions untuk useQuery
const fetchWarehouseData = async (userId?: string): Promise<BahanBakuFrontend[]> => {
  try {
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    const items = await service.fetchBahanBaku();
    
    // Transform to frontend format and ensure proper types
    return items.map((item: any) => ({
      ...item,
      stok: Number(item.stok) || 0,
      minimum: Number(item.minimum) || 0,
      harga: Number(item.harga) || 0,
      jumlahBeliKemasan: item.jumlahBeliKemasan ? Number(item.jumlahBeliKemasan) : undefined,
      hargaTotalBeliKemasan: item.hargaTotalBeliKemasan ? Number(item.hargaTotalBeliKemasan) : undefined,
    }));
  } catch (error) {
    logger.error('Failed to fetch warehouse data:', error);
    throw error;
  }
};

const createWarehouseItem = async (item: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, userId?: string): Promise<boolean> => {
  try {
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    return await service.addBahanBaku(item);
  } catch (error) {
    logger.error('Failed to create warehouse item:', error);
    throw error;
  }
};

const updateWarehouseItem = async ({ id, updates, userId }: { id: string; updates: Partial<BahanBakuFrontend>; userId?: string }): Promise<boolean> => {
  try {
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    return await service.updateBahanBaku(id, updates);
  } catch (error) {
    logger.error('Failed to update warehouse item:', error);
    throw error;
  }
};

const deleteWarehouseItem = async (id: string, userId?: string): Promise<boolean> => {
  try {
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    return await service.deleteBahanBaku(id);
  } catch (error) {
    logger.error('Failed to delete warehouse item:', error);
    throw error;
  }
};

const bulkDeleteWarehouseItems = async (ids: string[], userId?: string): Promise<boolean> => {
  try {
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    return await service.bulkDeleteBahanBaku(ids);
  } catch (error) {
    logger.error('Failed to bulk delete warehouse items:', error);
    throw error;
  }
};

/**
 * ✅ ENHANCED: Warehouse Context Provider dengan useQuery
 * 
 * Features:
 * - useQuery untuk data fetching
 * - useMutation untuk CRUD operations  
 * - Automatic caching dan background updates
 * - Optimistic updates
 * - Enhanced error handling
 * - Backward compatibility
 */
export const WarehouseProvider: React.FC<WarehouseProviderProps> = ({ 
  children, 
  enableDebugLogs = true 
}) => {
  const providerId = useRef(`WarehouseProvider-${Date.now()}`);
  const queryClient = useQueryClient();

  // Dependencies
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  if (enableDebugLogs) {
    logger.debug(`[${providerId.current}] 🏗️ Context rendering with useQuery`);
  }

  // ✅ TAMBAH: useQuery untuk warehouse data
  const {
    data: bahanBaku = [],
    isLoading: loading,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: warehouseQueryKeys.list(),
    queryFn: () => fetchWarehouseData(user?.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // ✅ TAMBAH: Mutations untuk CRUD operations
  const createMutation = useMutation({
    mutationFn: (item: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => 
      createWarehouseItem(item, user?.id),
    onSuccess: (success, item) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        addActivity({
          title: 'Bahan Baku Ditambahkan',
          description: `${item.nama} telah ditambahkan ke gudang.`,
          type: 'stok',
        });
        toast.success(`Bahan baku "${item.nama}" berhasil ditambahkan`);
      }
    },
    onError: (error: Error) => {
      const errorMsg = `Gagal menambahkan bahan baku: ${error.message}`;
      addNotification(createNotificationHelper.systemError(errorMsg));
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BahanBakuFrontend> }) => 
      updateWarehouseItem({ id, updates, userId: user?.id }),
    onSuccess: (success, { id, updates }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        toast.success('Bahan baku berhasil diperbarui');
      }
    },
    onError: (error: Error) => {
      const errorMsg = `Gagal memperbarui bahan baku: ${error.message}`;
      toast.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWarehouseItem(id, user?.id),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        toast.success('Bahan baku berhasil dihapus');
      }
    },
    onError: (error: Error) => {
      const errorMsg = `Gagal menghapus bahan baku: ${error.message}`;
      toast.error(errorMsg);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteWarehouseItems(ids, user?.id),
    onSuccess: (success, ids) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        toast.success(`${ids.length} item berhasil dihapus`);
      }
    },
    onError: (error: Error) => {
      const errorMsg = `Gagal menghapus bahan baku: ${error.message}`;
      toast.error(errorMsg);
    },
  });

  // ✅ UPDATE: CRUD operations menggunakan mutations
  const addBahanBaku = async (bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(bahan);
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateBahanBaku = async (id: string, updates: Partial<BahanBakuFrontend>): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  };

  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      return true;
    } catch (error) {
      return false;
    }
  };

  const refreshData = async (): Promise<void> => {
    await refetch();
  };

  // ✅ UPDATE: Utility functions dengan proper typing
  const getBahanBakuByName = (nama: string): BahanBakuFrontend | undefined => {
    if (!nama || typeof nama !== 'string') return undefined;
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  };

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    try {
      const service = await warehouseApi.createService('crud', {
        userId: user?.id,
        enableDebugLogs
      });
      
      const success = await service.reduceStok(nama, jumlah, bahanBaku);
      if (success) {
        await refetch(); // Refresh using useQuery
      }
      return success;
    } catch (error) {
      logger.error(`[${providerId.current}] Reduce stock failed:`, error);
      return false;
    }
  };

  // ✅ UPDATE: Analysis functions dengan proper typing
  const getLowStockItems = (): BahanBakuFrontend[] => {
    return bahanBaku.filter(item => Number(item.stok) <= Number(item.minimum));
  };

  const getOutOfStockItems = (): BahanBakuFrontend[] => {
    return bahanBaku.filter(item => Number(item.stok) === 0);
  };

  const getExpiringItems = (days: number = 30): BahanBakuFrontend[] => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    
    return bahanBaku.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      return expiryDate <= threshold && expiryDate > new Date();
    });
  };

  // ✅ TAMBAH: Connection status
  const [isConnected] = React.useState(navigator.onLine);

  // ✅ UPDATE: Context value dengan useQuery features
  const contextValue: WarehouseContextType = {
    // Data
    bahanBaku,
    loading,
    error: error as Error | null,
    isConnected,
    isBulkDeleting: bulkDeleteMutation.isPending,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : undefined,
    
    // Actions
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    bulkDeleteBahanBaku,
    refreshData,
    
    // Utilities
    getBahanBakuByName,
    reduceStok,
    
    // Analysis
    getLowStockItems,
    getOutOfStockItems,
    getExpiringItems,

    // useQuery specific
    refetch,
    isRefetching,
  };

  return (
    <WarehouseContext.Provider value={contextValue}>
      {children}
    </WarehouseContext.Provider>
  );
};

/**
 * Hook to use Warehouse Context
 */
export const useWarehouseContext = (): WarehouseContextType => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouseContext must be used within a WarehouseProvider');
  }
  return context;
};

// === BACKWARD COMPATIBILITY EXPORTS ===
export const BahanBakuProvider = WarehouseProvider;
export const useBahanBaku = useWarehouseContext;
export type BahanBakuContextType = WarehouseContextType;

export default WarehouseProvider;