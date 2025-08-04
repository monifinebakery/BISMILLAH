// src/components/warehouse/WarehousePage.tsx - Optimized Dependencies
import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';

// ✅ SINGLE IMPORT - Reduced from multiple imports
import { 
  WarehouseHeader, 
  WarehouseTable, 
  WarehouseFilters, 
  BulkActions 
} from './components';

// ✅ CONSOLIDATED HOOK IMPORTS
import { useWarehouseCore } from './hooks/useWarehouseCore';
import { useWarehouseContext } from './context/WarehouseContext';

// ✅ OPTIMIZED: Single lazy import with better error handling
const DialogManager = lazy(() => 
  import('./components/DialogManager').then(module => ({
    default: module.default
  })).catch(error => {
    logger.error('❌ DialogManager lazy load failed:', error);
    
    // Fallback component
    return {
      default: ({ dialogs }: any) => (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
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
                  // Close all dialogs fallback
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

// ✅ OPTIMIZED: Lightweight loading components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
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
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 flex flex-col items-center min-w-[200px]">
      <LoadingSpinner />
      <p className="text-gray-600 text-sm mt-3">Memuat dialog...</p>
    </div>
  </div>
);

/**
 * ✅ OPTIMIZED: Warehouse Page Component
 * 
 * Dependencies reduced from 4 to 3:
 * - Consolidated imports
 * - Removed redundant imports
 * - Optimized lazy loading
 */
const WarehousePageContent: React.FC = () => {
  const pageId = useRef(`warehouse-${Date.now()}`);
  const isMountedRef = useRef(true);
  
  // ✅ OPTIMIZED: Single context call
  const context = useWarehouseContext();
  const core = useWarehouseCore(context);

  // ✅ OPTIMIZED: Simplified effect
  useEffect(() => {
    logger.debug(`[${pageId.current}] 🏠 WarehousePage mounted`);
    return () => {
      isMountedRef.current = false;
      logger.debug(`[${pageId.current}] 🧹 WarehousePage unmounted`);
    };
  }, []);

  // ✅ Early return for missing context
  if (!context) {
    return (
      <div className="container mx-auto p-4 sm:p-8">
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

  // ✅ OPTIMIZED: Simplified dialog detection
  const hasDialogsOpen = Object.values(core.dialogs?.states || {}).some(Boolean) || !!core.dialogs?.editingItem;

  return (
    <div className="container mx-auto p-4 sm:p-8" aria-live="polite">
      
      {/* ✅ Header Section */}
      <WarehouseHeader
        itemCount={context.bahanBaku?.length || 0}
        selectedCount={core.selection?.selectedCount || 0}
        isConnected={context.isConnected}
        onOpenDialog={core.dialogs?.open}
      />

      {/* ✅ Bulk Actions */}
      {(core.selection?.selectedCount || 0) > 0 && (
        <BulkActions
          selectedCount={core.selection.selectedCount}
          onBulkEdit={() => core.dialogs?.open?.('bulkEdit')}
          onBulkDelete={() => core.dialogs?.open?.('bulkDelete')}
          onClearSelection={core.selection?.clear}
          isProcessing={core.bulk?.isProcessing || false}
        />
      )}

      {/* ✅ Main Content */}
      {context.loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
          
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
            onDelete={core.handlers?.delete}
            selectedItems={core.selection?.selectedItems || new Set()}
            onToggleSelection={core.selection?.toggle}
            onSelectAllCurrent={core.selection?.selectPage}
            isSelected={core.selection?.isSelected}
            allCurrentSelected={core.selection?.isPageSelected || false}
            someCurrentSelected={core.selection?.isPagePartiallySelected || false}
            emptyStateAction={() => core.dialogs?.open?.('addItem')}
          />

          {/* ✅ Pagination */}
          {(core.filters?.filteredItems?.length || 0) > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {(core.pagination?.startIndex || 0) + 1}-{Math.min(core.pagination?.endIndex || 0, core.filters?.filteredItems?.length || 0)} dari {core.filters?.filteredItems?.length || 0} item
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => core.pagination?.setPage?.((core.pagination?.page || 1) - 1)}
                    disabled={(core.pagination?.page || 1) === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    Halaman {core.pagination?.page || 1} dari {core.pagination?.totalPages || 1}
                  </span>
                  <button
                    onClick={() => core.pagination?.setPage?.((core.pagination?.page || 1) + 1)}
                    disabled={(core.pagination?.page || 1) === (core.pagination?.totalPages || 1)}
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

      {/* ✅ OPTIMIZED: Dialog System - Only when needed */}
      {hasDialogsOpen && isMountedRef.current && (
        <ErrorBoundary>
          <Suspense fallback={<DialogSkeleton />}>
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
        </ErrorBoundary>
      )}

    </div>
  );
};

// ✅ Main export with error boundary
const WarehousePage: React.FC = () => (
  <ErrorBoundary>
    <WarehousePageContent />
  </ErrorBoundary>
);

export default WarehousePage;