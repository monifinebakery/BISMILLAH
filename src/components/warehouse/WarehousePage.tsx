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

// ✅ Hooks & Context (Static)
import { useWarehouseCore } from './hooks/useWarehouseCore';
import { useWarehouseContext } from './context/WarehouseContext';

// 🔄 ALTERNATIVE STRATEGY: Preload on hover/interaction
let DialogManagerPromise: Promise<any> | null = null;

const preloadDialogManager = () => {
  if (!DialogManagerPromise) {
    DialogManagerPromise = import('./components/DialogManager');
  }
  return DialogManagerPromise;
};

// ✅ Dynamic Components with Multiple Fallback Strategies
const DialogManager = lazy(() => {
  // Strategy 1: Use preloaded promise if available
  if (DialogManagerPromise) {
    return DialogManagerPromise;
  }
  
  // Strategy 2: Direct import with retry
  return import('./components/DialogManager')
    .catch(error => {
      logger.error('DialogManager import failed, attempting retry...', error);
      
      // Strategy 3: Retry with delay
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          import('./components/DialogManager')
            .then(resolve)
            .catch(retryError => {
              logger.error('DialogManager retry failed:', retryError);
              
              // Strategy 4: Load from different path (if available)
              // This assumes you might have a backup build
              const backupImport = () => import('./components/DialogManager/index.js')
                .catch(() => import('./components/DialogManager.tsx'))
                .catch(() => {
                  // Strategy 5: Return mock component
                  logger.warn('All import strategies failed, using fallback');
                  return {
                    default: () => React.createElement('div', {
                      className: 'fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'
                    }, React.createElement('div', {
                      className: 'bg-white rounded-lg p-6 text-center'
                    }, 'Dialog tidak dapat dimuat. Silakan refresh halaman.'))
                  };
                });
              
              backupImport().then(resolve).catch(reject);
            });
        }, 1000);
      });
    });
});

// Enhanced Loading Components
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

const DialogLoader = () => {
  const [progress, setProgress] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => prev >= 90 ? 90 : prev + 10);
    }, 200);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center min-w-[250px]">
        <div className="animate-spin h-6 w-6 border-3 border-orange-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-gray-600 text-sm mb-2">Memuat dialog...</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{progress}%</p>
      </div>
    </div>
  );
};

/**
 * Warehouse Page - Production-Ready with Advanced Error Handling
 */
const WarehousePage: React.FC = () => {
  const pageId = React.useRef(`WarehousePage-${Date.now()}`);
  const [isDialogPreloaded, setIsDialogPreloaded] = React.useState(false);
  
  logger.debug(`[${pageId.current}] 🏠 WarehousePage rendering`);

  // Context & Core Logic
  const context = useWarehouseContext();
  const core = useWarehouseCore(context);

  // Preload dialog on component mount (background loading)
  React.useEffect(() => {
    const preloadTimer = setTimeout(() => {
      preloadDialogManager()
        .then(() => {
          setIsDialogPreloaded(true);
          logger.debug(`[${pageId.current}] ✅ DialogManager preloaded successfully`);
        })
        .catch(error => {
          logger.warn(`[${pageId.current}] ⚠️ DialogManager preload failed:`, error);
        });
    }, 2000); // Preload after 2 seconds
    
    return () => clearTimeout(preloadTimer);
  }, [pageId]);

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
      // Trigger preload if not already done
      if (!isDialogPreloaded) {
        preloadDialogManager();
      }
    }
  }, [hasDialogsOpen, isDialogPreloaded, pageId]);

  // Enhanced error boundary for production
  const DialogErrorHandler = ({ children }: { children: React.ReactNode }) => {
    const [hasError, setHasError] = React.useState(false);
    const [errorDetails, setErrorDetails] = React.useState<string>('');

    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        if (event.error?.message?.includes('Failed to fetch') || 
            event.error?.message?.includes('Loading chunk') ||
            event.error?.message?.includes('dynamically imported module')) {
          logger.error('Dynamic import error caught:', event.error);
          setHasError(true);
          setErrorDetails(event.error.message);
          event.preventDefault();
        }
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        if (event.reason?.message?.includes('Failed to fetch') ||
            event.reason?.message?.includes('Loading chunk') ||
            event.reason?.message?.includes('dynamically imported module')) {
          logger.error('Promise rejection caught:', event.reason);
          setHasError(true);
          setErrorDetails(event.reason.message);
          event.preventDefault();
        }
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }, []);

    if (hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 text-red-500 mr-3 text-2xl">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800">Dialog Error</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Komponen dialog gagal dimuat. Ini mungkin karena masalah jaringan atau cache.
            </p>
            <details className="mb-4">
              <summary className="text-xs text-gray-500 cursor-pointer">Detail Error</summary>
              <pre className="text-xs text-gray-400 mt-2 overflow-auto max-h-20 bg-gray-50 p-2 rounded">
                {errorDetails}
              </pre>
            </details>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setHasError(false);
                  // Clear cache and retry
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    });
                  }
                  window.location.reload();
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                Refresh & Retry
              </button>
              <button
                onClick={() => {
                  setHasError(false);
                  core.dialogs.closeAll();
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                Tutup Dialog
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  logger.debug(`[${pageId.current}] 📊 Rendering with data:`, {
    itemCount: context.bahanBaku.length,
    loading: context.loading,
    selectedCount: core.selection.selectedCount,
    hasDialogsOpen,
    isDialogPreloaded
  });

  return (
    <div className="container mx-auto p-4 sm:p-8" aria-live="polite">
      
      {/* Header with Preload Hints */}
      <WarehouseHeader
        itemCount={context.bahanBaku.length}
        selectedCount={core.selection.selectedCount}
        isConnected={context.isConnected}
        onOpenDialog={(type) => {
          // Trigger immediate preload when user intends to open dialog
          preloadDialogManager();
          core.dialogs.open(type);
        }}
      />

      {/* Bulk Actions */}
      {core.selection.selectedCount > 0 && (
        <BulkActions
          selectedCount={core.selection.selectedCount}
          onBulkEdit={() => {
            preloadDialogManager();
            core.dialogs.open('bulkEdit');
          }}
          onBulkDelete={() => {
            preloadDialogManager();
            core.dialogs.open('bulkDelete');
          }}
          onClearSelection={core.selection.clear}
          isProcessing={core.bulk.isProcessing}
        />
      )}

      {/* Main Content */}
      {context.loading ? (
        <TableLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
          
          {/* Filters */}
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

          {/* Table */}
          <WarehouseTable
            items={core.pagination.currentItems}
            isLoading={context.loading}
            isSelectionMode={core.selection.isSelectionMode}
            searchTerm={core.filters.searchTerm}
            sortConfig={core.filters.sortConfig}
            onSort={core.handlers.sort}
            onEdit={(item) => {
              preloadDialogManager();
              core.handlers.edit(item);
            }}
            onDelete={(item) => {
              preloadDialogManager();
              core.handlers.delete(item);
            }}
            selectedItems={core.selection.selectedItems}
            onToggleSelection={core.selection.toggle}
            onSelectAllCurrent={core.selection.selectPage}
            isSelected={core.selection.isSelected}
            allCurrentSelected={core.selection.isPageSelected}
            someCurrentSelected={core.selection.isPagePartiallySelected}
            emptyStateAction={() => {
              preloadDialogManager();
              core.dialogs.open('addItem');
            }}
          />

          {/* Pagination */}
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

      {/* 🎯 Enhanced Dialog System with Multiple Fallback Strategies */}
      {hasDialogsOpen && (
        <DialogErrorHandler>
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
        </DialogErrorHandler>
      )}

      {/* Preload Indicator (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 text-xs bg-black bg-opacity-75 text-white px-2 py-1 rounded">
          Dialog: {isDialogPreloaded ? '✅ Preloaded' : '⏳ Loading...'}
        </div>
      )}

    </div>
  );
};

export default WarehousePage;