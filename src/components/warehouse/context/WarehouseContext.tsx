// ===== FIXED WarehouseContext.tsx dengan proper mutation handling =====
// src/components/warehouse/WarehouseContext.tsx
import React, { createContext, useContext, useRef, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

// Types - ✅ FIXED: Use correct BahanResep type from recipe components
import type { BahanBakuFrontend } from '../types';
import type { BahanResep } from '@/components/recipe/types';

// Query keys
const warehouseQueryKeys = {
  all: ['warehouse'] as const,
  list: () => [...warehouseQueryKeys.all, 'list'] as const,
  item: (id: string) => [...warehouseQueryKeys.all, 'item', id] as const,
  analysis: () => [...warehouseQueryKeys.all, 'analysis'] as const,
} as const;

// Enhanced context interface
interface WarehouseContextType {
  // Data
  bahanBaku: BahanBakuFrontend[];
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  isBulkDeleting: boolean;
  lastUpdated?: Date;
  
  // Actions
  addBahanBaku: (
    bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { id?: string }
  ) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: Partial<BahanBakuFrontend>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getBahanBakuByName: (nama: string) => BahanBakuFrontend | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  getIngredientPrice: (nama: string) => number;
  validateIngredientAvailability: (ingredients: BahanResep[]) => boolean;
  consumeIngredients: (ingredients: BahanResep[]) => Promise<boolean>;
  updateIngredientPrices: (ingredients: BahanResep[]) => BahanResep[];
  
  // Analysis
  getLowStockItems: () => BahanBakuFrontend[];
  getOutOfStockItems: () => BahanBakuFrontend[];
  getExpiringItems: (days?: number) => BahanBakuFrontend[];

  // ✅ FIXED: Proper refetch type from useQuery
  refetch: () => Promise<any>;
  isRefetching: boolean;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// 🔄 Cache invalidation helper for profit analysis sync
const invalidateRelatedCaches = (queryClient: any) => {
  console.log('🔄 Invalidating caches for warehouse changes...');
  // Invalidate warehouse, profit analysis, and financial caches
  queryClient.invalidateQueries({ queryKey: ['warehouse'] });
  queryClient.invalidateQueries({ queryKey: ['profit-analysis'] });
  queryClient.invalidateQueries({ queryKey: ['financial'] });
  console.log('✅ Cache invalidation completed for warehouse sync');
};

interface WarehouseProviderProps {
  children: React.ReactNode;
  enableDebugLogs?: boolean;
}

// API functions
const fetchWarehouseData = async (userId?: string): Promise<BahanBakuFrontend[]> => {
  try {
    logger.debug('🔄 fetchWarehouseData called for userId:', userId);
    
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    }) as any; // Type assertion for CrudService
    
    const items = await service.fetchBahanBaku();
    logger.debug('📊 fetchWarehouseData received items:', items.length);
    
    // Transform to frontend format and ensure proper types
    const transformedItems = items.map((item: any) => ({
      ...item,
      stok: Number(item.stok) || 0,
      minimum: Number(item.minimum) || 0,
      harga: Number(item.harga) || 0,
    }));
    
    logger.debug('✅ fetchWarehouseData transformed items:', transformedItems.length);
    return transformedItems;
  } catch (error) {
    logger.error('❌ fetchWarehouseData failed:', error);
    throw error;
  }
};

const createWarehouseItem = async (
  item: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { id?: string },
  userId?: string
): Promise<boolean> => {
  try {
    logger.debug('🔄 createWarehouseItem called:', { item, userId });
    
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    }) as any; // Type assertion for CrudService
    
    const result = await service.addBahanBaku(item);
    logger.debug('📊 createWarehouseItem result:', result);
    return result;
  } catch (error) {
    logger.error('❌ createWarehouseItem failed:', error);
    throw error;
  }
};

const updateWarehouseItem = async ({ id, updates, userId }: { id: string; updates: Partial<BahanBakuFrontend>; userId?: string }): Promise<boolean> => {
  try {
    logger.info('🔄 updateWarehouseItem called:', { id, updates, userId });
    
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    }) as any; // Type assertion for CrudService
    
    const result = await service.updateBahanBaku(id, updates);
    logger.info('📊 updateWarehouseItem result:', result);
    return result;
  } catch (error) {
    logger.error('❌ updateWarehouseItem failed:', error);
    throw error;
  }
};

const deleteWarehouseItem = async (id: string, userId?: string): Promise<boolean> => {
  try {
    logger.debug('🔄 deleteWarehouseItem called:', { id, userId });
    
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    }) as any; // Type assertion for CrudService
    
    const result = await service.deleteBahanBaku(id);
    logger.debug('📊 deleteWarehouseItem result:', result);
    return result;
  } catch (error) {
    logger.error('❌ deleteWarehouseItem failed:', error);
    throw error;
  }
};

const bulkDeleteWarehouseItems = async (ids: string[], userId?: string): Promise<boolean> => {
  try {
    logger.debug('🔄 bulkDeleteWarehouseItems called:', { ids, userId });
    
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    }) as any; // Type assertion for CrudService
    
    const result = await service.bulkDeleteBahanBaku(ids);
    logger.debug('📊 bulkDeleteWarehouseItems result:', result);
    return result;
  } catch (error) {
    logger.error('❌ bulkDeleteWarehouseItems failed:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Warehouse Context Provider with proper mutation handling
 */
export const WarehouseProvider: React.FC<WarehouseProviderProps> = ({
  children,
  enableDebugLogs = true
}) => {
  const providerId = useRef(`WarehouseProvider-${Date.now()}`);
  const queryClient = useQueryClient();

  const isDebugMode = enableDebugLogs && import.meta.env.DEV;

  // Dependencies
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // ✅ FIXED: Live connection status tracking
  const [isConnected, setIsConnected] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  React.useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isDebugMode) {
    logger.debug(`[${providerId.current}] 🏗️ Context rendering with useQuery`);
  }

  // useQuery for warehouse data
  const {
    data: bahanBaku = [],
    isLoading: loading,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: warehouseQueryKeys.list(),
    queryFn: () => {
      if (isDebugMode) logger.debug('🔄 Warehouse queryFn called');
      return fetchWarehouseData(user?.id);
    },
    enabled: !!user,
    staleTime: 0, // Always consider data stale so it refetches when invalidated
    // ✅ FIXED: Simplified retry logic for better error handling
    retry: (failureCount, err: any) => {
      const code = Number(err?.code || err?.status || 0);
      if (code >= 400 && code < 500) return false; // Don't retry client errors
      return failureCount < 1; // Only 1 retry for other errors
    },
  });

  // ✅ NEW: Real-time subscription for warehouse updates
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!user?.id) return;

    if (isDebugMode) logger.debug('🔄 Setting up real-time subscription for user:', user.id);

    const channel = supabase
      .channel('warehouse-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bahan_baku',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (isDebugMode) logger.debug('🔄 Warehouse table changed:', payload);
          // Invalidate and refetch warehouse data when changes occur
          queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        }
      )
      .on(
        'postgres_changes',
        {
          // Listen to all change events on purchases table to keep warehouse data in sync
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (isDebugMode) logger.debug('🔄 Purchase updated:', payload);
          // Invalidate warehouse data when purchases are updated (status changes)
          queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        }
      )
      .subscribe((status) => {
        if (isDebugMode) logger.debug('🔄 Real-time subscription status:', status);
      });

    return () => {
      if (isDebugMode) logger.debug('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // ✅ FIXED: Mutations with proper error handling and return values
  const createMutation = useMutation({
    mutationFn: (
      item: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { id?: string }
    ) => createWarehouseItem(item, user?.id),
    onSuccess: (success, item) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        // 🔄 Invalidate profit analysis cache for cross-component sync
        invalidateRelatedCaches(queryClient);
        addActivity({
          title: 'Bahan Baku Ditambahkan',
          description: `${item.nama} telah ditambahkan ke gudang.`,
          type: 'stok',
        });
        toast.success(`Bahan baku "${item.nama}" berhasil ditambahkan`);
      } else {
        toast.error('Gagal menambahkan bahan baku');
      }
    },
    onError: (error: Error, item) => {
      const errorMsg = `Gagal menambahkan "${item.nama}": ${error.message}`;
      addNotification(createNotificationHelper.systemError(errorMsg));
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BahanBakuFrontend> }) => 
      updateWarehouseItem({ id, updates, userId: user?.id }),
    onSuccess: (success, { updates }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        // 🔄 Invalidate profit analysis cache for cross-component sync
        invalidateRelatedCaches(queryClient);
        toast.success('Bahan baku berhasil diperbarui');
        logger.info('✅ Update mutation successful');
      } else {
        toast.error('Gagal memperbarui bahan baku');
        logger.error('❌ Update mutation returned false');
      }
    },
    onError: (error: Error, { updates }) => {
      const errorMsg = `Gagal memperbarui bahan baku: ${error.message}`;
      toast.error(errorMsg);
      logger.error('❌ Update mutation error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWarehouseItem(id, user?.id),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
        // 🔄 Invalidate profit analysis cache for cross-component sync
        invalidateRelatedCaches(queryClient);
        toast.success('Bahan baku berhasil dihapus');
      } else {
        toast.error('Gagal menghapus bahan baku');
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
        // 🔄 Invalidate profit analysis cache for cross-component sync
        invalidateRelatedCaches(queryClient);
        toast.success(`${ids.length} item berhasil dihapus`);
      } else {
        toast.error('Gagal menghapus bahan baku');
      }
    },
    onError: (error: Error) => {
      const errorMsg = `Gagal menghapus bahan baku: ${error.message}`;
      toast.error(errorMsg);
    },
  });

  // ✅ FIXED: CRUD operations with proper async handling (stabilized with useCallback)
  const addBahanBaku = React.useCallback(
    async (
      bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { id?: string }
    ): Promise<boolean> => {
    try {
      logger.debug(`[${providerId.current}] 🎯 addBahanBaku called:`, bahan);
      const result = await createMutation.mutateAsync(bahan);
      logger.debug(`[${providerId.current}] 📊 addBahanBaku result:`, result);
      return result;
    } catch (error) {
      logger.error(`[${providerId.current}] ❌ addBahanBaku failed:`, error);
      return false;
    }
  }, [createMutation]);

  const updateBahanBaku = React.useCallback(async (id: string, updates: Partial<BahanBakuFrontend>): Promise<boolean> => {
    try {
      logger.info(`[${providerId.current}] 🎯 updateBahanBaku called:`, { id, updates });
      const result = await updateMutation.mutateAsync({ id, updates });
      logger.info(`[${providerId.current}] 📊 updateBahanBaku result:`, result);
      return result;
    } catch (error) {
      logger.error(`[${providerId.current}] ❌ updateBahanBaku failed:`, error);
      return false;
    }
  }, [updateMutation]);

  const deleteBahanBaku = React.useCallback(async (id: string): Promise<boolean> => {
    try {
      logger.debug(`[${providerId.current}] 🎯 deleteBahanBaku called:`, { id });
      const result = await deleteMutation.mutateAsync(id);
      logger.debug(`[${providerId.current}] 📊 deleteBahanBaku result:`, result);
      return result;
    } catch (error) {
      logger.error(`[${providerId.current}] ❌ deleteBahanBaku failed:`, error);
      return false;
    }
  }, [deleteMutation]);

  const bulkDeleteBahanBaku = React.useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      logger.debug(`[${providerId.current}] 🎯 bulkDeleteBahanBaku called:`, { ids });
      const result = await bulkDeleteMutation.mutateAsync(ids);
      logger.debug(`[${providerId.current}] 📊 bulkDeleteBahanBaku result:`, result);
      return result;
    } catch (error) {
      logger.error(`[${providerId.current}] ❌ bulkDeleteBahanBaku failed:`, error);
      return false;
    }
  }, [bulkDeleteMutation]);

  const refreshData = React.useCallback(async (): Promise<void> => {
    logger.debug(`[${providerId.current}] 🔄 refreshData called`);
    await refetch();
  }, [refetch]);

  // Utility functions
  const getBahanBakuByName = React.useCallback((nama: string): BahanBakuFrontend | undefined => {
    if (!nama || typeof nama !== 'string') return undefined;
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  }, [bahanBaku]);

  const reduceStok = React.useCallback(async (nama: string, jumlah: number): Promise<boolean> => {
    try {
      // Find the item first
      const item = getBahanBakuByName(nama);
      if (!item) {
        logger.error(`Item ${nama} not found in warehouse`);
        return false;
      }
      
      // Check if there's enough stock
      if (item.stok < jumlah) {
        logger.error(`Insufficient stock for ${nama}. Available: ${item.stok}, Required: ${jumlah}`);
        return false;
      }
      
      // Reduce stock using the updateBahanBaku method
      const newStok = item.stok - jumlah;
      const success = await updateBahanBaku(item.id, { stok: newStok });
      
      if (success) {
        await refetch(); // Refresh using useQuery
      }
      return success;
    } catch (error) {
      logger.error(`[${providerId.current}] Reduce stock failed:`, error);
      return false;
    }
  }, [getBahanBakuByName, updateBahanBaku, refetch]);

  const getIngredientPrice = React.useCallback(
    (nama: string): number => {
      const item = getBahanBakuByName(nama);
      return item?.harga || 0;
    },
    [getBahanBakuByName]
  );

  const validateIngredientAvailability = React.useCallback(
    (ingredients: BahanResep[]): boolean => {
      for (const ingredient of ingredients) {
        const item = getBahanBakuByName(ingredient.nama);
        if (!item) {
          toast.error(`${ingredient.nama} tidak ditemukan di gudang.`);
          return false;
        }
        if (item.stok < ingredient.jumlah) {
          toast.error(
            `Stok ${ingredient.nama} hanya ${item.stok} ${item.satuan}. Dibutuhkan ${ingredient.jumlah}.`
          );
          return false;
        }
      }
      return true;
    },
    [getBahanBakuByName]
  );

  const consumeIngredients = React.useCallback(
    async (ingredients: BahanResep[]): Promise<boolean> => {
      if (!validateIngredientAvailability(ingredients)) {
        return false;
      }
      try {
        await Promise.all(
          ingredients.map(async ingredient => {
            const success = await reduceStok(ingredient.nama, ingredient.jumlah);
            if (!success) {
              throw new Error(`Gagal mengurangi stok untuk ${ingredient.nama}`);
            }
          })
        );
        return true;
      } catch (error) {
        logger.error(String(error));
        return false;
      }
    },
    [validateIngredientAvailability, reduceStok]
  );

  const updateIngredientPrices = React.useCallback(
    (ingredients: BahanResep[]): BahanResep[] => {
      return ingredients.map(ingredient => {
        const currentPrice = getIngredientPrice(ingredient.nama);
        if (currentPrice > 0 && currentPrice !== ingredient.hargaSatuan) {
          return {
            ...ingredient,
            hargaSatuan: currentPrice,
            totalHarga: ingredient.jumlah * currentPrice,
          };
        }
        return ingredient;
      });
    },
    [getIngredientPrice]
  );

  // Analysis functions
  const getLowStockItems = React.useCallback((): BahanBakuFrontend[] => {
    return bahanBaku.filter(item => Number(item.stok) <= Number(item.minimum));
  }, [bahanBaku]);

  const getOutOfStockItems = React.useCallback((): BahanBakuFrontend[] => {
    return bahanBaku.filter(item => Number(item.stok) === 0);
  }, [bahanBaku]);

  const getExpiringItems = React.useCallback((days: number = 30): BahanBakuFrontend[] => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    
    return bahanBaku.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      return expiryDate <= threshold && expiryDate > new Date();
    });
  }, [bahanBaku]);
  // ✅ ENHANCED: Context value with proper types (memoized)
  const contextValue: WarehouseContextType = React.useMemo(() => ({
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
    getIngredientPrice,
    validateIngredientAvailability,
    consumeIngredients,
    updateIngredientPrices,
    
    // Analysis
    getLowStockItems,
    getOutOfStockItems,
    getExpiringItems,

    // ✅ FIXED: Proper refetch type and value
    refetch,
    isRefetching,
  }), [
    bahanBaku,
    loading,
    error,
    isConnected,
    bulkDeleteMutation.isPending,
    dataUpdatedAt,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    bulkDeleteBahanBaku,
    refreshData,
    getBahanBakuByName,
    reduceStok,
    getIngredientPrice,
    validateIngredientAvailability,
    consumeIngredients,
    updateIngredientPrices,
    getLowStockItems,
    getOutOfStockItems,
    getExpiringItems,
    refetch,
    isRefetching,
  ]);

  // ✅ DEBUG: Log context state changes
  React.useEffect(() => {
    if (typeof navigator === 'undefined') return;
    logger.debug(`[${providerId.current}] 📊 Context state:`, {
      bahanBakuCount: bahanBaku.length,
      loading,
      hasError: !!error,
      isConnected,
      isBulkDeleting: bulkDeleteMutation.isPending,
      mutations: {
        create: createMutation.isPending,
        update: updateMutation.isPending,
        delete: deleteMutation.isPending,
        bulkDelete: bulkDeleteMutation.isPending,
      }
    });
  }, [bahanBaku.length, loading, error, isConnected, createMutation.isPending, updateMutation.isPending, deleteMutation.isPending, bulkDeleteMutation.isPending]);

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

// Backward compatibility exports
export const BahanBakuProvider = WarehouseProvider;
export const useBahanBaku = useWarehouseContext;
export type BahanBakuContextType = WarehouseContextType;

export default WarehouseProvider;