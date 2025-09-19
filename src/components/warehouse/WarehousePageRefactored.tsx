// src/components/warehouse/WarehousePageRefactored.tsx
// 🔄 REFACTORED VERSION - Simplified and cleaner
import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';

// SINGLE IMPORT - Reduced from multiple imports
import { 
  WarehouseHeader, 
  WarehouseFilters, 
  BulkActions 
} from './components';

// ✅ LAZY LOADING: WarehouseTable dengan code splitting
const WarehouseTable = React.lazy(() => 
  import(/* webpackChunkName: "warehouse-table" */ './components/WarehouseTable')
    .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat tabel gudang') }))
);

// CONSOLIDATED HOOK IMPORTS
import { useWarehouseCore } from './hooks/useWarehouseCore';
import { useWarehouseOperations } from './hooks/useWarehouseOperations';

// ✅ OPTIMIZED: Single lazy import with better error handling
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

const TableLoading = () => (
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
  </div>
);

const WarehousePageRefactored: React.FC = () => {
  const navigate = useNavigate();

  // ✅ HOOKS: Use extracted operations hook
  const {
    bahanBaku,
    loading,
    error,
    smartRefetch,
    createItem,
    updateItem,
    deleteItem,
    bulkDeleteItems,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkDeleting,
  } = useWarehouseOperations();

  // ✅ FIXED: Create context object and pass to useWarehouseCore
  const contextForCore = {
    bahanBaku: bahanBaku || [],
    loading,
    updateBahanBaku: async (id: string, updates: any) => {
      try {
        await updateItem({ id, item: updates });
        return true;
      } catch (error) {
        console.error('Failed to update item:', error);
        return false;
      }
    },
    deleteBahanBaku: async (id: string) => {
      try {
        await deleteItem(id);
        return true;
      } catch (error) {
        console.error('Failed to delete item:', error);
        return false;
      }
    },
    bulkDeleteBahanBaku: async (ids: string[]) => {
      try {
        await bulkDeleteItems(ids);
        return true;
      } catch (error) {
        console.error('Failed to bulk delete items:', error);
        return false;
      }
    },
  };
  
  // Use existing warehouse core hook for UI state with proper context
  const {
    dialogs,
    selectedItems,
    filters,
    searchTerm,
    sortConfig,
    handleSearch,
    handleFilterChange,
    handleSort,
    handleSelectItem,
    handleSelectAll,
    handleBulkDelete,
    openDialog,
    closeDialog,
  } = useWarehouseCore(contextForCore);

  const handleCreateItem = async (newItem: any) => {
    try {
      await createItem(newItem);
      closeDialog('add');
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to create item:', error);
    }
  };

  const handleUpdateItem = async (id: string, updatedItem: any) => {
    try {
      await updateItem({ id, item: updatedItem });
      closeDialog('edit');
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to update item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      closeDialog('delete');
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to delete item:', error);
    }
  };

  const handleBulkDeleteItems = async (ids: string[]) => {
    try {
      await bulkDeleteItems(ids);
      handleBulkDelete(ids); // Update UI state
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to bulk delete items:', error);
    }
  };

  // Handle navigation
  const handleNavigateToDetail = (itemId: string) => {
    navigate(`/warehouse/detail/${itemId}`);
  };

  const handleNavigateToAddEdit = (itemId?: string) => {
    if (itemId) {
      navigate(`/warehouse/edit/${itemId}`);
    } else {
      navigate('/warehouse/add');
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Gagal Memuat Data Gudang
            </h2>
            <p className="text-red-600 mb-4">
              Terjadi kesalahan saat memuat data. Coba refresh halaman.
            </p>
            <button
              onClick={() => smartRefetch()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Header */}
          <WarehouseHeader 
            onRefresh={smartRefetch}
            onNavigateToAdd={() => handleNavigateToAddEdit()}
            isRefreshing={loading}
          />

          {/* Filters and Search */}
          <WarehouseFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedItems={selectedItems}
            onBulkDelete={handleBulkDeleteItems}
            isDeleting={isBulkDeleting}
          />

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80">
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error loading table</div>}>
              <Suspense fallback={<div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>}>
                <WarehouseTable
                  data={bahanBaku || []}
                  selectedItems={selectedItems}
                  sortConfig={sortConfig}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
                  onSort={handleSort}
                  onEdit={(item) => openDialog('edit', item)}
                  onDelete={(item) => openDialog('delete', item)}
                  onDetail={handleNavigateToDetail}
                  loading={loading}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Dialog Manager */}
          <ErrorBoundary fallback={<div>Dialog system unavailable</div>}>
            <Suspense fallback={<div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>}>
              <DialogManager
                dialogs={dialogs}
                onClose={closeDialog}
                onCreate={handleCreateItem}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                isCreating={isCreating}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default WarehousePageRefactored;