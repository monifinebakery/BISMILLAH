// src/components/purchase/PurchasePage.tsx

import React, { Suspense, useState, useEffect } from 'react';
import { toast } from 'sonner';

// Context providers
import { PurchaseProvider, usePurchase } from './context/PurchaseContext';
import { PurchaseTableProvider } from './context/PurchaseTableContext';

// Hooks
import { usePurchaseStats } from './hooks/usePurchaseStats';
import { usePurchaseStatus } from './hooks/usePurchaseStatus';

// External contexts
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';

// Types
import { PurchaseStatus } from './types/purchase.types';

// Components - Immediate load (critical)
import {
  LoadingState,
  EmptyState,
  DataWarningBanner,
  PurchaseHeader,
} from './components';

// Components - Lazy load (non-critical)
const PurchaseTable = React.lazy(() => import('./components/PurchaseTable'));
const BulkActionsToolbar = React.lazy(() => import('./components/BulkActionsToolbar'));
const PurchaseDialog = React.lazy(() => import('./components/PurchaseDialog'));
const BulkDeleteDialog = React.lazy(() => import('./components/BulkDeleteDialog'));

// Utils
import { exportPurchasesToCSV } from './utils/purchaseHelpers';

interface PurchasePageProps {
  className?: string;
}

// Inner component that uses purchase context
const PurchasePageContent: React.FC<PurchasePageProps> = ({ className = '' }) => {
  // Purchase data from context
  const { 
    purchases, 
    isLoading, 
    error, 
    updatePurchase, 
    deletePurchase 
  } = usePurchase();
  
  // External data
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();
  
  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false);
  const [detailPurchase, setDetailPurchase] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Calculate stats
  const { stats } = usePurchaseStats(purchases);

  // Status management hook with warehouse integration
  const { updateStatus, isUpdatingPurchase, validateStatusChange } = usePurchaseStatus({
    purchases,
    onStatusUpdate: async (purchaseId: string, newStatus: PurchaseStatus) => {
      try {
        // Find the purchase to update
        const purchase = purchases.find(p => p.id === purchaseId);
        if (!purchase) {
          throw new Error('Purchase not found');
        }

        // Update the purchase with new status
        const updatedPurchase = { ...purchase, status: newStatus };
        const success = await updatePurchase(purchaseId, updatedPurchase);
        
        return success;
      } catch (error) {
        console.error('Error updating purchase status:', error);
        throw error;
      }
    },
    onSuccess: (message) => {
      toast.success(message);
    },
    onError: (error) => {
      toast.error(error);
    },
    enableWarehouseIntegration: true,
    enableDebugLogs: process.env.NODE_ENV === 'development'
  });

  // Check for missing data
  const missingSuppliers = !suppliers.length;
  const missingBahanBaku = !bahanBaku.length;
  const hasMissingData = missingSuppliers || missingBahanBaku;
  const canCreatePurchase = !missingSuppliers && !missingBahanBaku;

  // Show initial warning for missing data
  useEffect(() => {
    if (hasMissingData && !hasShownInitialToast) {
      setShowDataWarning(true);
      setHasShownInitialToast(true);
      
      // Show appropriate toast
      if (missingSuppliers && missingBahanBaku) {
        toast.warning('Tambahkan data supplier dan bahan baku untuk fitur pembelian yang lengkap');
      } else if (missingSuppliers) {
        toast.warning('Tambahkan data supplier untuk mencatat pembelian dari vendor');
      } else if (missingBahanBaku) {
        toast.warning('Tambahkan data bahan baku untuk mengelola stok yang dibeli');
      }
    }
  }, [hasMissingData, missingSuppliers, missingBahanBaku, hasShownInitialToast]);

  // Handlers
  const handleAddPurchase = () => {
    // Validate prerequisites
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
    // Check if purchase can be edited based on status
    if (purchase.status === 'completed') {
      toast.error('Pembelian yang sudah selesai tidak dapat diedit');
      return;
    }

    setEditingPurchase(purchase);
    setIsDialogOpen(true);
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    try {
      // Find the purchase to check if it can be deleted
      const purchase = purchases.find(p => p.id === purchaseId);
      if (!purchase) {
        toast.error('Pembelian tidak ditemukan');
        return;
      }

      if (purchase.status === 'completed') {
        toast.error('Pembelian yang sudah selesai tidak dapat dihapus');
        return;
      }

      const success = await deletePurchase(purchaseId);
      if (success) {
        toast.success('Pembelian berhasil dihapus');
      } else {
        toast.error('Gagal menghapus pembelian');
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Terjadi kesalahan saat menghapus pembelian');
    }
  };

  const handleViewDetails = (purchase: any) => {
    setDetailPurchase(purchase);
    setIsDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPurchase(null);
  };

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setDetailPurchase(null);
  };

  const handleExport = () => {
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
      
      toast.success('Data pembelian berhasil di-export');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export data pembelian');
    }
  };

  const handleSettings = () => {
    toast.info('Pengaturan pembelian akan segera tersedia');
  };

  const handleDismissWarning = () => {
    setShowDataWarning(false);
  };

  // Error state
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

  // Loading state
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
      {showDataWarning && hasMissingData && (
        <DataWarningBanner
          missingSuppliers={missingSuppliers}
          missingBahanBaku={missingBahanBaku}
          onDismiss={handleDismissWarning}
        />
      )}

      {/* Header with stats */}
      <PurchaseHeader
        totalPurchases={stats.total}
        totalValue={stats.totalValue}
        pendingCount={stats.byStatus.pending}
        onAddPurchase={handleAddPurchase}
        onExport={handleExport}
        onSettings={handleSettings}
        className="mb-8"
      />

      {/* Main content */}
      {!purchases.length ? (
        // Empty state when no purchases
        <EmptyState
          onAddPurchase={handleAddPurchase}
          hasSuppliers={!missingSuppliers}
          hasBahanBaku={!missingBahanBaku}
        />
      ) : (
        // Table with data
        <PurchaseTableProvider purchases={purchases} suppliers={suppliers}>
          {/* Bulk Actions Toolbar */}
          <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg animate-pulse mb-6" />}>
            <BulkActionsToolbar />
          </Suspense>

          {/* Main Table with Status Dropdown */}
          <Suspense fallback={<LoadingState />}>
            <PurchaseTable 
              onEdit={handleEditPurchase}
              onStatusChange={updateStatus}
              onDelete={handleDeletePurchase}
              onViewDetails={handleViewDetails}
              validateStatusChange={validateStatusChange}
            />
          </Suspense>

          {/* Bulk Delete Dialog */}
          <Suspense fallback={null}>
            <BulkDeleteDialog />
          </Suspense>
        </PurchaseTableProvider>
      )}

      {/* Purchase Dialog - Outside table provider */}
      <Suspense fallback={null}>
        <PurchaseDialog
          isOpen={isDialogOpen}
          mode={editingPurchase ? 'edit' : 'create'}
          purchase={editingPurchase}
          suppliers={suppliers}
          bahanBaku={bahanBaku}
          onClose={handleCloseDialog}
        />
      </Suspense>

      {/* Purchase Detail Dialog - Optional, if you want to implement detail view */}
      {detailPurchase && (
        <Suspense fallback={null}>
          <PurchaseDetailDialog
            isOpen={isDetailDialogOpen}
            purchase={detailPurchase}
            suppliers={suppliers}
            bahanBaku={bahanBaku}
            onClose={handleCloseDetailDialog}
          />
        </Suspense>
      )}

      {/* Loading overlay for status updates */}
      {Object.keys(purchases).some(id => isUpdatingPurchase(id)) && (
        <div className="fixed inset-0 bg-black bg-opacity-10 z-40 pointer-events-none">
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm text-gray-700">Mengupdate status...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component with context provider
const PurchasePage: React.FC<PurchasePageProps> = ({ className }) => {
  return (
    <PurchaseProvider>
      <PurchasePageContent className={className} />
    </PurchaseProvider>
  );
};

export default PurchasePage;