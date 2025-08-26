// src/components/purchase/components/BulkActionsBar.tsx
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, CheckCircle, Clock, XCircle, Trash2, X, Settings } from 'lucide-react';
import { usePurchaseTable } from '../context/PurchaseTableContext';
import BulkEditDialog from './BulkEditDialog';
import type { PurchaseStatus } from '../types/purchase.types';
import { formatCurrency } from '@/utils/formatUtils';

const BulkActionsBar: React.FC = () => {
  const {
    selectedItems,
    filteredPurchases,
    isAllSelected,
    selectAll,
    clearSelection,
    bulkUpdateStatus,
    setShowBulkDeleteDialog,
    isBulkDeleting,
  } = usePurchaseTable();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);

  if (selectedItems.length === 0) return null;

  const selectedPurchases = useMemo(() => (
    filteredPurchases.filter(p => selectedItems.includes(p.id))
  ), [filteredPurchases, selectedItems]);

  const totalSelectedAmount = useMemo(() => (
    selectedPurchases.reduce((sum, p) => sum + Number(p.totalNilai || 0), 0)
  ), [selectedPurchases]);

  const handleStatus = async (status: PurchaseStatus) => {
    try {
      setIsProcessing(true);
      await bulkUpdateStatus(status);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: selection and summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? clearSelection : selectAll}
              className="h-8 w-8 p-0"
              disabled={isProcessing || isBulkDeleting}
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-orange-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
            </Button>
            <span className="font-medium text-orange-900 text-sm sm:text-base">
              {selectedItems.length} dari {filteredPurchases.length} pembelian dipilih
            </span>
          </div>

          <Badge variant="secondary" className="bg-orange-100 text-orange-800 w-fit">
            Total: {formatCurrency(totalSelectedAmount)}
          </Badge>
        </div>

        {/* Right: actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => handleStatus('completed')}
            disabled={isProcessing || isBulkDeleting}
          >
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            <span className="hidden sm:inline">Selesaikan</span>
            <span className="sm:hidden">Selesai</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => handleStatus('pending')}
            disabled={isProcessing || isBulkDeleting}
          >
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
            Pending
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => handleStatus('cancelled')}
            disabled={isProcessing || isBulkDeleting}
          >
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            <span className="hidden sm:inline">Batalkan</span>
            <span className="sm:hidden">Batal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => setShowBulkEditDialog(true)}
            disabled={isProcessing || isBulkDeleting}
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden">Edit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => setShowBulkDeleteDialog(true)}
            disabled={isProcessing || isBulkDeleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Hapus</span>
            <span className="sm:hidden">Hapus</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 text-xs sm:text-sm h-8 sm:h-9"
            onClick={clearSelection}
            disabled={isProcessing || isBulkDeleting}
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Optional: tip for large selections */}
      {selectedItems.length > 5 && (
        <div className="px-4 pb-3 text-xs text-orange-700">
          💡 Tip: Operasi bulk pada {selectedItems.length} item mungkin membutuhkan waktu beberapa detik
        </div>
      )}
    </Card>

    <BulkEditDialog
      isOpen={showBulkEditDialog}
      onClose={() => setShowBulkEditDialog(false)}
    />
    </>
  );
};

export default BulkActionsBar;

