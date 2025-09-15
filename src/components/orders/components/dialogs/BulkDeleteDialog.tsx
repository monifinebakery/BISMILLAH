// 🎯 120 lines - Bulk delete dialog dengan logika asli
import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';
import type { Order } from '../../types';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  selectedOrders: Order[];
  selectedCount: number;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrders,
  selectedCount
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      logger.error('Error in bulk delete:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total value dari pesanan yang akan dihapus
  const totalValue = selectedOrders.reduce((sum, order: any) => sum + (order.total_pesanan ?? order.totalAmount ?? 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent centerMode="overlay" size="lg">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Pesanan
            </DialogTitle>
            <DialogDescription className="text-base">
              Anda akan menghapus <strong>{selectedCount} pesanan</strong> secara permanen. 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-body space-y-4">
          {/* Summary Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-800">Ringkasan Penghapusan</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Jumlah pesanan:</span>
                <span className="font-semibold">{selectedCount} pesanan</span>
              </div>
              <div className="flex justify-between">
                <span>Total nilai pesanan:</span>
                <span className="font-semibold">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Order List Preview */}
          {selectedOrders.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Pesanan yang akan dihapus:</span>
              </div>
              <div className="divide-y">
                {selectedOrders.slice(0, 10).map((order: any) => (
                  <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">#{order.nomor_pesanan || order.order_number || order.orderNumber}</div>
                      <div className="text-sm text-gray-600">{order.nama_pelanggan || order.customer_name || order.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {formatDateForDisplay(order.tanggal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(order.total_pesanan ?? order.totalAmount ?? 0)}</div>
                      <div className="text-xs text-gray-500 capitalize">{order.status}</div>
                    </div>
                  </div>
                ))}
                {selectedCount > 10 && (
                  <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
                    ... dan {selectedCount - 10} pesanan lainnya
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <div className="font-semibold mb-1">Peringatan:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Data pesanan akan dihapus secara permanen</li>
                  <li>Riwayat transaksi terkait akan hilang</li>
                  <li>Tindakan ini tidak dapat dibatalkan</li>
                  <li>Pastikan Anda sudah membuat backup jika diperlukan</li>
                </ul>
              </div>
            </div>
          </div>
          </div>

          <DialogFooter className="dialog-footer-pad">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="min-w-[100px]"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
              className="min-w-[120px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {loading ? 'Menghapus...' : 'Ya, Hapus Semua'}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDeleteDialog;
