// src/components/dialogs/BulkEditDialog.tsx
// ✏️ BULK EDIT DIALOG COMPONENT - Dialog for bulk status editing

import React from 'react';
import { Edit, X, Check, ArrowRight } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { orderStatusList, getStatusText, getStatusColor } from '../constants/orderConstants';
import type { Order } from '@/types/order';

export interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedOrderIds: string[];
  selectedOrders: Order[];
  bulkEditStatus: string;
  onStatusChange: (status: string) => void;
  loading?: boolean;
  maxPreviewItems?: number;
}

// 📋 Order Preview Item Component with Status Change
const OrderPreviewItem: React.FC<{
  order: Order;
  newStatus: string;
  compact?: boolean;
}> = ({ order, newStatus, compact }) => {
  const currentStatusText = getStatusText(order.status);
  const newStatusText = getStatusText(newStatus);
  const currentStatusColor = getStatusColor(order.status);
  const newStatusColor = getStatusColor(newStatus);
  
  const isStatusChanging = order.status !== newStatus && newStatus !== '';

  return (
    <li className="flex items-center gap-3 text-sm py-3 border-b border-gray-100 last:border-0">
      <Edit className="h-3 w-3 text-green-500 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            #{order.nomorPesanan || 'N/A'}
          </span>
          <Badge variant="outline" className="text-xs">
            {order.namaPelanggan || 'No Name'}
          </Badge>
        </div>
        
        {/* Status Change Preview */}
        {isStatusChanging ? (
          <div className="flex items-center gap-2 text-xs">
            <Badge 
              variant="outline" 
              className={cn("text-xs", currentStatusColor)}
            >
              {currentStatusText}
            </Badge>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <Badge 
              variant="outline" 
              className={cn("text-xs", newStatusColor)}
            >
              {newStatusText}
            </Badge>
          </div>
        ) : newStatus === '' ? (
          <div className="text-xs text-gray-500">
            Status: <span className={cn("font-medium", currentStatusColor)}>{currentStatusText}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Status tidak berubah:</span>
            <Badge variant="outline" className={cn("text-xs", currentStatusColor)}>
              {currentStatusText}
            </Badge>
          </div>
        )}
        
        {!compact && order.totalPesanan && (
          <div className="text-xs text-gray-400 mt-1">
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

// 📊 Edit Impact Summary
const EditImpactSummary: React.FC<{
  orders: Order[];
  newStatus: string;
}> = ({ orders, newStatus }) => {
  if (!newStatus || orders.length === 0) return null;

  const affectedOrders = orders.filter(order => order.status !== newStatus);
  const statusChangeSummary = affectedOrders.reduce((acc, order) => {
    const fromStatus = order.status;
    const key = `${fromStatus}->${newStatus}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = affectedOrders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

  return (
    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
      <h4 className="font-medium text-green-800 mb-2 text-sm">Ringkasan Perubahan:</h4>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-green-700">Pesanan terpengaruh:</span>
          <span className="font-semibold text-green-800">{affectedOrders.length} dari {orders.length}</span>
        </div>
        
        {totalValue > 0 && (
          <div className="flex justify-between">
            <span className="text-green-700">Total nilai terpengaruh:</span>
            <span className="font-semibold text-green-800">
              Rp {totalValue.toLocaleString('id-ID')}
            </span>
          </div>
        )}
        
        {Object.entries(statusChangeSummary).length > 0 && (
          <div>
            <span className="text-green-700">Perubahan status:</span>
            <div className="mt-1 space-y-1">
              {Object.entries(statusChangeSummary).map(([change, count]) => {
                const [from, to] = change.split('->');
                return (
                  <div key={change} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(from)}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(to)}
                    </Badge>
                    <span className="text-gray-600">({count} pesanan)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✏️ Main BulkEditDialog Component
export const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrderIds,
  selectedOrders,
  bulkEditStatus,
  onStatusChange,
  loading = false,
  maxPreviewItems = 5
}) => {
  const selectedCount = selectedOrderIds.length;
  const previewOrders = selectedOrders.slice(0, maxPreviewItems);
  const hasMoreItems = selectedOrders.length > maxPreviewItems;
  const remainingCount = selectedOrders.length - maxPreviewItems;

  // Check if any orders will actually change
  const ordersToChange = selectedOrders.filter(order => 
    bulkEditStatus && order.status !== bulkEditStatus
  );

  // 🎯 Handle Confirm with Loading State
  const handleConfirm = async () => {
    if (!bulkEditStatus) {
      return;
    }
    
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error during bulk edit:', error);
    }
  };

  // 🎯 Handle Status Change
  const handleStatusChange = (newStatus: string) => {
    onStatusChange(newStatus);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-500" />
              Edit Status Multiple Item
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Anda akan mengubah status <strong className="text-green-600">{selectedCount} item</strong> pesanan.
          </p>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          {/* Status Selector */}
          <div className="space-y-2">
            <Label htmlFor="bulk-status" className="font-medium text-gray-700">
              Status Baru *
            </Label>
            <Select value={bulkEditStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status baru..." />
              </SelectTrigger>
              <SelectContent>
                {orderStatusList.map((statusOption) => (
                  <SelectItem key={statusOption.key} value={statusOption.key}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", getStatusColor(statusOption.key))} />
                      {statusOption.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {bulkEditStatus && ordersToChange.length > 0 && (
              <p className="text-xs text-green-600">
                ✓ {ordersToChange.length} pesanan akan diubah statusnya
              </p>
            )}
            
            {bulkEditStatus && ordersToChange.length === 0 && (
              <p className="text-xs text-yellow-600">
                ⚠️ Tidak ada pesanan yang akan berubah dengan status ini
              </p>
            )}
          </div>

          {/* Orders Preview List */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-3">
              <h4 className="font-medium text-gray-700 mb-2 text-sm">
                Pesanan yang akan diubah:
              </h4>
              
              {previewOrders.length > 0 ? (
                <ul className="space-y-0 max-h-48 overflow-y-auto">
                  {previewOrders.map(order => (
                    <OrderPreviewItem
                      key={order.id}
                      order={order}
                      newStatus={bulkEditStatus}
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
          <EditImpactSummary orders={selectedOrders} newStatus={bulkEditStatus} />

          {/* Info Message */}
          {bulkEditStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">
                    Perubahan Status
                  </p>
                  <p className="text-blue-700">
                    Status pesanan akan diubah menjadi "
                    <span className="font-medium">{getStatusText(bulkEditStatus)}</span>".
                    Pastikan perubahan ini sesuai dengan kondisi pesanan.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex-shrink-0 pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !bulkEditStatus || ordersToChange.length === 0}
            className={cn(
              "bg-green-600 hover:bg-green-700 focus:ring-green-500",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Mengubah...
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Update {ordersToChange.length} Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;