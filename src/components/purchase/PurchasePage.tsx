// src/components/purchase/PurchasePage.tsx - Fixed Delete with Proper Refresh

import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { Purchase } from './types/purchase.types';

// Context imports
import { PurchaseProvider } from './context/PurchaseContext';
import { usePurchase } from './hooks/usePurchase';
import { PurchaseTableProvider } from './context/PurchaseTableContext';

// Direct context imports
import { useSupplier } from '@/contexts/SupplierContext';

// Component imports
import {
  LoadingState,
  EmptyState,
  PurchaseHeader,
} from './components';

// Lazy loaded components
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



// Remove PurchaseDialog - now using full page

const PurchaseImportDialog = React.lazy(() => 
  import('./components/dialogs/PurchaseImportDialog').catch(() => ({
    default: () => (
      <div className="dialog-overlay-center">
        <div className="dialog-panel max-w-md">
          <div className="dialog-body">
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
      </div>
    )
  }))
);



// ✅ UTILITY: Keep essential utility

interface PurchasePageProps {
  className?: string;
}

// ✅ CONSOLIDATED: State management
interface AppState {
  dialogs: {
    import: { isOpen: boolean }; // Import dialog state
  };
  warnings: {
    dataWarning: { isVisible: boolean; hasShownToast: boolean };
  };
  ui: {
    isDeleting: boolean; // Track delete state
  };
}

const initialAppState: AppState = {
  dialogs: {
    import: { isOpen: false }, // Import dialog state
  },
  warnings: {
    dataWarning: { isVisible: false, hasShownToast: false }
  },
  ui: {
    isDeleting: false // Track delete state
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

// QuickLoader removed - unused

// ✅ MAIN COMPONENT: Fixed delete handling
const PurchasePageContent: React.FC<PurchasePageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  // CONTEXTS: Direct usage
  const purchaseContext = usePurchase();
  const { suppliers } = useSupplier();
  const { user } = useAuth();

  // ✅ SIMPLIFIED: Use only context data, remove dual query system
  const {
    purchases,
    stats,
    setStatus,
    deletePurchase,
    validatePrerequisites,
    getSupplierName,
    isLoading,
    error,
  } = purchaseContext;

  // ✅ FIXED: Use context data directly
  const finalPurchases: Purchase[] = purchases;
  const finalIsLoading = isLoading;
  const finalError = error;
  const finalStats = stats;

  // ✅ SINGLE STATE: Consolidated app state
  const [appState, setAppState] = useState<AppState>(initialAppState);

  // ✅ MEMOIZED: Data validation
  const dataStatus = useMemo(() => ({
    missingSuppliers: !suppliers?.length,
    hasMissingData: !suppliers?.length
  }), [suppliers]);

  // Get current base path (handle both /pembelian and /purchase)
  const getBasePath = useCallback(() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pembelian')) {
      return '/pembelian';
    }
    return '/purchase';
  }, []);

  // Navigation actions
  const navigationActions = useMemo(() => ({
    purchase: {
      openAdd: () => {
        validatePrerequisites();
        const basePath = getBasePath();
        if (basePath === '/pembelian') {
          // For old path, navigate to new structure
          navigate('/purchase/add');
        } else {
          navigate('/purchase/add');
        }
      },
      openEdit: (purchase: any) => {
        navigate(`/purchase/edit/${purchase.id}`);
      },
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
        // Refresh purchases after import
        purchaseContext.refreshPurchases?.();
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
    }
  }), [deletePurchase, purchaseContext]);

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
  if (finalError) {
    return (
      <div className={`max-w-screen-xl mx-auto p-4 sm:p-8 ${className}`}>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal memuat data</h3>
            <p className="text-gray-500 mb-4">{finalError instanceof Error ? finalError.message : String(finalError)}</p>
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

  if (finalIsLoading) {
    return (
      <div className={`max-w-screen-xl mx-auto p-4 sm:p-8 ${className}`}>
        <LoadingState />
      </div>
    );
  }

  return (
    <div className={`max-w-screen-xl mx-auto p-4 sm:p-8 ${className}`}>
      
      {/* Data warning banner */}



      {/* Header */}
      <PurchaseHeader
        totalPurchases={finalStats.total}
        totalValue={finalStats.totalValue}
        pendingCount={finalStats.byStatus.pending}
        onAddPurchase={(intent) => {
          if (intent === 'import' as any) {
            navigationActions.import.open();
          } else {
            navigationActions.purchase.openAdd();
          }
        }}
        className="mb-8"
      />

      {/* Main content */}
      {!finalPurchases.length ? (
        <EmptyState
          onAddPurchase={navigationActions.purchase.openAdd}
          hasSuppliers={!dataStatus.missingSuppliers}
        />
      ) : (
        <>
          <PurchaseTableProvider purchases={finalPurchases} suppliers={suppliers}>
            <Suspense fallback={<AppLoader message="Memuat tabel pembelian..." />}>
              <PurchaseTable
                onEdit={navigationActions.purchase.openEdit}
                onStatusChange={setStatus}
                onDelete={async (purchaseId: string) => {
                  await businessHandlers.delete(purchaseId);
                }}
                validateStatusChange={async () => ({ canChange: true, warnings: [], errors: [] })}
              />
            </Suspense>
          </PurchaseTableProvider>

        </>
      )}

      {/* Purchase dialog removed - using full page navigation */}
      
      {/* Import dialog */}
      <SafeSuspense loadingMessage="Memuat dialog import...">
        {appState.dialogs.import.isOpen && (
          <PurchaseImportDialog
            isOpen={appState.dialogs.import.isOpen}
            onClose={navigationActions.import.close}
            onImportComplete={() => {
              // Refresh purchases after import
              purchaseContext.refreshPurchases();
            }}
          />
        )}
      </SafeSuspense>
      {/* ✅ ENHANCED: Processing overlay with delete state */}
      {(purchaseContext.isProcessing || appState.ui.isDeleting) && (
        <div className="dialog-overlay-center bg-opacity-10 pointer-events-none">
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
