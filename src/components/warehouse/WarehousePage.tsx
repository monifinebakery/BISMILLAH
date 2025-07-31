// src/components/warehouse/WarehousePage.tsx - Fixed Import Strategy
import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import ErrorBoundary from '@/components/ErrorBoundary';

// ✅ Static Components (Always Loaded)
import { 
  WarehouseHeader, 
  WarehouseTable, 
  WarehouseFilters, 
  BulkActions 
} from './components';

// ✅ Hooks & Context (Static)
import { useWarehouseCore } from './hooks/useWarehouseCore';
import { useWarehouseContext } from './context/WarehouseContext';

// ❌ REMOVED: Don't import both statically AND dynamically
// import DialogManager from './components/DialogManager'; // This was causing the warning

// ✅ ONLY Dynamic Import (for code splitting)
const DialogManager = lazy(() => 
  import('./components/DialogManager').catch(error => {
    logger.error('❌ DialogManager import failed:', error);
    return Promise.resolve({
      default: ({ dialogs }: any) => (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              ⚠️ Dialog System Error
            </h3>
            <p className="text-gray-600 mb-4">
              The dialog system failed to load. Please refresh the page.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  // Try to close all dialogs
                  if (dialogs?.close) {
                    Object.keys(dialogs.states || {}).forEach(key => {
                      dialogs.close(key);
                    });
                  }
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )
    });
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

/**
 * Warehouse Page - Optimized with Proper Code Splitting
 * 
 * Bundle Strategy:
 * - Static components (~40KB): Loaded immediately
 * - Dialog components (~60KB): ONLY lazy loaded when needed
 * - Total initial bundle: ~40KB (vs 100KB+ if statically imported)
 * - Dialog bundle: Loaded on first dialog open
 */
const WarehousePageContent: React.FC = () => {
  const pageId = useRef(`WarehousePage-${Date.now()}`);
  const isMountedRef = useRef(true);
  
  logger.debug(`[${pageId.current}] 🏠 WarehousePage rendering`);

  // Context & Core Logic
  const context = useWarehouseContext();
  const core = useWarehouseCore(context);

  // Component cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      logger.debug(`[${pageId.current}] 🧹 WarehousePage cleanup`);
    };
  }, []);

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
  const hasDialogsOpen = Object.values(core.dialogs?.states || {}).some(Boolean) || !!core.dialogs?.editingItem;
  
  useEffect(() => {
    if (hasDialogsOpen && isMountedRef.current) {
      logger.debug(`[${pageId.current}] 📱 Dialog system activated - starting lazy load`);
    }
  }, [hasDialogsOpen]);

  logger.debug(`[${pageId.current}] 📊 Rendering with data:`, {
    itemCount: context.bahanBaku?.length || 0,
    loading: context.loading,
    selectedCount: core.selection?.selectedCount || 0,
    hasDialogsOpen,
    willLoadDialogs: hasDialogsOpen && isMountedRef.current
  });

  return (
    <div className="container mx-auto p-4 sm:p-8" aria-live="polite">
      
      {/* Header - Static (~5KB) */}
      <WarehouseHeader
        itemCount={context.bahanBaku?.length || 0}
        selectedCount={core.selection?.selectedCount || 0}
        isConnected={context.isConnected}
        onOpenDialog={core.dialogs?.open}
      />

      {/* Bulk Actions - Static (~3KB) */}
      {(core.selection?.selectedCount || 0) > 0 && (
        <BulkActions
          selectedCount={core.selection.selectedCount}
          onBulkEdit={() => core.dialogs?.open?.('bulkEdit')}
          onBulkDelete={() => core.dialogs?.open?.('bulkDelete')}
          onClearSelection={core.selection?.clear}
          isProcessing={core.bulk?.isProcessing || false}
        />
      )}

      {/* Main Content */}
      {context.loading ? (
        <TableLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
          
          {/* Filters - Static (~8KB) */}
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

          {/* Table - Static (~12KB) */}
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

          {/* Pagination - Static (~2KB) */}
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
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    Halaman {core.pagination?.page || 1} dari {core.pagination?.totalPages || 1}
                  </span>
                  <button
                    onClick={() => core.pagination?.setPage?.((core.pagination?.page || 1) + 1)}
                    disabled={(core.pagination?.page || 1) === (core.pagination?.totalPages || 1)}
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

      {/* 🎯 Dialog System - ONLY Lazy Loaded (~60KB chunk) */}
      {hasDialogsOpen && isMountedRef.current && (
        <ErrorBoundary>
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
        </ErrorBoundary>
      )}

    </div>
  );
};

// Main exported component with error boundary
const WarehousePage: React.FC = () => {
  return (
    <ErrorBoundary>
      <WarehousePageContent />
    </ErrorBoundary>
  );
};

export default WarehousePage;