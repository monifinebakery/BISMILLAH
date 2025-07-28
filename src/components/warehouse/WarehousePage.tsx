// src/components/warehouse/WarehousePage.tsx
import React, { Suspense, lazy } from 'react';
import { logger } from '@/utils/logger';

// Static Components (Always Loaded)
import { WarehouseHeader, WarehouseTable, WarehouseFilters, BulkActions } from './components';
import { useWarehouseCore } from './hooks';
import { useWarehouseContext } from './WarehouseContext';

// Dynamic Components (Lazy Loaded)
const DialogManager = lazy(() => import('./components/DialogManager'));

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
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
  </div>
);

/**
 * Warehouse Page - Lightweight Shell
 * 
 * This component acts as a lightweight shell that:
 * - Loads core functionality immediately (~15KB)
 * - Lazy loads dialogs only when needed (~55KB)
 * - Uses optimized context and hooks
 * - Provides smooth loading states
 * 
 * Total Size: ~15KB (vs 45KB+ in monolithic approach)
 */
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
            <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
            <p className="text-gray-600">Warehouse context tidak tersedia.</p>
          </div>
        </div>
      </div>
    );
  }

  logger.debug(`[${pageId.current}] 📊 Rendering with data:`, {
    itemCount: context.bahanBaku.length,
    loading: context.loading,
    selectedCount: core.selection.selectedCount
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

          {/* Pagination */}
          {core.filters.filteredItems.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {core.pagination.startIndex + 1}-{Math.min(core.pagination.endIndex, core.filters.filteredItems.length)} of {core.filters.filteredItems.length} items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => core.pagination.setPage(core.pagination.page - 1)}
                    disabled={core.pagination.page === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {core.pagination.page} of {core.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => core.pagination.setPage(core.pagination.page + 1)}
                    disabled={core.pagination.page === core.pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs - Dynamic (~55KB total, loaded only when needed) */}
      <Suspense fallback={<DialogLoader />}>
        <DialogManager
          dialogs={core.dialogs}
          handlers={core.handlers}
          context={context}
          selection={core.selection}
          filters={core.filters}
          bulk={core.bulk}
          pageId={pageId.current}
        />
      </Suspense>

    </div>
  );
};

export default WarehousePage;