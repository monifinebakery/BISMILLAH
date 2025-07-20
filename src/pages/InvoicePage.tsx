import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Printer } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

const InvoicePage = () => {
  const { settings } = useUserSettings();
  
  const [customer, setCustomer] = useState({ name: '', address: '' });
  const [items, setItems] = useState<InvoiceItem[]>([{ id: 1, description: '', quantity: 1, price: 0 }]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [taxRate, setTaxRate] = useState(0); // Pajak dalam persen

  const handleItemChange = (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Tombol Aksi di Atas - Hilang saat dicetak */}
      <div className="mb-6 flex justify-end print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Cetak Invoice
        </Button>
      </div>

      {/* Konten Invoice */}
      <div className="bg-white p-8 sm:p-12 rounded-lg shadow-lg max-w-4xl mx-auto border" id="invoice-content">
        {/* Header Invoice */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{settings.businessName || 'Nama Bisnis Anda'}</h1>
            <p className="text-sm text-gray-500">{settings.address || 'Alamat Bisnis'}</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-semibold text-gray-700 uppercase">INVOICE</h2>
            <div className="mt-2">
              <Label htmlFor="invoiceNumber" className="text-sm text-gray-500">No. Invoice</Label>
              <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-40 text-right print:border-none print:p-0 print:h-auto" />
            </div>
            <div className="mt-1">
              <Label htmlFor="invoiceDate" className="text-sm text-gray-500">Tanggal</Label>
              <Input id="invoiceDate" type="date" value={invoiceDate.toISOString().split('T')[0]} onChange={e => setInvoiceDate(new Date(e.target.value))} className="w-40 text-right print:border-none print:p-0 print:h-auto" />
            </div>
          </div>
        </div>

        {/* Info Pelanggan */}
        <div className="mb-10">
          <h3 className="font-semibold text-gray-600 mb-2">Kepada:</h3>
          <Input placeholder="Nama Pelanggan" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="font-bold text-gray-800 print:border-none print:p-0 print:h-auto" />
          <Textarea placeholder="Alamat Pelanggan" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="text-sm text-gray-500 mt-1 print:border-none print:p-0" />
        </div>

        {/* Tabel Item */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-sm font-semibold text-gray-600 w-1/2">Deskripsi</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center w-1/6">Jumlah</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-right w-1/4">Harga Satuan</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-right w-1/4">Total</th>
                <th className="print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-2"><Input placeholder="Nama item atau jasa" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="print:border-none" /></td>
                  <td className="p-2"><Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="text-center print:border-none" /></td>
                  <td className="p-2"><Input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', Number(e.target.value))} className="text-right print:border-none" /></td>
                  <td className="p-2 text-right">{formatCurrency(item.quantity * item.price)}</td>
                  <td className="p-2 print:hidden"><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={addItem} variant="outline" className="mt-4 print:hidden">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Baris
          </Button>
        </div>

        {/* Total */}
        <div className="flex justify-end mt-8">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Label htmlFor="taxRate">Pajak</Label>
                <Input id="taxRate" type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-16 h-8 text-right print:border-none" />
                <span>%</span>
              </div>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
