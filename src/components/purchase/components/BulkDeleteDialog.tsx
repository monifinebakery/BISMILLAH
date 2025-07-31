// src/components/purchase/components/BulkDeleteDialog.tsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, Info } from 'lucide-react';
import { usePurchaseTable } from '../context/PurchaseTableContext';
import { formatCurrency } from '@/utils/formatUtils';
import { getStatusColor, getStatusDisplayText } from '../utils/purchaseHelpers';

const BulkDeleteDialog: React.FC = () => {
  const {
    selectedItems,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    bulkDelete,
    isBulkDeleting,
    filteredPurchases,
    getSupplierName,
  } = usePurchaseTable();

  // Get selected purchase details
  const selectedPurchases = filteredPurchases.filter(p => selectedItems.includes(p.id));
  const totalValue = selectedPurchases.reduce((sum, p) => sum + p.totalNilai, 0);
  const statusCounts = selectedPurchases.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasCompletedPurchases = selectedPurchases.some(p => p.status === 'completed');
  const canDelete = selectedPurchases.every(p => p.status !== 'completed');

  const handleConfirmDelete = async () => {
    await bulkDelete();
  };

  const handleCancel = () => {
    setShowBulkDeleteDialog(false);
  };

  if (!showBulkDeleteDialog) {
    return null;
  }

  return (
    <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Konfirmasi Hapus Massal
          </DialogTitle>
          <DialogDescription>
            Anda akan menghapus {selectedItems.length} pembelian. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning for completed purchases */}
          {hasCompletedPurchases && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Peringatan:</strong> Beberapa pembelian sudah berstatus "Selesai" dan tidak bisa dihapus. 
                Hanya pembelian dengan status "Pending" atau "Dibatalkan" yang akan dihapus.
              </AlertDescription>
            </Alert>
          )}

          {/* Summary info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Ringkasan Pembelian yang Akan Dihapus:</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Total Pembelian</div>
                <div className="text-lg font-semibold">{selectedItems.length} transaksi</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Nilai</div>
                <div className="text-lg font-semibold">{formatCurrency(totalValue)}</div>
              </div>
            </div>

            {/* Status breakdown */}
            <div>
              <div className="text-sm text-gray-600 mb-2">Status Pembelian:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Badge 
                    key={status} 
                    variant="outline" 
                    className={getStatusColor(status as any)}
                  >
                    {getStatusDisplayText(status as any)}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* List of purchases (max 5 shown) */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Pembelian yang Akan Dihapus:
            </h4>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {selectedPurchases.slice(0, 5).map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="flex items-center justify-between p-3 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {getSupplierName(purchase.supplier)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(purchase.tanggal).toLocaleDateString('id-ID')} • 
                      {formatCurrency(purchase.totalNilai)}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(purchase.status)} text-xs`}
                  >
                    {getStatusDisplayText(purchase.status)}
                  </Badge>
                </div>
              ))}
              
              {selectedPurchases.length > 5 && (
                <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                  ... dan {selectedPurchases.length - 5} pembelian lainnya
                </div>
              )}
            </div>
          </div>

          {/* Additional info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Data pembelian yang dihapus akan hilang permanen dari sistem. 
              Pastikan Anda sudah membackup data jika diperlukan.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isBulkDeleting}
          >
            Batal
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isBulkDeleting || !canDelete}
            className="min-w-[120px]"
          >
            {isBulkDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus {canDelete ? selectedItems.length : selectedPurchases.filter(p => p.status !== 'completed').length} Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDeleteDialog;