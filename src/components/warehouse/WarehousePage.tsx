// src/components/warehouse/WarehousePage.tsx
import React, { Suspense, lazy } from 'react';
import { logger } from '@/utils/logger';

// ✅ Static Components (Always Loaded)
import { 
  WarehouseHeader, 
  WarehouseTable, 
  WarehouseFilters, 
  BulkActions 
} from './components';

// Hooks & Context (Static)
import { useWarehouseCore } from './hooks/useWarehouseCore';
import { useWarehouseContext } from './context/WarehouseContext';

// 🔧 TEMPORARY FIX: Use static import instead of lazy loading
// Change this back to lazy loading once deployment issue is resolved
import DialogManager from './components/DialogManager';

// Alternative lazy loading with error boundary
const DialogManagerLazy = lazy(() => 
  import('./components/DialogManager').catch(error => {
    logger.error('Failed to load DialogManager:', error);
    // Fallback to a simple component
    return { 
      default: () => (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">❌ Dialog gagal dimuat</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      )
    };
  })
);

// Loading Components
const TableLoader = () => (
  <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="h-10 bg-gray-200 rounded-md w-1/3 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-md w-24 animate-pulse" />
      </div>
    </div>
    <div className="p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-3">
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

const DialogLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 flex flex-col items-center min-w-[200px]">
      <div className="animate-spin h-6 w-6 border-3 border-orange-500 border-t-transparent rounded-full mb-3"></div>
      <p className="text-gray-600 text-sm">Memuat dialog...</p>
    </div>
  </div>
);

const WarehousePage: React.FC = () => {
  const pageId = React.useRef(`WarehousePage-${Date.now()}`);
  
  logger.debug(`[${pageId.current}] 🏠 WarehousePage rendering`);

  // Context & Core Logic
  const context = useWarehouseContext();
  const core = useWarehouseCore(context);

  // Early return for context errors
  if (!context) {
    logger.error(`[${pageId.current}] ❌ Context not available`);
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
            <p className="text-gray-600">Warehouse context tidak tersedia.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Performance monitoring
  const hasDialogsOpen = Object.values(core.dialogs.states).some(Boolean) || !!core.dialogs.editingItem;
  
  React.useEffect(() => {
    if (hasDialogsOpen) {
      logger.debug(`[${pageId.current}] 📱 Dialog system activated`);
    }
  }, [hasDialogsOpen, pageId]);

  logger.debug(`[${pageId.current}] 📊 Rendering with data:`, {
    itemCount: context.bahanBaku.length,
    loading: context.loading,
    selectedCount: core.selection.selectedCount,
    hasDialogsOpen
  });

  return (
    <div className="container mx-auto p-4 sm:p-8" aria-live="polite">
      
      {/* Header - Static (~5KB) */}
      <WarehouseHeader
        itemCount={context.bahanBaku.length}
        selectedCount={core.selection.selectedCount}
        isConnected={context.isConnected}
        onOpenDialog={core.dialogs.open}
      />

      {/* Bulk Actions - Static (~3KB) */}
      {core.selection.selectedCount > 0 && (
        <BulkActions
          selectedCount={core.selection.selectedCount}
          onBulkEdit={() => core.dialogs.open('bulkEdit')}
          onBulkDelete={() => core.dialogs.open('bulkDelete')}
          onClearSelection={core.selection.clear}
          isProcessing={core.bulk.isProcessing}
        />
      )}

      {/* Main Content */}
      {context.loading ? (
        <TableLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
          
          {/* Filters - Static (~8KB) */}
          <WarehouseFilters
            searchTerm={core.filters.searchTerm}
            onSearchChange={core.filters.setSearchTerm}
            filters={core.filters.activeFilters}
            onFiltersChange={core.filters.setFilters}
            onResetFilters={core.filters.reset}
            itemsPerPage={core.pagination.itemsPerPage}
            onItemsPerPageChange={core.pagination.setItemsPerPage}
            isSelectionMode={core.selection.isSelectionMode}
            onToggleSelectionMode={core.selection.toggleSelectionMode}
            availableCategories={core.filters.availableCategories}
            availableSuppliers={core.filters.availableSuppliers}
            activeFiltersCount={core.filters.activeCount}
          />

          {/* Table - Static (~12KB) */}
          <WarehouseTable
            items={core.pagination.currentItems}
            isLoading={context.loading}
            isSelectionMode={core.selection.isSelectionMode}
            searchTerm={core.filters.searchTerm}
            sortConfig={core.filters.sortConfig}
            onSort={core.handlers.sort}
            onEdit={core.handlers.edit}
            onDelete={core.handlers.delete}
            selectedItems={core.selection.selectedItems}
            onToggleSelection={core.selection.toggle}
            onSelectAllCurrent={core.selection.selectPage}
            isSelected={core.selection.isSelected}
            allCurrentSelected={core.selection.isPageSelected}
            someCurrentSelected={core.selection.isPagePartiallySelected}
            emptyStateAction={() => core.dialogs.open('addItem')}
          />

          {/* Pagination - Static (~2KB) */}
          {core.filters.filteredItems.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {core.pagination.startIndex + 1}-{Math.min(core.pagination.endIndex, core.filters.filteredItems.length)} dari {core.filters.filteredItems.length} item
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => core.pagination.setPage(core.pagination.page - 1)}
                    disabled={core.pagination.page === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    Halaman {core.pagination.page} dari {core.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => core.pagination.setPage(core.pagination.page + 1)}
                    disabled={core.pagination.page === core.pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🎯 Dialog System with Error Handling */}
      {hasDialogsOpen && (
        <React.Suspense fallback={<DialogLoader />}>
          {/* Use static import for now, switch back to DialogManagerLazy after fixing deployment */}
          <DialogManager
            dialogs={core.dialogs}
            handlers={core.handlers}
            context={context}
            selection={core.selection}
            filters={core.filters}
            bulk={core.bulk}
            pageId={pageId.current}
          />
        </React.Suspense>
      )}

    </div>
  );
};

export default WarehousePage;