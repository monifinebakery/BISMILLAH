import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { getStatusText } from '../../constants';
import type { Order } from '../../types';
import { logger } from '@/utils/logger';

interface OrderDetailDialogProps {
  open: boolean;
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailDialog: React.FC<OrderDetailDialogProps> = ({ open, order, onOpenChange }) => {
  if (!order) return null;

  logger.component('OrderDetailDialog', 'Rendering detail dialog', {
    orderId: order.id,
    nomorPesanan: order.nomorPesanan,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Pesanan #{order.nomorPesanan}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Pelanggan</p>
            <p className="text-base font-medium">{order.namaPelanggan}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tanggal Pesanan</p>
              <p className="text-base font-medium">{formatDateForDisplay(order.tanggal)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-base font-medium">{getStatusText(order.status)}</p>
            </div>
          </div>
          {order.items?.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Item</p>
              <ul className="space-y-1">
                {order.items.map((item, index) => (
                  <li key={index} className="text-sm flex justify-between">
                    <span>{item.namaMenu} x{item.jumlah}</span>
                    <span>{formatCurrency(item.hargaTotal || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-between pt-4 border-t">
            <span className="font-medium">Total</span>
            <span className="font-semibold">{formatCurrency(order.totalPesanan)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;

