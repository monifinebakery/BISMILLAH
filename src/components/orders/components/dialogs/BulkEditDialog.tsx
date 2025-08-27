// 🎯 100 lines - Bulk edit dialog dengan logika asli
import React, { useState } from 'react';
import { Edit, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { ORDER_STATUSES, getStatusText, getStatusColor } from '../../constants';
import { logger } from '@/utils/logger';
import type { Order, OrderStatus } from '../../types';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: OrderStatus) => Promise<void>;
  selectedOrders: Order[];
  selectedCount: number;
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrders,
  selectedCount
}) => {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  const handleConfirm = async () => {
    if (!newStatus) return;
    
    setLoading(true);
    try {
      await onConfirm(newStatus as OrderStatus);
      onClose();
      setNewStatus(''); // Reset
    } catch (error) {
      logger.error('Error in bulk edit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setNewStatus(''); // Reset on close
  };

  // Calculate total value
  const totalValue = selectedOrders.reduce((sum, order) => sum + order.totalPesanan, 0);

  // Group orders by current status
  const statusGroups = selectedOrders.reduce((groups, order) => {
    if (!groups[order.status]) {
      groups[order.status] = [];
    }
    groups[order.status].push(order);
    return groups;
  }, {} as Record<string, Order[]>);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dialog-overlay-center">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Status Massal
            </DialogTitle>
            <DialogDescription>
              Mengubah status untuk <strong>{selectedCount} pesanan</strong> sekaligus.
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-body">
            <div className="space-y-4">
          {/* Summary Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Ringkasan Edit</span>
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

          {/* Current Status Distribution */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status Saat Ini:</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusGroups).map(([status, orders]) => (
                <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status as OrderStatus)}`}>
                    {getStatusText(status as OrderStatus)}
                  </span>
                  <span className="text-sm font-medium">{orders.length} pesanan</span>
                </div>
              ))}
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="newStatus">Status Baru: *</Label>
            <Select value={newStatus} onValueChange={(value: OrderStatus) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status baru..." />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full
                        ${status === 'pending' ? 'bg-yellow-400' : ''}
                        ${status === 'confirmed' ? 'bg-blue-400' : ''}
                        ${status === 'preparing' ? 'bg-purple-400' : ''}
                        ${status === 'ready' ? 'bg-indigo-400' : ''}
                        ${status === 'delivered' ? 'bg-green-400' : ''}
                        ${status === 'cancelled' ? 'bg-red-400' : ''}
                        ${status === 'completed' ? 'bg-emerald-400' : ''}
                      `} />
                      <span>{getStatusText(status)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Changes */}
          {newStatus && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-800">Preview Perubahan</span>
              </div>
              <div className="text-sm text-green-700">
                <strong>{selectedCount} pesanan</strong> akan diubah statusnya menjadi{' '}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(newStatus as OrderStatus)}`}>
                  {getStatusText(newStatus as OrderStatus)}
                </span>
              </div>
            </div>
          )}

          {/* Order List Preview (first 5 items) */}
          {selectedOrders.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <span className="text-sm font-medium text-gray-700">
                  Pesanan yang akan diubah:
                </span>
              </div>
              <div className="divide-y">
                {selectedOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="px-4 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">#{order.nomorPesanan}</div>
                      <div className="text-xs text-gray-600">{order.namaPelanggan}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {selectedCount > 5 && (
                  <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50">
                    ... dan {selectedCount - 5} pesanan lainnya
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          </div>

          <DialogFooter className="dialog-footer-pad">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="min-w-[100px]"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !newStatus}
              className="min-w-[120px]"
            >
              <Check className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;