import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { usePurchaseTable } from '../../context/PurchaseTableContext';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useSupplier } from '@/contexts/SupplierContext';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { formatCurrency } from '@/utils/formatUtils';
import { getSupplierName } from '../../services/purchaseTransformers';

interface BulkDeleteDialogProps {
  className?: string;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({ className = '' }) => {
  const { suppliers } = useSupplier();
  const {
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    selectedPurchaseIds,
    currentItems,
    setSelectedPurchaseIds,
    setIsSelectionMode,
  } = usePurchaseTable();

  const { bulkDelete, selectedSummary, isLoading } = useBulkOperations({
    purchases: currentItems,
    suppliers,
    selectedIds: selectedPurchaseIds,
    onSuccess: () => {
      setShowBulkDeleteDialog(false);
      setSelectedPurchaseIds([]);
      setIsSelectionMode(false);
    },
  });

  const handleConfirmDelete = async () => {
    await bulkDelete();
  };

  const handleCancel = () => {
    setShowBulkDeleteDialog(false);
  };

  // Get selected purchases for preview
  const selectedPurchases = currentItems.filter(p => selectedPurchaseIds.includes(p.id));
  const previewCount = Math.min(selectedPurchases.length, 5);
  const remainingCount = selectedPurchases.length - previewCount;

  return (
    <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
      <AlertDialogContent className={`max-w-2xl ${className}`}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Konfirmasi Hapus Multiple Item
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Anda akan menghapus <strong>{selectedPurchaseIds.length} item</strong> pembelian 
                dengan total nilai <strong>{formatCurrency(selectedSummary.totalValue)}</strong>.
              </p>

              {/* Preview List */}
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h4 className="font-medium text-gray-800 mb-3">Item yang akan dihapus:</h4>
                <ul className="space-y-2">
                  {selectedPurchases.slice(0, previewCount).map(purchase => (
                    <li key={purchase.id} className="flex items-center gap-3 text-sm bg-white rounded p-2 border">
                      <Trash2 className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">
                            {formatDateForDisplay(purchase.tanggal)}
                          </span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(purchase.totalNilai)}
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs">
                          {getSupplierName(purchase.supplier, suppliers)}
                          {purchase.items && purchase.items.length > 0 && (
                            <span className="ml-2">• {purchase.items.length} item{purchase.items.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  {remainingCount > 0 && (
                    <li className="text-sm text-gray-500 italic text-center py-2">
                      ... dan {remainingCount} item lainnya
                    </li>
                  )}
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Item:</span>
                    <span className="font-semibold ml-2">{selectedPurchaseIds.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Nilai:</span>
                    <span className="font-semibold ml-2 text-red-600">
                      {formatCurrency(selectedSummary.totalValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Suppliers:</span>
                    <span className="font-semibold ml-2">{selectedSummary.suppliers.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rata-rata:</span>
                    <span className="font-semibold ml-2">
                      {formatCurrency(selectedSummary.totalValue / selectedPurchaseIds.length)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Peringatan:</p>
                    <ul className="text-yellow-700 space-y-1">
                      <li>• Tindakan ini tidak dapat dibatalkan</li>
                      <li>• Data pembelian akan dihapus permanen</li>
                      <li>• Riwayat transaksi akan hilang</li>
                      <li>• Pastikan Anda telah membuat backup jika diperlukan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus {selectedPurchaseIds.length} Item
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkDeleteDialog;