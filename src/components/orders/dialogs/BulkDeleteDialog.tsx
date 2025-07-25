// src/components/dialogs/BulkDeleteDialog.tsx
// 🗑️ BULK DELETE DIALOG COMPONENT - Confirmation dialog for bulk deletion

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Order } from '../types/order';

export interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedOrderIds: string[];
  selectedOrders: Order[];
  loading?: boolean;
  maxPreviewItems?: number;
}

// 📋 Order Preview Item Component
const OrderPreviewItem: React.FC<{
  order: Order;
  compact?: boolean;
}> = ({ order, compact }) => {
  return (
    <li className="flex items-center gap-2 text-sm py-2 border-b border-gray-100 last:border-0">
      <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            #{order.nomorPesanan || 'N/A'}
          </span>
          <Badge variant="outline" className="text-xs">
            {order.namaPelanggan || 'No Name'}
          </Badge>
        </div>
        {!compact && order.totalPesanan && (
          <div className="text-xs text-gray-500 mt-1">
            Total: Rp {order.totalPesanan.toLocaleString('id-ID')}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-400">
        {order.tanggal ? new Date(order.tanggal).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short'
        }) : '-'}
      </div>
    </li>
  );
};

// 📊 Deletion Impact Summary
const DeletionImpactSummary: React.FC<{
  orders: Order[];
}> = ({ orders }) => {
  const totalValue = orders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (orders.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
      <h4 className="font-medium text-red-800 mb-2 text-sm">Dampak Penghapusan:</h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-red-700">Total Nilai:</span>
          <div className="font-semibold text-red-800">
            Rp {totalValue.toLocaleString('id-ID')}
          </div>
        </div>
        <div>
          <span className="text-red-700">Status Pesanan:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="text-xs">
                {status}: {count}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🗑️ Main BulkDeleteDialog Component
export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrderIds,
  selectedOrders,
  loading = false,
  maxPreviewItems = 5
}) => {
  const selectedCount = selectedOrderIds.length;
  const previewOrders = selectedOrders.slice(0, maxPreviewItems);
  const hasMoreItems = selectedOrders.length > maxPreviewItems;
  const remainingCount = selectedOrders.length - maxPreviewItems;

  // 🎯 Handle Confirm with Loading State
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error during bulk delete:', error);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <AlertDialogHeader className="flex-shrink-0">
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Konfirmasi Hapus Multiple Item
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p className="text-gray-600 mb-3">
                Anda akan menghapus <strong className="text-red-600">{selectedCount} item</strong> pesanan:
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Orders Preview List */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-3">
              <h4 className="font-medium text-gray-700 mb-2 text-sm">
                Pesanan yang akan dihapus:
              </h4>
              
              {previewOrders.length > 0 ? (
                <ul className="space-y-0 max-h-40 overflow-y-auto">
                  {previewOrders.map(order => (
                    <OrderPreviewItem
                      key={order.id}
                      order={order}
                      compact={selectedCount > 10}
                    />
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Tidak ada data pesanan untuk ditampilkan
                </div>
              )}
              
              {/* Show More Indicator */}
              {hasMoreItems && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center italic">
                    ... dan {remainingCount} pesanan lainnya
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Impact Summary */}
          <DeletionImpactSummary orders={selectedOrders} />

          {/* Warning Message */}
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 mb-1">
                  ⚠️ Peringatan Penting!
                </p>
                <p className="text-red-700">
                  Tindakan ini akan menghapus pesanan secara permanen dan tidak dapat dibatalkan. 
                  Pastikan Anda telah mempertimbangkan dampaknya.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <AlertDialogFooter className="flex-shrink-0 pt-4 border-t border-gray-200">
          <AlertDialogCancel disabled={loading} className="mr-2">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "bg-red-600 hover:bg-red-700 focus:ring-red-500",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus {selectedCount} Item
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8 hover:bg-gray-100"
          onClick={onClose}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkDeleteDialog;