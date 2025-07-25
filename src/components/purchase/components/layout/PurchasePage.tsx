// Fixed PurchasePage.tsx - BulkDeleteDialog moved inside PurchaseTableProvider
import React, { Suspense, useState, useEffect } from 'react';
import { usePurchase } from '../../context/PurchaseContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/components/warehouse/context/BahanBakuContext';
import { PurchaseTableProvider } from '../../context/PurchaseTableContext';
import PurchaseHeader from './PurchaseHeader';
import LoadingPurchaseState from '../states/LoadingPurchaseState';
import { calculatePurchaseStats } from '../../utils/purchaseHelpers';
import { toast } from 'sonner';

// Lazy load components
const PurchaseTable = React.lazy(() => import('../table/PurchaseTable'));
const BulkActionsToolbar = React.lazy(() => import('../table/BulkActionsToolbar'));
const PurchaseDialog = React.lazy(() => import('../forms/PurchaseDialog'));
const BulkDeleteDialog = React.lazy(() => import('../dialogs/BulkDeleteDialog'));

interface PurchasePageProps {
  className?: string;
}

// 🔧 FIXED: Soft warning banner instead of blocking error
const DataWarningBanner: React.FC<{
  missingSuppliers: boolean;
  missingBahanBaku: boolean;
  onDismiss: () => void;
}> = ({ missingSuppliers, missingBahanBaku, onDismiss }) => (
  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-start justify-between">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Data Belum Lengkap
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Untuk pengalaman yang optimal, sebaiknya tambahkan:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              {missingSuppliers && (
                <li>
                  <a href="/supplier" className="text-yellow-800 underline hover:text-yellow-900">
                    Data Supplier
                  </a> - untuk mencatat pembelian dari vendor
                </li>
              )}
              {missingBahanBaku && (
                <li>
                  <a href="/gudang" className="text-yellow-800 underline hover:text-yellow-900">
                    Data Bahan Baku
                  </a> - untuk mengelola stok yang dibeli
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <button
          type="button"
          className="bg-yellow-50 rounded-md p-1.5 text-yellow-400 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
          onClick={onDismiss}
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

const PurchasePage: React.FC<PurchasePageProps> = ({ className = '' }) => {
  const { purchases, isLoading } = usePurchase();
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();
  
  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false);

  // 🔧 FIXED: Check for missing data but don't block access
  const missingSuppliers = !suppliers.length;
  const missingBahanBaku = !bahanBaku.length;
  const hasMissingData = missingSuppliers || missingBahanBaku;

  // Show initial warning
  useEffect(() => {
    if (hasMissingData && !hasShownInitialToast) {
      setShowDataWarning(true);
      setHasShownInitialToast(true);
      
      // Optional: Show toast notification
      if (missingSuppliers && missingBahanBaku) {
        toast.warning('Tambahkan data supplier dan bahan baku untuk fitur pembelian yang lengkap');
      } else if (missingSuppliers) {
        toast.warning('Tambahkan data supplier untuk mencatat pembelian dari vendor');
      } else if (missingBahanBaku) {
        toast.warning('Tambahkan data bahan baku untuk mengelola stok yang dibeli');
      }
    }
  }, [hasMissingData, missingSuppliers, missingBahanBaku, hasShownInitialToast]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!purchases.length) {
      return { total: 0, totalValue: 0, byStatus: { pending: 0, completed: 0, cancelled: 0 } };
    }
    return calculatePurchaseStats(purchases);
  }, [purchases]);

  // 🔧 FIXED: Enhanced handlers with data validation
  const handleAddPurchase = () => {
    // Soft validation with helpful guidance
    if (missingSuppliers && missingBahanBaku) {
      toast.error('Mohon tambahkan data supplier dan bahan baku terlebih dahulu');
      setShowDataWarning(true);
      return;
    }
    
    if (missingSuppliers) {
      toast.error('Mohon tambahkan data supplier terlebih dahulu');
      setShowDataWarning(true);
      return;
    }
    
    if (missingBahanBaku) {
      toast.warning('Data bahan baku kosong. Tambahkan bahan baku untuk hasil yang optimal');
      // Allow to continue but show warning
    }
    
    setEditingPurchase(null);
    setIsDialogOpen(true);
  };

  const handleEditPurchase = (purchase: any) => {
    setEditingPurchase(purchase);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPurchase(null);
  };

  const handleExport = () => {
    if (!purchases.length) {
      toast.info('Tidak ada data pembelian untuk di-export');
      return;
    }
    setShowExportDialog(true);
  };

  const handleDismissWarning = () => {
    setShowDataWarning(false);
  };

  return (
    <div className={`container mx-auto p-4 sm:p-8 ${className}`}>
      {/* 🔧 FIXED: Soft warning banner instead of blocking error */}
      {showDataWarning && hasMissingData && (
        <DataWarningBanner
          missingSuppliers={missingSuppliers}
          missingBahanBaku={missingBahanBaku}
          onDismiss={handleDismissWarning}
        />
      )}

      {/* Header */}
      <PurchaseHeader
        totalPurchases={stats.total}
        totalValue={stats.totalValue}
        pendingCount={stats.byStatus.pending}
        onAddPurchase={handleAddPurchase}
        onExport={handleExport}
      />

      {/* 🔧 FIXED: Always show content, regardless of missing data */}
      <PurchaseTableProvider purchases={purchases} suppliers={suppliers}>
        {/* Bulk Actions Toolbar */}
        <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg animate-pulse mb-6" />}>
          <BulkActionsToolbar />
        </Suspense>

        {/* Main Table */}
        <Suspense fallback={<LoadingPurchaseState />}>
          {isLoading ? (
            <LoadingPurchaseState />
          ) : (
            <PurchaseTable
              onEdit={handleEditPurchase}
            />
          )}
        </Suspense>

        {/* 🔧 FIXED: BulkDeleteDialog moved inside PurchaseTableProvider */}
        <Suspense fallback={null}>
          <BulkDeleteDialog />
        </Suspense>
      </PurchaseTableProvider>

      {/* 🔧 FIXED: PurchaseDialog stays outside - it doesn't need PurchaseTableProvider */}
      <Suspense fallback={null}>
        <PurchaseDialog
          isOpen={isDialogOpen}
          mode={editingPurchase ? 'edit' : 'create'}
          purchase={editingPurchase}
          suppliers={suppliers.length ? suppliers : []} // Safe empty array
          bahanBaku={bahanBaku.length ? bahanBaku : []} // Safe empty array
          onClose={handleCloseDialog}
        />
      </Suspense>

      {/* 🔧 FIXED: Empty state when no purchases but app is accessible */}
      {!isLoading && !purchases.length && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pembelian</h3>
            <p className="mt-1 text-sm text-gray-500">
              Mulai dengan membuat pembelian pertama dari supplier.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddPurchase}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Pembelian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePage;