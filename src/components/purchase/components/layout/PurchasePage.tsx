import React, { Suspense, useState } from 'react';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { PurchaseTableProvider } from '@/components/purchase/components/context/PurchaseTableContext';
import PurchaseHeader from './PurchaseHeader';
import LoadingPurchaseState from '@/components/purchase/components/states/LoadingPurchaseState';
import ErrorPurchaseState from '@/components/purchase/components/states/ErrorPurchaseState';
import { calculatePurchaseStats } from '@/components/purchase/components/utils/purchaseHelpers';

// Lazy load components
const PurchaseTable = React.lazy(() => import('../table/PurchaseTable'));
const BulkActionsToolbar = React.lazy(() => import('../table/BulkActionsToolbar'));
const PurchaseDialog = React.lazy(() => import('../forms/PurchaseDialog'));
const BulkDeleteDialog = React.lazy(() => import('../dialogs/BulkDeleteDialog'));

interface PurchasePageProps {
  className?: string;
}

const PurchasePage: React.FC<PurchasePageProps> = ({ className = '' }) => {
  const { purchases, isLoading } = usePurchase();
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!purchases.length) {
      return { total: 0, totalValue: 0, byStatus: { pending: 0, completed: 0, cancelled: 0 } };
    }
    return calculatePurchaseStats(purchases);
  }, [purchases]);

  // Handlers
  const handleAddPurchase = () => {
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
    setShowExportDialog(true);
  };

  // Error boundary fallback
  if (!suppliers.length || !bahanBaku.length) {
    return (
      <ErrorPurchaseState 
        title="Data Tidak Lengkap"
        message="Pastikan data supplier dan bahan baku sudah tersedia sebelum mengelola pembelian."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className={`container mx-auto p-4 sm:p-8 ${className}`}>
      {/* Header */}
      <PurchaseHeader
        totalPurchases={stats.total}
        totalValue={stats.totalValue}
        pendingCount={stats.byStatus.pending}
        onAddPurchase={handleAddPurchase}
        onExport={handleExport}
      />

      {/* Table Provider */}
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
      </PurchaseTableProvider>

      {/* Dialogs */}
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

      <Suspense fallback={null}>
        <BulkDeleteDialog />
      </Suspense>
    </div>
  );
};

export default PurchasePage;