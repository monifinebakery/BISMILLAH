import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Download } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { format } from 'date-fns';

// Deklarasikan html2pdf agar TypeScript tidak error
declare const html2pdf: any;

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

const InvoicePage = () => {
  const { settings } = useUserSettings();
  
  const [invoiceNumber, setInvoiceNumber] = useState(`INV/${format(new Date(), 'yyyyMMdd')}-001`);
  const [issueDate, setIssueDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 14)));
  const [customer, setCustomer] = useState({ name: '', address: '' });
  const [items, setItems] = useState<InvoiceItem[]>([{ id: Date.now(), description: '', quantity: 1, price: 0 }]);
  const [discount, setDiscount] = useState({ type: 'percent', value: 0 });
  const [tax, setTax] = useState({ type: 'percent', value: 11 });
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('Terima kasih atas kepercayaan Anda.');
  const [paymentInstructions, setPaymentInstructions] = useState(`Transfer ke:\nBank BCA\n1234567890\na/n ${settings.businessName || 'Nama Bisnis'}`);
  const [status, setStatus] = useState<'BELUM LUNAS' | 'LUNAS' | 'JATUH TEMPO'>('BELUM LUNAS');

  const handleItemChange = (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(items.map(item => (item.id === id ? { ...item, [field]: Number.isNaN(Number(value)) ? value : Number(value) } : item)));
  };

  const addItem = () => setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  const removeItem = (id: number) => setItems(items.filter(item => item.id !== id));

  const { subtotal, discountAmount, taxAmount, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const disc = discount.type === 'percent' ? sub * (discount.value / 100) : discount.value;
    const subAfterDiscount = sub - disc;
    const taxAmt = subAfterDiscount * (tax.value / 100);
    const grandTotal = subAfterDiscount + taxAmt + shipping;
    return { subtotal: sub, discountAmount: disc, taxAmount: taxAmt, total: grandTotal };
  }, [items, discount, tax, shipping]);

  const handleExportPDF = () => {
    const element = document.getElementById('invoice-content');
    if (!element) {
      console.error('Invoice content element not found!');
      return;
    }
    const opt = {
      margin: 0.5,
      filename: `invoice_${invoiceNumber.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().from(element).set(opt).save();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'LUNAS': return 'bg-green-100 text-green-800 border-green-300';
      case 'JATUH TEMPO': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8 overflow-y-auto">
      <Card className="max-w-4xl mx-auto mb-6 print:hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Invoice Generator</h2>
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" /> Export as PDF
          </Button>
        </CardContent>
      </Card>
      
      {/* ✅ PERUBAHAN UTAMA: Mengatur layout menjadi lebih horizontal */}
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto border" id="invoice-content">
        {/* Header dalam satu baris */}
        <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{settings.businessName || 'Nama Bisnis Anda'}</h1>
            <p className="text-sm text-gray-500">{settings.ownerName || 'Nama Anda'}</p>
          </div>
          
          <div className="flex flex-col items-end">
            <h2 className="text-3xl font-bold text-gray-400 uppercase tracking-wide mb-2">INVOICE</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500">No. Invoice:</span>
              <Input 
                value={invoiceNumber} 
                onChange={e => setInvoiceNumber(e.target.value)} 
                className="text-right print:border-none w-40"
              />
              
              <span className="text-gray-500">Tanggal:</span>
              <Input 
                type="date" 
                value={format(issueDate, 'yyyy-MM-dd')} 
                onChange={e => setIssueDate(new Date(e.target.value))} 
                className="text-right print:border-none w-40"
              />
              
              <span className="text-gray-500">Jatuh Tempo:</span>
              <Input 
                type="date" 
                value={format(dueDate, 'yyyy-MM-dd')} 
                onChange={e => setDueDate(new Date(e.target.value))} 
                className="text-right print:border-none w-40"
              />
            </div>
          </div>
        </div>

        {/* Info pelanggan dan status dalam satu baris */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-4">
          <div>
            <h3 className="font-semibold text-gray-600 mb-1">Ditagihkan Kepada:</h3>
            <Input 
              placeholder="Nama Pelanggan" 
              value={customer.name} 
              onChange={e => setCustomer({...customer, name: e.target.value})} 
              className="font-bold text-gray-800 mb-1 w-full" 
            />
            <Textarea 
              placeholder="Alamat & Kontak Pelanggan" 
              value={customer.address} 
              onChange={e => setCustomer({...customer, address: e.target.value})} 
              className="text-sm text-gray-500 print:border-none w-full h-16" 
            />
          </div>
          
          <div className="flex flex-col items-end">
            <div className="w-full max-w-xs">
              <Label className="font-semibold text-gray-700 mb-1">Status Pembayaran</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger className={`w-full font-bold border-2 ${getStatusBadge()}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BELUM LUNAS">BELUM LUNAS</SelectItem>
                  <SelectItem value="LUNAS">LUNAS</SelectItem>
                  <SelectItem value="JATUH TEMPO">JATUH TEMPO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabel item yang lebih kompak */}
        <div className="mt-4">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 rounded-t">
            <div className="col-span-6"><Label className="text-xs font-medium">Deskripsi</Label></div>
            <div className="col-span-2 text-center"><Label className="text-xs font-medium">Jumlah</Label></div>
            <div className="col-span-2 text-right"><Label className="text-xs font-medium">Harga Satuan</Label></div>
            <div className="col-span-2 text-right"><Label className="text-xs font-medium">Total</Label></div>
          </div>
          
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-b">
              <div className="col-span-12 sm:col-span-6">
                <Textarea 
                  placeholder="Item/Jasa" 
                  value={item.description} 
                  onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                  className="print:border-none w-full" 
                  rows={1} 
                />
              </div>
              
              <div className="col-span-4 sm:col-span-2">
                <Input 
                  type="number" 
                  value={item.quantity} 
                  onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} 
                  className="text-center print:border-none w-full" 
                />
              </div>
              
              <div className="col-span-4 sm:col-span-2">
                <Input 
                  type="number" 
                  value={item.price} 
                  onChange={e => handleItemChange(item.id, 'price', e.target.value)} 
                  className="text-right print:border-none w-full" 
                />
              </div>
              
              <div className="col-span-4 sm:col-span-2 flex items-center justify-end">
                <p className="font-medium">{formatCurrency(item.quantity * item.price)}</p>
              </div>
            </div>
          ))}
          
          <Button onClick={addItem} variant="outline" className="mt-2 print:hidden w-full">
            <Plus className="mr-2 h-4 w-4" />Tambah Baris
          </Button>
        </div>
        
        {/* Bagian bawah dalam satu baris */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Catatan */}
          <div className="space-y-3">
            <div>
              <Label className="font-semibold text-gray-700">Instruksi Pembayaran</Label>
              <Textarea 
                value={paymentInstructions} 
                onChange={e => setPaymentInstructions(e.target.value)} 
                className="text-sm text-gray-600 print:border-none w-full h-24" 
              />
            </div>
            
            <div>
              <Label className="font-semibold text-gray-700">Catatan Tambahan</Label>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="text-sm text-gray-600 print:border-none w-full h-16" 
              />
            </div>
          </div>
          
          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label>Diskon</Label>
                  <Input 
                    type="number" 
                    value={discount.value} 
                    onChange={e => setDiscount({...discount, value: Number(e.target.value)})} 
                    className="w-16 h-8 text-right print:border-none" 
                  />
                  <Select 
                    value={discount.type} 
                    onValueChange={(v: any) => setDiscount({...discount, type: v})}
                  >
                    <SelectTrigger className="w-16 h-8 print:border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="fixed">Rp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label>Pajak</Label>
                  <Input 
                    type="number" 
                    value={tax.value} 
                    onChange={e => setTax({...tax, value: Number(e.target.value)})} 
                    className="w-16 h-8 text-right print:border-none" 
                  />
                  <span>%</span>
                </div>
                <span>+ {formatCurrency(taxAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <Label>Biaya Pengiriman</Label>
                <Input 
                  type="number" 
                  value={shipping} 
                  onChange={e => setShipping(Number(e.target.value))} 
                  className="w-32 h-8 text-right print:border-none" 
                />
              </div>
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>GRAND TOTAL</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;