import React from 'react';
import { Order } from '@/types';
import { useUserSettings } from '@/Contexts/UserSettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface InvoiceTemplateProps {
  order: Order;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order }) => {
  const { settings } = useUserSettings();

  return (
    <div className="bg-white p-8 sm:p-12 rounded-lg shadow-lg max-w-4xl mx-auto border" id="invoice-to-print">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{settings.businessName || 'Nama Bisnis Anda'}</h1>
          <p className="text-sm text-gray-500">{settings.address || 'Alamat Bisnis Anda'}</p>
          <p className="text-sm text-gray-500">{settings.phone || 'Telepon Bisnis Anda'}</p>
          <p className="text-sm text-gray-500">{settings.email || 'Email Bisnis Anda'}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-semibold text-gray-700 uppercase">Invoice</h2>
          <p className="text-sm text-gray-500 mt-2">No: {order.nomorPesanan}</p>
          <p className="text-sm text-gray-500">Tanggal: {formatDateForDisplay(order.tanggal)}</p>
        </div>
      </div>

      {/* Informasi Pelanggan */}
      <div className="mb-10">
        <h3 className="font-semibold text-gray-600 mb-2">Ditagihkan Kepada:</h3>
        <p className="font-bold text-gray-800">{order.namaPelanggan}</p>
        <p className="text-sm text-gray-500">{order.alamatPelanggan}</p>
        <p className="text-sm text-gray-500">{order.teleponPelanggan}</p>
        <p className="text-sm text-gray-500">{order.emailPelanggan}</p>
      </div>

      {/* Tabel Item */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-sm font-semibold text-gray-600">Deskripsi</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-center">Jumlah</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-right">Harga Satuan</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.namaBarang}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">{formatCurrency(item.hargaSatuan)}</td>
                <td className="p-3 text-right">{formatCurrency(item.totalHarga)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-end mt-8">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Pajak</span>
            <span>{formatCurrency(order.pajak)}</span>
          </div>
          <div className="border-t my-2"></div>
          <div className="flex justify-between font-bold text-lg text-gray-800">
            <span>Total</span>
            <span>{formatCurrency(order.totalPesanan)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-sm text-gray-500">
        <p>Terima kasih atas pesanan Anda!</p>
      </div>
    </div>
  );
};
