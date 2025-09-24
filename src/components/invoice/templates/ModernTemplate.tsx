// src/components/invoice/templates/ModernTemplate.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { useUserSettings } from '@/contexts/UserSettingsContext';

import { formatDateForInvoice } from '../utils';
import type { OrderData } from '../types';

interface ModernTemplateProps {
  order: OrderData;
  className?: string;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ order, className = '' }) => {
  const { formatCurrency } = useCurrency();  const { settings } = useUserSettings();
  
  return (
    <div className={`bg-white rounded-xl overflow-hidden max-w-5xl mx-auto border border-gray-200 ${className}`} id="invoice-to-print">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 sm:px-12 py-8 text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">
              {settings.businessName || 'Nama Bisnis Anda'}
            </h1>
            <div className="space-y-1 text-blue-100">
              <p className="text-sm">{settings.address || 'Alamat Bisnis Anda'}</p>
              <p className="text-sm">{settings.phone || 'Telepon Bisnis Anda'}</p>
              <p className="text-sm">{settings.email || 'Email Bisnis Anda'}</p>
            </div>
          </div>
          
          <div className="flex-shrink-0 text-right lg:text-right">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 uppercase tracking-wide">
                Invoice
              </h2>
              <div className="space-y-1 text-blue-100">
                <p className="text-sm"><span className="font-medium">No:</span> {order.order_number}</p>
                <p className="text-sm"><span className="font-medium">Tanggal:</span> {formatDateForInvoice(new Date(order.order_date || new Date()))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 sm:px-12 py-8">
        {/* Customer Information */}
        <div className="mb-10">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4 text-lg border-b border-gray-200 pb-2">
              Ditagihkan Kepada:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-800 text-lg mb-2">{order.customer_name}</p>
                <p className="text-gray-600 leading-relaxed">{order.customer_address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-600">
                  <span className="font-medium">Telepon:</span> {order.customer_phone}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {order.customer_email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <h3 className="font-semibold text-gray-700 mb-4 text-lg">Detail Pesanan:</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    Deskripsi
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 w-24">
                    Jumlah
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 border-b border-gray-200 w-32">
                    Harga Satuan
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 border-b border-gray-200 w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 font-mono">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 font-mono">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-800 font-mono font-semibold">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-10">
          <div className="w-full max-w-md">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-gray-600">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-mono text-right">{formatCurrency(order.subtotal)}</span>
                </div>
                
                {order.tax_amount && order.tax_amount > 0 && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="font-medium">Pajak</span>
                    <span className="font-mono text-right">{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-300 my-4"></div>
                
                <div className="flex justify-between items-center text-xl font-bold text-gray-800 bg-white rounded-lg p-4 border-2 border-blue-200">
                  <span>Total</span>
                  <span className="font-mono text-blue-600">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Terima kasih atas pesanan Anda!
            </h4>
            <p className="text-gray-600 max-w-md mx-auto">
              Invoice ini telah dibuat secara otomatis. Jika ada pertanyaan, silakan hubungi kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};