// src/components/purchase/PurchasePage.tsx - Optimized Dependencies (12 → 6)
import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ✅ CONSOLIDATED: Single context import
import { PurchaseProvider, usePurchase } from './context/PurchaseContext';
import { PurchaseTableProvider } from './context/PurchaseTableContext';

// ✅ CONSOLIDATED: Combined hooks import 
import { usePurchaseCore } from './hooks/usePurchaseCore'; // New consolidated hook

// ✅ ESSENTIAL COMPONENTS ONLY (Static)
import {
  LoadingState,
  EmptyState,
  DataWarningBanner,
  PurchaseHeader,
} from './components';

// ✅ OPTIMIZED: Lazy loading with better error handling
const PurchaseTable = React.lazy(() => 
  import('./components/PurchaseTable').catch(() => ({
    default: () => <div className="p-4 text-center text-red-500">Gagal memuat tabel</div>
  }))
);

const BulkActionsToolbar = React.lazy(() => 
  import('./components/BulkActionsToolbar').catch(() => ({
    default: () => null
  }))
);

const PurchaseDialog = React.lazy(() => 
  import('./components/PurchaseDialog').catch(() => ({
    default: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <p className="text-red-500">Gagal memuat dialog</p>
      </div>
    </div>
  }))
);

const PurchaseDetailDialog = React.lazy(() => 
  import('./components/PurchaseDetailDialog').catch(() => ({
    default: () => null
  }))
);

const BulkDeleteDialog = React.lazy(() => 
  import('./components/BulkDeleteDialog').catch(() => ({
    default: () => null
  }))
);

// ✅ SIMPLIFIED: Utility import
import { exportPurchasesToCSV } from './utils/purchaseHelpers';

// ❌ REMOVED: Individual hook imports - now consolidated in usePurchaseCore
// - usePurchaseStats, usePurchaseStatus

interface PurchasePageProps {
  className?: string;
}

// ✅ SIMPLIFIED: Loading components
const QuickLoader = () => (
  <div className="h-16 bg-gray-100 rounded-lg animate-pulse mb-6" />
);

const AppLoader = ({ message = "Memuat..." }: { message?: string }) => (
  <div className="flex items-center justify-center py-8">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// ✅ CONSOLIDATED: Dialog state management
interface DialogState {
  purchase: {
    isOpen: boolean;
    editing: any;
    mode: 'create' | 'edit';
  };
  detail: {
    isOpen: boolean;
    purchase: any;
  };
  warning: {
    isVisible: boolean;
    hasShownToast: boolean;
  };
}

const initialDialogState: DialogState = {
  purchase: { isOpen: false, editing: null, mode: 'create' },
  detail: { isOpen: false, purchase: null },
  warning: { isVisible: false, hasShownToast: false }
};

// ✅ OPTIMIZED: Main component with consolidated logic
const PurchasePageContent: React.FC<PurchasePageProps> = ({ className = '' }) => {
  // ✅ CONSOLIDATED: Purchase context
  const purchaseContext = usePurchase();
  const { 
    purchases, 
    isLoading, 
    error, 
    updatePurchase, 
    deletePurchase 
  } = purchaseContext;
  
  // ✅ CONSOLIDATED: Single hook for business data and operations
  const {
    suppliers,
    bahanBaku,
    stats,
    statusOperations,
    validation

  // ✅ CONSOLIDATED: All-in-one purchase operations
  const purchaseCore = usePurchaseCore({
    purchaseContext,
    suppliers,
    bahanBaku
  });

  // ✅ SIMPLIFIED: Single state object
  const [dialogState, setDialogState] = useState<DialogState>(initialDialogState);

  // ✅ CONSOLIDATED: Data validation
  const missingSuppliers = !suppliers?.length;
  const missingBahanBaku = !bahanBaku?.length;
  const hasMissingData = missingSuppliers || missingBahanBaku;

  // ✅ SIMPLIFIED: Initial warning effect
  useEffect(() => {
    if (hasMissingData && !dialogState.warning.hasShownToast) {
      setDialogState(prev => ({
        ...prev,
        warning: { isVisible: true, hasShownToast: true }
      }));
      
      if (missingSuppliers && missingBahanBaku) {
        toast.warning('Tambahkan data supplier dan bahan baku untuk fitur pembelian yang lengkap');
      } else if (missingSuppliers) {
        toast.warning('Tambahkan data supplier untuk mencatat pembelian dari vendor');
      } else if (missingBahanBaku) {
        toast.warning('Tambahkan data bahan baku untuk mengelola stok yang dibeli');
      }
    }
  }, [hasMissingData, missingSuppliers, missingBahanBaku, dialogState.warning.hasShownToast]);

  // ✅ CONSOLIDATED: Dialog handlers
  const dialogHandlers = {
    openAdd: useCallback(() => {
      if (purchaseCore.validatePrerequisites()) {
        setDialogState(prev => ({
          ...prev,
          purchase: { isOpen: true, editing: null, mode: 'create' }
        }));
      }
    }, [purchaseCore]),

    openEdit: useCallback((purchase: any) => {
      if (purchaseCore.canEdit(purchase)) {
        setDialogState(prev => ({
          ...prev,
          purchase: { isOpen: true, editing: purchase, mode: 'edit' }
        }));
      }
    }, [purchaseCore]),

    closePurchase: useCallback(() => {
      setDialogState(prev => ({
        ...prev,
        purchase: { isOpen: false, editing: null, mode: 'create' }
      }));
    }, []),

    openDetail: useCallback((purchase: any) => {
      setDialogState(prev => ({
        ...prev,
        detail: { isOpen: true, purchase }
      }));
    }, []),

    closeDetail: useCallback(() => {
      setDialogState(prev => ({
        ...prev,
        detail: { isOpen: false, purchase: null }
      }));
    }, []),

    editFromDetail: useCallback((purchase: any) => {
      setDialogState(prev => ({
        ...prev,
        detail: { isOpen: false, purchase: null },
        purchase: { isOpen: true, editing: purchase, mode: 'edit' }
      }));
    }, []),

    dismissWarning: useCallback(() => {
      setDialogState(prev => ({
        ...prev,
        warning: { ...prev.warning, isVisible: false }
      }));
    }, [])
  };

  // ✅ SIMPLIFIED: Action handlers
  const actionHandlers = {
    delete: useCallback(async (purchaseId: string) => {
      const result = await purchaseCore.handleDelete(purchaseId);
      if (result.success) {
        toast.success('Pembelian berhasil dihapus');
      } else {
        toast.error(result.error || 'Gagal menghapus pembelian');
      }
    }, [purchaseCore]),

    export: useCallback(() => {
      if (!purchases.length) {
        toast.info('Tidak ada data pembelian untuk di-export');
        return;
      }

      try {
        const csvContent = exportPurchasesToCSV(purchases);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `pembelian_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Data pembelian berhasil di-export');
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Gagal export data pembelian');
      }
    }, [purchases]),

    settings: useCallback(() => {
      toast.info('Pengaturan pembelian akan segera tersedia');
    }, [])
  };

  // ✅ EARLY RETURNS
  if (error) {
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
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`container mx-auto p-4 sm:p-8 ${className}`}>
        <LoadingState />
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 sm:p-8 ${className}`}>
      
      {/* Data warning banner */}
      {dialogState.warning.isVisible && hasMissingData && (
        <DataWarningBanner
          missingSuppliers={missingSuppliers}
          missingBahanBaku={missingBahanBaku}
          onDismiss={dialogHandlers.dismissWarning}
        />
      )}

      {/* Header */}
      <PurchaseHeader
        totalPurchases={purchaseCore.stats.total}
        totalValue={purchaseCore.stats.totalValue}
        pendingCount={purchaseCore.stats.byStatus.pending}
        onAddPurchase={dialogHandlers.openAdd}
        onExport={actionHandlers.export}
        onSettings={actionHandlers.settings}
        className="mb-8"
      />

      {/* Main content */}
      {!purchases.length ? (
        <EmptyState
          onAddPurchase={dialogHandlers.openAdd}
          hasSuppliers={!missingSuppliers}
          hasBahanBaku={!missingBahanBaku}
        />
      ) : (
        <PurchaseTableProvider purchases={purchases} suppliers={suppliers}>
          <Suspense fallback={<QuickLoader />}>
            <BulkActionsToolbar />
          </Suspense>

          <Suspense fallback={<AppLoader message="Memuat tabel pembelian..." />}>
            <PurchaseTable 
              onEdit={dialogHandlers.openEdit}
              onStatusChange={purchaseCore.updateStatus}
              onDelete={actionHandlers.delete}
              onViewDetails={dialogHandlers.openDetail}
              validateStatusChange={purchaseCore.validateStatusChange}
            />
          </Suspense>

          <Suspense fallback={null}>
            <BulkDeleteDialog />
          </Suspense>
        </PurchaseTableProvider>
      )}

      {/* Dialogs */}
      <Suspense fallback={null}>
        <PurchaseDialog
          isOpen={dialogState.purchase.isOpen}
          mode={dialogState.purchase.mode}
          purchase={dialogState.purchase.editing}
          suppliers={suppliers}
          bahanBaku={bahanBaku}
          onClose={dialogHandlers.closePurchase}
        />
      </Suspense>

      {dialogState.detail.purchase && (
        <Suspense fallback={null}>
          <PurchaseDetailDialog
            isOpen={dialogState.detail.isOpen}
            purchase={dialogState.detail.purchase}
            suppliers={suppliers}
            bahanBaku={bahanBaku}
            onClose={dialogHandlers.closeDetail}
            onEdit={dialogHandlers.editFromDetail}
          />
        </Suspense>
      )}

      {/* Loading overlay */}
      {purchaseCore.isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-10 z-40 pointer-events-none">
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-700">Mengupdate status...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ SIMPLIFIED: Main component
const PurchasePage: React.FC<PurchasePageProps> = ({ className }) => {
  return (
    <PurchaseProvider>
      <PurchasePageContent className={className} />
    </PurchaseProvider>
  );
};

export default PurchasePage;