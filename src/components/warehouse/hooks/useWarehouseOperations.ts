// src/components/warehouse/hooks/useWarehouseOperations.ts
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { toNumber } from '../utils/typeUtils';
import type { BahanBakuFrontend } from '../types';
import { warehouseApi } from '../services/warehouseApi';

// ✅ Query keys
const warehouseQueryKeys = {
  all: ['warehouse'] as const,
  list: () => [...warehouseQueryKeys.all, 'list'] as const,
  categories: () => [...warehouseQueryKeys.all, 'categories'] as const,
  suppliers: () => [...warehouseQueryKeys.all, 'suppliers'] as const,
};

// ✅ API functions menggunakan existing service
let crudService: any = null;

const getCrudService = async (userId?: string) => {
  // If no user yet, do not create a service to avoid RLS errors
  if (!userId) {
    return null;
  }

  // Re-create service when user changes
  if (!crudService || crudService?.config?.userId !== userId) {
    crudService = await warehouseApi.createService('crud', {
      userId,
      onError: (error: string) => {
        logger.error('Warehouse API Error:', error);
      },
      enableDebugLogs: import.meta.env.DEV
    });
  }
  return crudService;
};

const fetchWarehouseItems = async (userId?: string): Promise<BahanBakuFrontend[]> => {
  // If auth not ready or no user yet, return empty data without erroring
  if (!userId) {
    logger.warn('Warehouse: No authenticated user, returning empty items');
    return [];
  }
  try {
    const service = await getCrudService(userId);
    if (!service) return [];
    const items = await service.fetchBahanBaku();
    
    // Ensure numeric fields are properly typed
    return items.map((item: BahanBakuFrontend) => ({
      ...item,
      stok: toNumber(item.stok),
      minimum: toNumber(item.minimum),
      harga: toNumber(item.harga),
    }));
  } catch (error) {
    logger.error('Failed to fetch warehouse items:', error);
    // Return empty list to avoid error boundary; UI can show toast
    toast.error('Tidak dapat memuat data gudang. Coba lagi nanti.');
    return [];
  }
};

// 🎯 NEW: Fetch warehouse items with pagination
const fetchWarehouseItemsPaginated = async (page: number = 1, limit: number = 10, userId?: string): Promise<{
  data: BahanBakuFrontend[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // If auth not ready or no user yet, return empty data without erroring
  if (!userId) {
    logger.warn('Warehouse (paginated): No authenticated user, returning empty items');
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  try {
    const service = await getCrudService(userId);
    if (!service) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
    const result = await service.fetchBahanBakuPaginated(page, limit);

    // Ensure numeric fields are properly typed
    const transformedData = result.data.map((item: BahanBakuFrontend) => ({
      ...item,
      stok: toNumber(item.stok),
      minimum: toNumber(item.minimum),
      harga: toNumber(item.harga),
    }));

    return {
      ...result,
      data: transformedData
    };
  } catch (error) {
    logger.error('Failed to fetch paginated warehouse items:', error);
    toast.error('Tidak dapat memuat data gudang. Coba lagi nanti.');
    // Return empty to keep UI functional and allow retry
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }
};

const createWarehouseItem = async (item: Partial<BahanBakuFrontend>, userId?: string): Promise<BahanBakuFrontend> => {
  try {
    const service = await getCrudService(userId);
    
    // Remove fields that shouldn't be in create
    const { id, createdAt, updatedAt, userId: itemUserId, ...createData } = item;
    
    const success = await service.addBahanBaku(createData);
    if (!success) {
      throw new Error('Failed to create item');
    }
    
    // Return the created item (you might want to fetch it back for the real data)
    return { 
      ...item,
      id: crypto.randomUUID(), // Temporary ID, real one comes from DB
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as BahanBakuFrontend;
  } catch (error) {
    logger.error('Failed to create warehouse item:', error);
    throw new Error(`Failed to create item: ${error}`);
  }
};

const updateWarehouseItem = async ({ id, item, userId }: { id: string; item: Partial<BahanBakuFrontend>; userId?: string }): Promise<BahanBakuFrontend> => {
  try {
    logger.info('updateWarehouseItem called', { id, item });
    
    const service = await getCrudService(userId);
    
    const success = await service.updateBahanBaku(id, item);
    if (!success) {
      logger.error('Update failed in service', { id, item });
      throw new Error('Failed to update item');
    }
    
    logger.info('Update successful in service', { id, item });
    
    // Return updated item (you might want to fetch it back for the real data)
    return { 
      ...item,
      id,
      updatedAt: new Date().toISOString(),
    } as BahanBakuFrontend;
  } catch (error) {
    logger.error('Failed to update warehouse item:', error);
    throw new Error(`Failed to update item: ${error}`);
  }
};

const deleteWarehouseItem = async (id: string, userId?: string): Promise<void> => {
  try {
    const service = await getCrudService(userId);

    const success = await service.deleteBahanBaku(id);
    if (!success) {
      throw new Error('Failed to delete item');
    }
  } catch (error) {
    logger.error('Failed to delete warehouse item:', error);
    throw new Error(`Failed to delete item: ${error}`);
  }
};

const bulkDeleteWarehouseItems = async (ids: string[], userId?: string): Promise<boolean> => {
  try {
    const service = await getCrudService(userId);

    const success = await service.bulkDeleteBahanBaku(ids);
    if (!success) {
      throw new Error('Failed to bulk delete items');
    }
    return true;
  } catch (error) {
    logger.error('Failed to bulk delete warehouse items:', error);
    throw new Error(`Failed to bulk delete items: ${error}`);
  }
};

// 🎯 NEW: Type for paginated response
type PaginatedWarehouseResponse = {
  data: BahanBakuFrontend[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// 🎯 NEW: Type guard for paginated response
const isPaginatedWarehouseResponse = (data: any): data is PaginatedWarehouseResponse => {
  return data && typeof data === 'object' && 'data' in data && 'total' in data;
};

export const useWarehouseOperations = (page: number = 1, limit: number = 10, usePagination: boolean = false) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // ✅ State untuk track USER ACTIONS (bukan data changes)
  const [lastUserAction, setLastUserAction] = useState<Date | undefined>(undefined);
  
  // Query untuk data warehouse
  const {
    data: queryData,
    isLoading: loading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery<BahanBakuFrontend[] | PaginatedWarehouseResponse>({
    queryKey: usePagination ? [...warehouseQueryKeys.list(), 'paginated', page, limit, user?.id] : [...warehouseQueryKeys.list(), user?.id],
    queryFn: usePagination 
      ? () => fetchWarehouseItemsPaginated(page, limit, user?.id)
      : () => fetchWarehouseItems(user?.id),
    staleTime: 2 * 60 * 1000, // 2 minutes cache for performance
    keepPreviousData: true,
    placeholderData: (prev) => prev,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Extract data based on pagination mode
  const bahanBaku = usePagination && isPaginatedWarehouseResponse(queryData) 
    ? queryData.data 
    : (queryData as BahanBakuFrontend[] || []);
    
  const paginationInfo = usePagination && isPaginatedWarehouseResponse(queryData)
    ? {
        total: queryData.total,
        page: queryData.page,
        limit: queryData.limit,
        totalPages: queryData.totalPages
      }
    : undefined;

  // ✅ Simple refetch tanpa update timestamp
  const smartRefetch = async () => {
    logger.debug('🔄 Manual refresh warehouse data...');
    // Tidak update timestamp karena ini bukan user action yang mengubah data
    return await refetch();
  };

  // Mutations dengan explicit timestamp update
  const createMutation = useMutation({
    mutationFn: (item: Partial<BahanBakuFrontend>) => createWarehouseItem(item, user?.id),
    onSuccess: (newItem) => {
      // ✅ Update timestamp saat user berhasil tambah item
      setLastUserAction(new Date());
      queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
      logger.info(`✅ Item "${newItem.nama}" berhasil ditambahkan`);
      toast.success(`Item "${newItem.nama}" berhasil ditambahkan!`);
    },
    onError: (error: Error) => {
      logger.error('❌ Gagal menambah item:', error.message);
      toast.error(`Gagal menambah item: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, item }: { id: string; item: Partial<BahanBakuFrontend> }) => updateWarehouseItem({ id, item, userId: user?.id }),
    onSuccess: (updatedItem) => {
      // ✅ Update timestamp saat user berhasil edit item
      setLastUserAction(new Date());
      queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
      logger.info(`✅ Item "${updatedItem.nama}" berhasil diperbarui`);
      toast.success(`Item "${updatedItem.nama}" berhasil diperbarui!`);
    },
    onError: (error: Error) => {
      logger.error('❌ Gagal memperbarui item:', error.message);
      toast.error(`Gagal memperbarui item: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWarehouseItem(id, user?.id),
    onSuccess: () => {
      // ✅ Update timestamp saat user berhasil hapus item
      setLastUserAction(new Date());
      queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
      logger.info('✅ Item berhasil dihapus');
      toast.success('Item berhasil dihapus!');
    },
    onError: (error: Error) => {
      logger.error('❌ Gagal menghapus item:', error.message);
      toast.error(`Gagal menghapus item: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteWarehouseItems(ids, user?.id),
    onSuccess: () => {
      // ✅ Update timestamp saat user berhasil bulk delete items
      setLastUserAction(new Date());
      queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
      logger.info('✅ Item berhasil dihapus secara massal');
      toast.success('Item berhasil dihapus secara massal!');
    },
    onError: (error: Error) => {
      logger.error('❌ Gagal menghapus item secara massal:', error.message);
      toast.error(`Gagal menghapus item: ${error.message}`);
    },
  });

  return {
    // Data
    bahanBaku,
    paginationInfo,
    loading,
    error,
    lastUserAction,
    dataUpdatedAt,
    
    // Actions
    smartRefetch,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    bulkDeleteItems: bulkDeleteMutation.mutateAsync,
    
    // Loading states
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isBulkDeleting: bulkDeleteMutation.isLoading,
  };
};