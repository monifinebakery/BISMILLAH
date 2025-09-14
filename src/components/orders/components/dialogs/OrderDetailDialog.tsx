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
    orderNumber: order.orderNumber,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header">
            <DialogTitle>Detail Pesanan #{order.orderNumber}</DialogTitle>
          </DialogHeader>
          
          <div className="dialog-body">
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Informasi Pelanggan</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Nama</p>
                      <p className="text-base font-medium">{order.customerName}</p>
                    </div>
                    {order.customerPhone && (
                      <div>
                        <p className="text-sm text-gray-600">Telepon</p>
                        <p className="text-base font-medium">{order.customerPhone}</p>
                      </div>
                    )}
                    {order.customerEmail && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-base font-medium">{order.customerEmail}</p>
                      </div>
                    )}
                    {order.alamatPengiriman && (
                      <div>
                        <p className="text-sm text-gray-600">Alamat Pengiriman</p>
                        <p className="text-base font-medium">{order.alamatPengiriman}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Order Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Informasi Pesanan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                      <p className="text-base font-medium">{formatDateForDisplay(order.tanggal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-base font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(order.status)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {order.items?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Item Pesanan</h3>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price || 0)}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.total || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(order.subtotal || 0)}</span>
                    </div>
                    {order.pajak > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pajak</span>
                        <span className="font-medium">{formatCurrency(order.pajak)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {order.catatan && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Catatan</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{order.catatan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;

