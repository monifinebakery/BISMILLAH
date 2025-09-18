// src/components/invoice/templates/ClassicTemplate.tsx
import React from 'react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency } from '@/lib/shared';
import { formatDateForInvoice } from '../utils';
import type { OrderData } from '../types';

interface ClassicTemplateProps {
  order: OrderData;
  className?: string;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ order, className = '' }) => {
  const { settings } = useUserSettings();
  
  return (
    <div className={`bg-white border-2 border-gray-800 max-w-4xl mx-auto ${className}`} id="classic-invoice">
      {/* Header */}
      <div className="border-b-2 border-gray-800 p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {settings.businessName || 'NAMA BISNIS ANDA'}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{settings.address || 'Alamat Bisnis Anda'}</p>
              <p>{settings.phone || 'Telepon'} | {settings.email || 'Email'}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">INVOICE</h2>
            <div className="text-sm">
              <p><strong>No:</strong> {order.order_number}</p>
              <p><strong>Tanggal:</strong> {formatDateForInvoice(new Date(order.order_date || new Date()))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-8 border-b border-gray-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4">DITAGIHKAN KEPADA:</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-bold text-lg">{order.customer_name}</p>
            <p className="text-gray-600 mt-2">{order.customer_address}</p>
          </div>
          <div className="text-sm">
            <p><strong>Tel:</strong> {order.customer_phone}</p>
            <p><strong>Email:</strong> {order.customer_email}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-8">
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-800 p-3 text-left">DESKRIPSI</th>
              <th className="border border-gray-800 p-3 text-center w-20">QTY</th>
              <th className="border border-gray-800 p-3 text-right w-32">HARGA</th>
              <th className="border border-gray-800 p-3 text-right w-32">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-800 p-3">{item.item_name}</td>
                <td className="border border-gray-800 p-3 text-center font-mono">{item.quantity}</td>
                <td className="border border-gray-800 p-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                <td className="border border-gray-800 p-3 text-right font-mono font-bold">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-80">
            <div className="border border-gray-800">
              <div className="flex justify-between p-3 border-b border-gray-300">
                <span>SUBTOTAL:</span>
                <span className="font-mono">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.tax_amount && order.tax_amount > 0 && (
                <div className="flex justify-between p-3 border-b border-gray-300">
                  <span>PAJAK:</span>
                  <span className="font-mono">{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between p-4 bg-gray-800 text-white text-xl font-bold">
                <span>TOTAL:</span>
                <span className="font-mono">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 p-8 text-center">
        <p className="text-lg font-semibold">TERIMA KASIH ATAS KEPERCAYAAN ANDA</p>
      </div>
    </div>
  );
};