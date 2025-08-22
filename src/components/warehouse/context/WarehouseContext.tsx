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

// Types - ✅ FIXED: Remove unused BahanBaku import
import type { BahanBakuFrontend } from '../types';

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
  validateIngredientAvailability: (ingredients: any[]) => boolean;
  consumeIngredients: (ingredients: any[]) => Promise<boolean>;
  updateIngredientPrices: (ingredients: any[]) => any[];
  
  // Analysis
  getLowStockItems: () => BahanBakuFrontend[];
  getOutOfStockItems: () => BahanBakuFrontend[];
  getExpiringItems: (days?: number) => BahanBakuFrontend[];

  // ✅ FIXED: Proper refetch type from useQuery
  refetch: () => Promise<any>;
  isRefetching: boolean;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

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
    }) as any; // Type assertion to access CRUD methods
    
    const items = await service.fetchBahanBaku();
    logger.debug('📊 fetchWarehouseData received items:', items.length);
    
    // Log current price status before adjustment
    const priceAnalysis = items.map((item: any) => ({
      nama: item.nama,
      harga: item.harga || 0,
      hargaRataRata: item.hargaRataRata || 0,
      hasZeroPrice: (item.harga || 0) === 0 || (item.hargaRataRata || 0) === 0
    }));
    
    const zeroPriceCount = priceAnalysis.filter((p: any) => p.hasZeroPrice).length;
    logger.info(`📈 Price analysis before adjustment: ${zeroPriceCount}/${items.length} items have zero prices`);
    
    if (zeroPriceCount > 0) {
      logger.debug('📊 Items with zero prices:', 
        priceAnalysis.filter((p: any) => p.hasZeroPrice).map((p: any) => p.nama)
      );
    }
    
    // ✅ AUTO PRICE ADJUSTMENT: Fix zero prices automatically
    await autoAdjustPrices(items, userId);
    
    // Log price status after adjustment
    const postAdjustmentAnalysis = items.map((item: any) => ({
      nama: item.nama,
      harga: item.harga || 0,
      hargaRataRata: item.hargaRataRata || 0,
      hasZeroPrice: (item.harga || 0) === 0 || (item.hargaRataRata || 0) === 0
    }));
    
    const remainingZeroCount = postAdjustmentAnalysis.filter((p: any) => p.hasZeroPrice).length;
    logger.info(`📈 Price analysis after adjustment: ${remainingZeroCount}/${items.length} items still have zero prices`);
    
    // Transform to frontend format and ensure proper types
    const transformedItems = items.map((item: any) => ({
      ...item,
      stok: Number(item.stok) || 0,
      minimum: Number(item.minimum) || 0,
      harga: Number(item.harga) || 0,
      hargaRataRata: item.hargaRataRata ? Number(item.hargaRataRata) : undefined,
      jumlahBeliKemasan: item.jumlahBeliKemasan ? Number(item.jumlahBeliKemasan) : undefined,
      hargaTotalBeliKemasan: item.hargaTotalBeliKemasan ? Number(item.hargaTotalBeliKemasan) : undefined,
    }));
    
    logger.debug('✅ fetchWarehouseData transformed items:', transformedItems.length);
    return transformedItems;
  } catch (error) {
    logger.error('❌ fetchWarehouseData failed:', error);
    throw error;
  }
};

/**
 * Auto-adjust prices for items with zero prices
 * This replaces the manual fix button with automatic adjustment
 */
const autoAdjustPrices = async (items: any[], userId?: string) => {
  if (!userId || !items) return;
  
  try {
    // Find items with zero prices (check both harga and hargaRataRata)
    const zeroPriceItems = items.filter(item => 
      (item.harga || 0) === 0 || (item.hargaRataRata || 0) === 0
    );
    
    if (zeroPriceItems.length === 0) {
      logger.debug('✅ No items with zero prices found');
      return;
    }
    
    logger.info(`🔄 Auto-adjusting prices for ${zeroPriceItems.length} items:`, 
      zeroPriceItems.map(item => item.nama)
    );
    
    // Get purchase history for price calculation with more comprehensive query
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, items, created_at, supplier')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }); // Most recent first
    
    if (purchasesError) {
      logger.error('Failed to fetch purchase history for price adjustment:', purchasesError);
      return;
    }
    
    logger.info(`📊 Found ${purchases?.length || 0} completed purchases for WAC calculation`);
    
    // Process each item with zero price
    for (const item of zeroPriceItems) {
      try {
        let newPrice = 0;
        let totalQuantity = 0;
        let totalValue = 0;
        const purchaseHistory: any[] = [];
        
        // Calculate average price from purchase history with detailed logging
        if (purchases && purchases.length > 0) {
          purchases.forEach(purchase => {
            if (purchase.items && Array.isArray(purchase.items)) {
              purchase.items.forEach((purchaseItem: any) => {
                // Check multiple possible field names for item ID
                const itemMatches = purchaseItem.bahan_baku_id === item.id || 
                                   purchaseItem.bahanBakuId === item.id ||
                                   purchaseItem.id === item.id;
                
                if (itemMatches) {
                  // Check multiple possible field names for quantity and price
                  const qty = Number(purchaseItem.jumlah || purchaseItem.kuantitas || purchaseItem.quantity || 0);
                  const price = Number(
                    purchaseItem.harga_per_satuan || 
                    purchaseItem.harga_satuan || 
                    purchaseItem.hargaSatuan ||
                    purchaseItem.unit_price ||
                    purchaseItem.price || 0
                  );
                  
                  if (qty > 0 && price > 0) {
                    totalQuantity += qty;
                    totalValue += qty * price;
                    purchaseHistory.push({
                      purchaseId: purchase.id,
                      qty,
                      price,
                      date: purchase.created_at,
                      supplier: purchase.supplier
                    });
                  }
                }
              });
            }
          });
        }
        
        logger.debug(`📈 Item "${item.nama}" purchase analysis:`, {
          totalPurchases: purchaseHistory.length,
          totalQuantity,
          totalValue,
          calculatedWAC: totalQuantity > 0 ? totalValue / totalQuantity : 0,
          purchaseHistory: purchaseHistory.slice(0, 3) // Show first 3 for debugging
        });
        
        if (totalQuantity > 0 && totalValue > 0) {
          newPrice = totalValue / totalQuantity;
          logger.info(`✅ Calculated WAC for "${item.nama}": Rp ${newPrice.toLocaleString()} from ${purchaseHistory.length} purchase records`);
        } else {
          // Set a more reasonable default price based on category or supplier
          newPrice = 2500; // Increased default from 1000 to 2500
          logger.info(`⚠️ No purchase history found for "${item.nama}", using default price: Rp ${newPrice.toLocaleString()}`);
        }
        
        // Update the item price in database
        const { error: updateError } = await supabase
          .from('bahan_baku')
          .update({
            harga_satuan: item.harga === 0 ? newPrice : item.harga,
            harga_rata_rata: totalQuantity > 0 ? newPrice : null, // Only set WAC if we have purchase data
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
          .eq('user_id', userId);
        
        if (updateError) {
          logger.error(`Failed to update price for ${item.nama}:`, updateError);
        } else {
          const priceType = totalQuantity > 0 ? 'WAC' : 'default';
          logger.info(`✅ Auto-adjusted price for "${item.nama}": Rp ${newPrice.toLocaleString()} (${priceType})`);
          
          // Update the item in memory so the change is visible immediately
          if (item.harga === 0) {
            item.harga = newPrice;
          }
          if (totalQuantity > 0) {
            item.hargaRataRata = newPrice;
          }
        }
        
      } catch (error) {
        logger.error(`Error processing item ${item.nama}:`, error);
      }
    }
    
  } catch (error) {
    logger.error('Error in auto price adjustment:', error);
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
    });
    
    const result = await (service as any).addBahanBaku(item);
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
    logger.debug('📦 Package updates:', {
      jumlahBeliKemasan: updates.jumlahBeliKemasan,
      isiPerKemasan: updates.isiPerKemasan,
      satuanKemasan: updates.satuanKemasan,
      hargaTotalBeliKemasan: updates.hargaTotalBeliKemasan
    });
    
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    const result = await (service as any).updateBahanBaku(id, updates);
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
    });
    
    const result = await (service as any).deleteBahanBaku(id);
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
    });
    
    const result = await (service as any).bulkDeleteBahanBaku(ids);
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
      const service = await warehouseApi.createService('crud', {
        userId: user?.id,
        enableDebugLogs
      });
      
      const success = await (service as any).reduceStok(nama, jumlah, bahanBaku);
      if (success) {
        await refetch(); // Refresh using useQuery
      }
      return success;
    } catch (error) {
      logger.error(`[${providerId.current}] Reduce stock failed:`, error);
      return false;
    }
  }, [user?.id, enableDebugLogs, bahanBaku, refetch]);

  const getIngredientPrice = React.useCallback(
    (nama: string): number => {
      const item = getBahanBakuByName(nama);
      return item?.harga || 0;
    },
    [getBahanBakuByName]
  );

  const validateIngredientAvailability = React.useCallback(
    (ingredients: any[]): boolean => {
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
    async (ingredients: any[]): Promise<boolean> => {
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
        logger.error('Error in consumeIngredients:', error);
        return false;
      }
    },
    [validateIngredientAvailability, reduceStok]
  );

  const updateIngredientPrices = React.useCallback(
    (ingredients: any[]): any[] => {
      return ingredients.map(ingredient => {
        const currentPrice = getIngredientPrice(ingredient.nama);
        if (currentPrice > 0 && currentPrice !== ingredient.hargaPerSatuan) {
          return {
            ...ingredient,
            hargaPerSatuan: currentPrice,
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