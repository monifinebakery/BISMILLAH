// src/components/purchase/PurchasePage.tsx - Fixed Delete with Proper Refresh

import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// ✅ CONSOLIDATED: Context imports (kept as-is, already optimal)
import { PurchaseProvider, usePurchase } from './context/PurchaseContext';
import { PurchaseTableProvider } from './context/PurchaseTableContext';

// ✅ DIRECT CONTEXT: No barrel imports
import { useSupplier } from '@/contexts/SupplierContext';

// ✅ ESSENTIAL COMPONENTS: Direct imports (no barrel)
import {
  LoadingState,
  EmptyState,
  PurchaseHeader,
} from './components';

// ✅ OPTIMIZED: Lazy loading with comprehensive error boundaries
const PurchaseTable = React.lazy(() => 
  import('./components/PurchaseTable').catch(() => ({
    default: () => (
      <div className="p-8 text-center border-2 border-dashed border-red-200 rounded-lg">
        <div className="text-red-500 text-lg mb-2">⚠️ Gagal memuat tabel</div>
        <p className="text-gray-600 text-sm">Silakan refresh halaman atau hubungi admin</p>
      </div>
    )
  }))
);

const BulkActionsToolbar = React.lazy(() => 
  import('./components/BulkActionsToolbar').catch(() => ({
    default: () => null
  }))
);

const PurchaseDialog = React.lazy(() => 
  import('./components/PurchaseDialog').catch(() => ({
    default: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <div className="text-red-500 text-lg mb-2">❌ Gagal memuat dialog</div>
          <p className="text-gray-600 mb-4">Dialog tidak dapat dimuat. Silakan coba lagi.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }))
);

const PurchaseImportDialog = React.lazy(() => 
  import('./components/dialogs/PurchaseImportDialog').catch(() => ({
    default: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <div className="text-red-500 text-lg mb-2">❌ Gagal memuat dialog import</div>
          <p className="text-gray-600 mb-4">Dialog import tidak dapat dimuat. Silakan coba lagi.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }))
);

const BulkDeleteDialog = React.lazy(() =>
  import('./components/BulkDeleteDialog').catch(() => ({
    default: () => null
  }))
);

// ✅ UTILITY: Keep essential utility

interface PurchasePageProps {
  className?: string;
}

// ✅ CONSOLIDATED: State management
interface AppState {
  dialogs: {
    purchase: { isOpen: boolean; editing: any; mode: 'create' | 'edit' };
    import: { isOpen: boolean }; // ✅ NEW: Import dialog state
    bulkDelete: { isOpen: boolean; selectedIds: string[] };
  };
  warnings: {
    dataWarning: { isVisible: boolean; hasShownToast: boolean };
  };
  ui: {
    isDeleting: boolean; // ✅ NEW: Track delete state
  };
}

const initialAppState: AppState = {
  dialogs: {
    purchase: { isOpen: false, editing: null, mode: 'create' },
    import: { isOpen: false }, // ✅ NEW: Import dialog state
    bulkDelete: { isOpen: false, selectedIds: [] }
  },
  warnings: {
    dataWarning: { isVisible: false, hasShownToast: false }
  },
  ui: {
    isDeleting: false // ✅ NEW: Track delete state
  }
};

// ✅ OPTIMIZED: Loading components
const AppLoader = ({ message = "Memuat..." }: { message?: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

const QuickLoader = () => (
  <div className="space-y-4">
    <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
    <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
  </div>
);

// ✅ MAIN COMPONENT: Fixed delete handling
const PurchasePageContent: React.FC<PurchasePageProps> = ({ className = '' }) => {
  // ✅ CONTEXTS: Direct usage
  const purchaseContext = usePurchase();
  const { suppliers } = useSupplier();

  // ✅ pakai API dari context langsung
  const {
    purchases,
    stats,
    setStatus,
    deletePurchase,
    bulkDelete,
    validatePrerequisites,
    getSupplierName,
  } = purchaseContext;

  // ✅ SINGLE STATE: Consolidated app state
  const [appState, setAppState] = useState<AppState>(initialAppState);

  // ✅ MEMOIZED: Data validation
  const dataStatus = useMemo(() => ({
    missingSuppliers: !suppliers?.length,
    hasMissingData: !suppliers?.length
  }), [suppliers]);

  // ✅ CONSOLIDATED: All dialog actions
  const dialogActions = useMemo(() => ({
    purchase: {
      openAdd: () => {
        validatePrerequisites();
        setAppState(prev => ({
          ...prev,
          dialogs: {
            ...prev.dialogs,
            purchase: { isOpen: true, editing: null, mode: 'create' }
          }
        }));
      },
      openEdit: (purchase: any) => {
        // edit selalu diperbolehkan (stok/WAC diurus trigger DB)
        setAppState(prev => ({
          ...prev,
          dialogs: {
            ...prev.dialogs,
            purchase: { isOpen: true, editing: purchase, mode: 'edit' }
          }
        }));
      },
      close: async () => {
        setAppState(prev => ({
          ...prev,
          dialogs: {
            ...prev.dialogs,
            purchase: { isOpen: false, editing: null, mode: 'create' }
          }
        }));
      }
    },
    import: {
      open: () => {
        setAppState(prev => ({
          ...prev,
          dialogs: {
            ...prev.dialogs,
            import: { isOpen: true }
          }
        }));
      },
      close: () => {
        setAppState(prev => ({
          ...prev,
          dialogs: {
            ...prev.dialogs,
            import: { isOpen: false }
          }
        }));
      }
    },
    warning: {
      dismiss: () => {
        setAppState(prev => ({
          ...prev,
          warnings: {
            ...prev.warnings,
            dataWarning: { ...prev.warnings.dataWarning, isVisible: false }
          }
        }));
      }
    }
  }), [validatePrerequisites]);

  // ✅ FIXED: Enhanced business logic handlers with proper React Query mutations
  const businessHandlers = useMemo(() => ({
    delete: async (purchaseId: string) => {
      setAppState(prev => ({ ...prev, ui: { ...prev.ui, isDeleting: true } }));

      try {
        const success = await deletePurchase(purchaseId);
        if (!success) throw new Error('Delete operation failed');
      } catch (error) {
        logger.error('Delete failed:', error);
        toast.error('Gagal menghapus pembelian: ' + ((error as any).message || 'Unknown error'));
      } finally {
        setAppState(prev => ({ ...prev, ui: { ...prev.ui, isDeleting: false } }));
      }
    },

    bulkDelete: async (purchaseIds: string[]) => {
      if (!purchaseIds.length) return;

      setAppState(prev => ({ ...prev, ui: { ...prev.ui, isDeleting: true } }));

      try {
        // ✅ REALTIME BLOCKING: Prevent spam during bulk operations
        purchaseContext.setBulkProcessing(true);
        
        await bulkDelete(purchaseIds);
        toast.success(`${purchaseIds.length} pembelian berhasil dihapus`);
      } catch (error) {
        logger.error('Bulk delete failed:', error);
        toast.error('Gagal menghapus pembelian: ' + ((error as any).message || 'Unknown error'));
      } finally {
        purchaseContext.setBulkProcessing(false);
        setAppState(prev => ({ ...prev, ui: { ...prev.ui, isDeleting: false } }));
      }
    },

  }), [deletePurchase, bulkDelete, purchaseContext]);

  // ✅ OPTIMIZED: Warning effect with cleanup
  useEffect(() => {
    if (dataStatus.hasMissingData && !appState.warnings.dataWarning.hasShownToast) {
      setAppState(prev => ({
        ...prev,
        warnings: {
          ...prev.warnings,
          dataWarning: { isVisible: true, hasShownToast: true }
        }
      }));
      
      // Consolidated warning messages
        if (dataStatus.missingSuppliers) {
          toast.warning('Tambahkan data supplier untuk mencatat pembelian dari vendor');
        }
    }
  }, [dataStatus.hasMissingData, dataStatus.missingSuppliers, appState.warnings.dataWarning.hasShownToast]);

  // ✅ EARLY RETURNS: Optimized error and loading states
  if (purchaseContext.error) {
    return (
      <div className={`container mx-auto p-4 sm:p-8 ${className}`}>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal memuat data</h3>
            <p className="text-gray-500 mb-4">{purchaseContext.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (purchaseContext.isLoading) {
    return (
      <div className={`container mx-auto p-4 sm:p-8 ${className}`}>
        <LoadingState />
      </div>
    );
  }

  return (
    <div className={`w-full p-4 sm:p-8 ${className}`}>
      
      {/* Data warning banner */}


      {/* Header */}
      <PurchaseHeader
        totalPurchases={stats.total}
        totalValue={stats.totalValue}
        pendingCount={stats.byStatus.pending}
        onAddPurchase={(intent) => {
          if (intent === 'import') {
            dialogActions.import.open();
          } else {
            dialogActions.purchase.openAdd();
          }
        }}
        className="mb-8"
      />

      {/* Main content */}
      {!purchases.length ? (
        <EmptyState
          onAddPurchase={dialogActions.purchase.openAdd}
          hasSuppliers={!dataStatus.missingSuppliers}
        />
      ) : (
        <PurchaseTableProvider purchases={purchases} suppliers={suppliers}>
          <Suspense fallback={<QuickLoader />}>
            <BulkActionsToolbar />
          </Suspense>

          <Suspense fallback={<AppLoader message="Memuat tabel pembelian..." />}>
            <PurchaseTable
              onEdit={dialogActions.purchase.openEdit}
              onStatusChange={setStatus}
              onDelete={businessHandlers.delete}
              onBulkDelete={businessHandlers.bulkDelete}
              validateStatusChange={async () => ({ canChange: true, warnings: [], errors: [] })}
            />
          </Suspense>

          <Suspense fallback={null}>
            <BulkDeleteDialog />
          </Suspense>
        </PurchaseTableProvider>
      )}

      {/* ✅ OPTIMIZED: Conditional dialogs with better loading */}
      <Suspense fallback={null}>
        {appState.dialogs.purchase.isOpen && (
          <PurchaseDialog
            isOpen={appState.dialogs.purchase.isOpen}
            mode={appState.dialogs.purchase.mode}
            purchase={appState.dialogs.purchase.editing}
            suppliers={suppliers}
            onClose={dialogActions.purchase.close}
          />
        )}
      </Suspense>
      
      {/* ✅ NEW: Import dialog */}
      <Suspense fallback={null}>
        {appState.dialogs.import.isOpen && (
          <PurchaseImportDialog
            isOpen={appState.dialogs.import.isOpen}
            onClose={dialogActions.import.close}
            onImportComplete={() => {
              // Refresh purchases after import
              purchaseContext.refreshPurchases();
            }}
          />
        )}
      </Suspense>
      {/* ✅ ENHANCED: Processing overlay with delete state */}
      {(purchaseContext.isProcessing || appState.ui.isDeleting) && (
        <div className="fixed inset-0 bg-black bg-opacity-10 z-40 pointer-events-none">
          <div className="absolute top-4 right-4 bg-white rounded-lg border p-3 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-700">
              {appState.ui.isDeleting ? 'Menghapus pembelian...' : 'Mengupdate status...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ WRAPPER: Main component
const PurchasePage: React.FC<PurchasePageProps> = ({ className }) => {
  return (
    <PurchaseProvider>
      <PurchasePageContent className={className} />
    </PurchaseProvider>
  );
};

export default PurchasePage;