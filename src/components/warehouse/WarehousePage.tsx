// src/components/warehouse/WarehousePage.tsx
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// SINGLE IMPORT - Reduced from multiple imports
import { 
  WarehouseHeader, 
  WarehouseTable, 
  WarehouseFilters, 
  BulkActions 
} from './components';

// CONSOLIDATED HOOK IMPORTS
import { useWarehouseCore } from './hooks/useWarehouseCore';
import { useWarehouseContext } from './context/WarehouseContext';

// ✅ TAMBAH: Import types
import type { BahanBakuFrontend } from './types';

// ✅ TAMBAH: Query keys
const warehouseQueryKeys = {
  all: ['warehouse'] as const,
  list: () => [...warehouseQueryKeys.all, 'list'] as const,
  categories: () => [...warehouseQueryKeys.all, 'categories'] as const,
  suppliers: () => [...warehouseQueryKeys.all, 'suppliers'] as const,
};

// ✅ TAMBAH: Import existing warehouse service
import { warehouseApi } from './services/warehouseApi';
import { supabase } from '@/integrations/supabase/client';
import { warehouseUtils } from './services/warehouseUtils';

// ✅ TAMBAH: API functions menggunakan existing service
let crudService: any = null;

const getCrudService = async () => {
  if (!crudService) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    crudService = await warehouseApi.createService('crud', {
      userId: user?.id,
      onError: (error: string) => {
        logger.error('Warehouse API Error:', error);
      },
      enableDebugLogs: import.meta.env.DEV
    });
  }
  return crudService;
};

const fetchWarehouseItems = async (): Promise<BahanBakuFrontend[]> => {
  try {
    const service = await getCrudService();
    const items = await service.fetchBahanBaku();
    
    // Ensure numeric fields are properly typed
    return items.map((item: BahanBakuFrontend) => ({
      ...item,
      stok: Number(item.stok) || 0,
      minimum: Number(item.minimum) || 0,
      harga: Number(item.harga) || 0,
    }));
  } catch (error) {
    logger.error('Failed to fetch warehouse items:', error);
    throw new Error(`Failed to fetch warehouse items: ${error}`);
  }
};

// 🎯 NEW: Fetch warehouse items with pagination
const fetchWarehouseItemsPaginated = async (page: number = 1, limit: number = 10): Promise<{
  data: BahanBakuFrontend[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const service = await getCrudService();
    const result = await service.fetchBahanBakuPaginated(page, limit);
    
    // Ensure numeric fields are properly typed
    const transformedData = result.data.map((item: BahanBakuFrontend) => ({
      ...item,
      stok: Number(item.stok) || 0,
      minimum: Number(item.minimum) || 0,
      harga: Number(item.harga) || 0,
    }));
    
    return {
      ...result,
      data: transformedData
    };
  } catch (error) {
    logger.error('Failed to fetch paginated warehouse items:', error);
    throw new Error(`Failed to fetch paginated warehouse items: ${error}`);
  }
};

const createWarehouseItem = async (item: Partial<BahanBakuFrontend>): Promise<BahanBakuFrontend> => {
  try {
    const service = await getCrudService();
    
    // Remove fields that shouldn't be in create
    const { id, createdAt, updatedAt, userId, ...createData } = item;
    
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

const updateWarehouseItem = async ({ id, item }: { id: string; item: Partial<BahanBakuFrontend> }): Promise<BahanBakuFrontend> => {
  try {
    logger.info('updateWarehouseItem called', { id, item });
    
    const service = await getCrudService();
    
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

const deleteWarehouseItem = async (id: string): Promise<void> => {
  try {
    const service = await getCrudService();

    const success = await service.deleteBahanBaku(id);
    if (!success) {
      throw new Error('Failed to delete item');
    }
  } catch (error) {
    logger.error('Failed to delete warehouse item:', error);
    throw new Error(`Failed to delete item: ${error}`);
  }
};

const bulkDeleteWarehouseItems = async (ids: string[]): Promise<boolean> => {
  try {
    const service = await getCrudService();

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

// OPTIMIZED: Single lazy import with better error handling
const DialogManager = lazy(() => 
  import('./components/DialogManager').then(module => ({
    default: module.default
  })).catch(error => {
    logger.error('❌ DialogManager lazy load failed:', error);
    
    // Fallback component
    return {
      default: ({ dialogs }: any) => (
        <div className="dialog-overlay-center">
          <div className="dialog-panel max-w-md">
            <div className="dialog-body">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              ⚠️ Dialog System Unavailable
            </h3>
            <p className="text-gray-600 mb-4">
              Dialog tidak bisa dimuat. Refresh halaman atau tutup dialog.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  if (dialogs?.close && dialogs.states) {
                    Object.keys(dialogs.states).forEach(key => dialogs.close(key));
                  }
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )
    };
  })
);

// OPTIMIZED: Lightweight loading components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="h-10 bg-gray-200 rounded-md w-1/3 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-md w-24 animate-pulse" />
      </div>
    </div>
    <div className="p-6 space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/8 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

const DialogSkeleton = () => (
  <div className="dialog-overlay-center">
    <div className="dialog-panel flex flex-col items-center min-w-[200px]">
      <div className="dialog-body">
      <LoadingSpinner />
      <p className="text-gray-600 text-sm mt-3">Memuat dialog...</p>
    </div>
  </div>
);

// ✅ TAMBAH: Custom hook untuk warehouse dengan useQuery (FIXED VERSION)
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

const useWarehouseData = (page: number = 1, limit: number = 10, usePagination: boolean = false) => {
  const queryClient = useQueryClient();
  
  // ✅ FIXED: State untuk track USER ACTIONS (bukan data changes)
  const [lastUserAction, setLastUserAction] = useState<Date | undefined>(undefined);
  
  // Query untuk data warehouse
  const {
    data: queryData,
    isLoading: loading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: usePagination ? [...warehouseQueryKeys.list(), 'paginated', page, limit] : warehouseQueryKeys.list(),
    queryFn: usePagination 
      ? () => fetchWarehouseItemsPaginated(page, limit)
      : fetchWarehouseItems,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

  // ✅ TAMBAH: Simple refetch tanpa update timestamp
  const smartRefetch = async () => {
    logger.debug('🔄 Manual refresh warehouse data...');
    // Tidak update timestamp karena ini bukan user action yang mengubah data
    return await refetch();
  };

  // Mutations dengan explicit timestamp update
  const createMutation = useMutation({
    mutationFn: createWarehouseItem,
    onSuccess: (newItem) => {
      // ✅ FIXED: Update timestamp saat user berhasil tambah item
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
    mutationFn: updateWarehouseItem,
    onSuccess: (updatedItem) => {
      // ✅ FIXED: Update timestamp saat user berhasil edit item
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
    mutationFn: deleteWarehouseItem,
    onSuccess: () => {
      // ✅ FIXED: Update timestamp saat user berhasil hapus item
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

  return {
    // Data
    bahanBaku,
    loading,
    error: error as Error | null,
    lastUpdated: lastUserAction, // ✅ FIXED: Hanya update saat user action (tambah/edit/hapus)
    paginationInfo, // 🎯 NEW: Pagination info for lazy loading
    
    // Actions
    refetch: smartRefetch, // ✅ FIXED: Refetch tanpa update timestamp
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isProcessing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};

/**
 * OPTIMIZED: Warehouse Page Component
 * ✅ ENHANCED: Added useQuery integration
 */
const WarehousePageContent: React.FC = () => {
  const pageId = useRef(`warehouse-${Date.now()}`);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();
  
  // 🎯 NEW: Lazy loading state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [useLazyLoading] = useState(true);

  // ✅ TAMBAH: Use warehouse data hook with pagination support
  const warehouseData = useWarehouseData(currentPage, itemsPerPage, useLazyLoading);
  const lowStockCountRef = useRef(0);

  // ✅ FIXED: Create context-like object with all required CRUD functions
  const context = {
    bahanBaku: warehouseData.bahanBaku,
    loading: warehouseData.loading,
    error: warehouseData.error,
    isConnected: navigator.onLine, // Simplified
    refetch: async (): Promise<void> => {
      await warehouseData.refetch();
    },
    // ✅ FIXED: Add missing CRUD functions for bulk operations
    updateBahanBaku: async (id: string, updates: Partial<BahanBakuFrontend>) => {
      try {
        await warehouseData.updateItem({ id, item: updates });
        return true;
      } catch (error) {
        logger.error('Context updateBahanBaku error:', error);
        return false;
      }
    },
    deleteBahanBaku: async (id: string) => {
      try {
        await warehouseData.deleteItem(id);
        return true;
      } catch (error) {
        logger.error('Context deleteBahanBaku error:', error);
        return false;
      }
    },
    bulkDeleteBahanBaku: async (ids: string[]) => {
      try {
        await bulkDeleteWarehouseItems(ids);
        return true;
      } catch (error) {
        logger.error('Context bulkDeleteBahanBaku error:', error);
        return false;
      }
    }
  };
  
  const core = useWarehouseCore(context);

  useEffect(() => {
    if (warehouseData.bahanBaku) {
      const lowStockCount = warehouseUtils.getLowStockItems(warehouseData.bahanBaku).length;
      if (lowStockCount > 0 && lowStockCount !== lowStockCountRef.current) {
        toast.warning(`${lowStockCount} item stok hampir habis`);
      }
      lowStockCountRef.current = lowStockCount;
    }
  }, [warehouseData.bahanBaku]);

  // OPTIMIZED: Simplified effect
  useEffect(() => {
    logger.debug(`[${pageId.current}] 🏠 WarehousePage mounted`);
    return () => {
      isMountedRef.current = false;
      logger.debug(`[${pageId.current}] 🧹 WarehousePage unmounted`);
    };
  }, []);

  // ✅ UPDATE: Enhanced handlers dengan mutations
  const enhancedHandlers = {
    ...core.handlers,
    
    create: async (item: Partial<BahanBakuFrontend>) => {
      try {
        await warehouseData.createItem(item);
        core.dialogs?.close?.('addItem');
      } catch (error) {
        logger.error('Create handler error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Gagal menambah item: ${errorMessage}`);
      }
    },
    
    update: async (id: string, item: Partial<BahanBakuFrontend>) => {
      try {
        logger.info('Enhanced update handler called', { id, item });
        await warehouseData.updateItem({ id, item });
        core.dialogs?.close?.('editItem'); // ✅ Perbaiki closing dialog
      } catch (error) {
        logger.error('Update handler error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Gagal memperbarui item: ${errorMessage}`);
      }
    },
    
    delete: async (id: string, nama: string) => {
      try {
        if (confirm(`Hapus "${nama}"?`)) {
          await warehouseData.deleteItem(id);
        }
      } catch (error) {
        logger.error('Delete handler error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Gagal menghapus item: ${errorMessage}`);
      }
    },
    
    // ✅ FIXED: Wrap editSave to match interface (Promise<void>)
    editSave: async (updates: Partial<BahanBakuFrontend>): Promise<void> => {
      const result = await core.handlers?.editSave(updates);
      logger.debug('editSave completed with result:', result);
      // Don't return the boolean result to match interface
    },
    
    // ✅ FIXED: Wrap sort to match interface (string instead of keyof)
    sort: (key: string) => {
      core.handlers?.sort(key as keyof BahanBakuFrontend);
    },
  };

  // Early return for missing context
  if (!context) {
    return (
      <div className="w-full p-4 sm:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
            <p className="text-gray-600 mb-4">Warehouse context tidak tersedia</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      </div>
    );
  }

  // OPTIMIZED: Simplified dialog detection
  const hasDialogsOpen = Object.values(core.dialogs?.states || {}).some(Boolean) || !!core.dialogs?.editingItem;

  return (
    <div className="w-full p-4 sm:p-8" aria-live="polite">
      
      {/* Header Section */}
      <WarehouseHeader
        itemCount={context.bahanBaku?.length || 0}
        selectedCount={core.selection?.selectedCount || 0}
        isConnected={context.isConnected}
      />

      {/* Bulk Actions */}
      {(() => {
        const shouldShowBulkActions = core.selection?.isSelectionMode || (core.selection?.selectedCount || 0) > 0;
        logger.debug('BulkActions visibility check:', {
          isSelectionMode: core.selection?.isSelectionMode,
          selectedCount: core.selection?.selectedCount,
          shouldShow: shouldShowBulkActions
        });
        
        return shouldShowBulkActions ? (
          <BulkActions
            selectedCount={core.selection.selectedCount || 0}
            onBulkEdit={() => core.dialogs?.open?.('bulkEdit')}
            onBulkDelete={() => core.dialogs?.open?.('bulkDelete')}
            onClearSelection={core.selection?.clear}
            isProcessing={warehouseData.isProcessing || false}
          />
        ) : null;
      })()}

      {/* Main Content */}
      {context.loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          
          <WarehouseFilters
            searchTerm={core.filters?.searchTerm || ''}
            onSearchChange={core.filters?.setSearchTerm}
            filters={core.filters?.activeFilters || {}}
            onFiltersChange={core.filters?.setFilters}
            onResetFilters={core.filters?.reset}
            itemsPerPage={core.pagination?.itemsPerPage || 10}
            onItemsPerPageChange={core.pagination?.setItemsPerPage}
            isSelectionMode={core.selection?.isSelectionMode || false}
            onToggleSelectionMode={core.selection?.toggleSelectionMode}
            availableCategories={core.filters?.availableCategories || []}
            availableSuppliers={core.filters?.availableSuppliers || []}
            activeFiltersCount={core.filters?.activeCount || 0}
          />

          <WarehouseTable
            items={core.pagination?.currentItems || []}
            isLoading={context.loading}
            isSelectionMode={core.selection?.isSelectionMode || false}
            searchTerm={core.filters?.searchTerm || ''}
            sortConfig={core.filters?.sortConfig}
            onSort={core.handlers?.sort}
            onEdit={core.handlers?.edit}
            onDelete={enhancedHandlers.delete}
            emptyStateAction={() => navigate('/pembelian')}
            onRefresh={async () => {
              await warehouseData.refetch();
            }}
            lastUpdated={warehouseData.lastUpdated}
            // ✅ ADDED: Pass selection state from core
            selectedItems={core.selection?.selectedItems || []}
            onToggleSelection={core.selection?.toggle}
            onSelectPage={core.selection?.selectPage}
            isSelected={core.selection?.isSelected}
            isPageSelected={core.selection?.isPageSelected}
            isPagePartiallySelected={core.selection?.isPagePartiallySelected}
          />

          {/* Kontrol Paginasi */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor="itemsPerPage">Items per page:</label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Terakhir diperbarui: {warehouseData.lastUpdated ? new Date(warehouseData.lastUpdated).toLocaleString('id-ID') : 'Tidak diketahui'}
                {warehouseData.paginationInfo && (
                  <span className="ml-2 text-blue-600 font-medium">
                    (Total: {warehouseData.paginationInfo.total} data)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {warehouseData.paginationInfo && warehouseData.paginationInfo.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, warehouseData.paginationInfo.total)} dari {warehouseData.paginationInfo.total} item
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    Halaman {currentPage} dari {warehouseData.paginationInfo.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(warehouseData.paginationInfo!.totalPages, prev + 1))}
                    disabled={currentPage === warehouseData.paginationInfo.totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OPTIMIZED: Dialog System - Only when needed */}
      {hasDialogsOpen && isMountedRef.current && (
        <ErrorBoundary>
          <Suspense fallback={<DialogSkeleton />}>
            <DialogManager
              dialogs={core.dialogs}
              handlers={enhancedHandlers}
              context={context}
              selection={core.selection}
              filters={core.filters}
              bulk={core.bulk}
              pageId={pageId.current}
            />
          </Suspense>
        </ErrorBoundary>
      )}

    </div>
  );
};

// Main export with error boundary
const WarehousePage: React.FC = () => (
  <ErrorBoundary>
    <WarehousePageContent />
  </ErrorBoundary>
);

export default WarehousePage;