import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Printer, FileText } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatCurrency } from '@/utils/currencyUtils';
import { format } from 'date-fns';

// Tipe data untuk item di dalam invoice
interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

const InvoicePage = () => {
  // Mengambil data bisnis dari pengaturan
  const { settings } = useUserSettings();

  // State untuk semua data invoice yang bisa diubah
  const [invoiceNumber, setInvoiceNumber] = useState(`INV/${format(new Date(), 'yyyy/MM')}/001`);
  const [issueDate, setIssueDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 14))); // Jatuh tempo 14 hari
  const [customer, setCustomer] = useState({ name: '', address: '', contact: '' });
  const [items, setItems] = useState<InvoiceItem[]>([{ id: Date.now(), description: '', quantity: 1, price: 0 }]);
  const [discount, setDiscount] = useState({ type: 'percent', value: 0 });
  const [tax, setTax] = useState({ type: 'percent', value: 11 }); // Default PPN 11%
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('Barang yang sudah dibeli tidak dapat dikembalikan.');
  const [paymentInstructions, setPaymentInstructions] = useState('BCA 1234567890 a/n Nama Bisnis Anda');
  const [status, setStatus] = useState<'BELUM LUNAS' | 'LUNAS' | 'JATUH TEMPO'>('BELUM LUNAS');

  // Fungsi untuk mengelola item
  const handleItemChange = (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };
  const addItem = () => setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  const removeItem = (id: number) => setItems(items.filter(item => item.id !== id));

  // Kalkulasi otomatis menggunakan useMemo
  const { subtotal, discountAmount, taxAmount, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
    let disc = 0;
    if (discount.type === 'percent') {
      disc = sub * (discount.value / 100);
    } else {
      disc = discount.value;
    }
    const subAfterDiscount = sub - disc;
    const taxAmt = subAfterDiscount * (tax.value / 100);
    const grandTotal = subAfterDiscount + taxAmt + Number(shipping);
    return { subtotal: sub, discountAmount: disc, taxAmount: taxAmt, total: grandTotal };
  }, [items, discount, tax, shipping]);

  const handlePrint = () => window.print();

  const getStatusBadge = () => {
    switch (status) {
      case 'LUNAS': return 'bg-green-100 text-green-800 border-green-300';
      case 'JATUH TEMPO': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      {/* Panel Kontrol - disembunyikan saat mencetak */}
      <Card className="mb-6 print:hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Invoice Generator</h2>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Cetak / Simpan PDF
                </Button>
            </div>
        </CardContent>
      </Card>
      
      {/* Konten Invoice yang akan dicetak */}
      <div className="bg-white p-8 sm:p-12 rounded-lg shadow-lg max-w-4xl mx-auto border" id="invoice-content">
        {/* 1. Header (Kop Surat) & 2. Informasi Referensi */}
        <div className="flex justify-between items-start pb-8 border-b">
          <div>
            {/* Logo bisa ditambahkan di sini */}
            <h1 className="text-2xl font-bold text-gray-800">{settings.businessName || 'Nama Bisnis Anda'}</h1>
            <Textarea value={settings.address || 'Alamat Bisnis\nTelepon\nEmail'} className="text-sm text-gray-500 mt-2 p-0 border-none h-auto resize-none" readOnly/>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-400 uppercase tracking-widest">INVOICE</h2>
            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-end gap-2"><Label htmlFor="invoiceNumber" className="text-sm text-gray-500 whitespace-nowrap">No. Invoice:</Label><Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-40 text-right print:border-none print:p-0 print:h-auto" /></div>
                <div className="flex items-center justify-end gap-2"><Label htmlFor="issueDate" className="text-sm text-gray-500 whitespace-nowrap">Tanggal:</Label><Input id="issueDate" type="date" value={format(issueDate, 'yyyy-MM-dd')} onChange={e => setIssueDate(new Date(e.target.value))} className="w-40 text-right print:border-none print:p-0 print:h-auto" /></div>
                <div className="flex items-center justify-end gap-2"><Label htmlFor="dueDate" className="text-sm text-gray-500 whitespace-nowrap">Jatuh Tempo:</Label><Input id="dueDate" type="date" value={format(dueDate, 'yyyy-MM-dd')} onChange={e => setDueDate(new Date(e.target.value))} className="w-40 text-right print:border-none print:p-0 print:h-auto" /></div>
            </div>
          </div>
        </div>

        {/* 3. Informasi Pelanggan */}
        <div className="mt-8 mb-8">
          <h3 className="font-semibold text-gray-600 mb-2">Ditagihkan Kepada:</h3>
          <Input placeholder="Nama Pelanggan" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="font-bold text-gray-800 text-lg print:border-none print:p-0 print:h-auto mb-1" />
          <Textarea placeholder="Alamat & Kontak Pelanggan" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="text-sm text-gray-500 print:border-none print:p-0" />
        </div>

        {/* 4. Tabel Rincian Item */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-gray-100"><th className="p-3 text-sm font-semibold text-gray-600 w-1/2">Deskripsi</th><th className="p-3 text-sm font-semibold text-gray-600 text-center w-[100px]">Jumlah</th><th className="p-3 text-sm font-semibold text-gray-600 text-right w-[150px]">Harga Satuan</th><th className="p-3 text-sm font-semibold text-gray-600 text-right w-[150px]">Total</th><th className="print:hidden w-[50px]"></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b"><td className="p-1"><Textarea placeholder="Nama item atau jasa" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="print:border-none w-full" rows={1} /></td><td className="p-1"><Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="text-center print:border-none" /></td><td className="p-1"><Input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', Number(e.target.value))} className="text-right print:border-none" /></td><td className="p-1 text-right font-medium">{formatCurrency(item.quantity * item.price)}</td><td className="p-1 print:hidden"><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>
              ))}
            </tbody>
          </table>
          <Button onClick={addItem} variant="outline" className="mt-4 print:hidden"><Plus className="mr-2 h-4 w-4" />Tambah Baris</Button>
        </div>

        {/* 5. Kalkulasi Total & 6. Status Invoice */}
        <div className="flex flex-col sm:flex-row justify-between items-start mt-8">
            <div className="w-full sm:w-1/2">
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger className={`w-40 font-bold border-2 ${getStatusBadge()}`}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="BELUM LUNAS">BELUM LUNAS</SelectItem><SelectItem value="LUNAS">LUNAS</SelectItem><SelectItem value="JATUH TEMPO">JATUH TEMPO</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="w-full sm:w-1/2 flex justify-end mt-4 sm:mt-0">
                <div className="w-full max-w-xs space-y-3">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Label htmlFor="discount">Diskon</Label><Input id="discount" type="number" value={discount.value} onChange={e => setDiscount({...discount, value: Number(e.target.value)})} className="w-16 h-8 text-right print:border-none" /><Select value={discount.type} onValueChange={(v: any) => setDiscount({...discount, type: v})}><SelectTrigger className="w-20 h-8 print:border-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">%</SelectItem><SelectItem value="fixed">Rp</SelectItem></SelectContent></Select></div>
                        <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Label htmlFor="taxRate">Pajak</Label><Input id="taxRate" type="number" value={tax.value} onChange={e => setTax({...tax, value: Number(e.target.value)})} className="w-16 h-8 text-right print:border-none" /><span>%</span></div>
                        <span>+ {formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <Label htmlFor="shipping">Biaya Pengiriman</Label>
                        <Input id="shipping" type="number" value={shipping} onChange={e => setShipping(Number(e.target.value))} className="w-32 h-8 text-right print:border-none" />
                    </div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between font-bold text-xl text-gray-800 bg-gray-100 p-3 rounded-lg"><span>GRAND TOTAL</span><span>{formatCurrency(total)}</span></div>
                </div>
            </div>
        </div>
        
        {/* 7. Informasi Pembayaran & Footer */}
        <div className="border-t mt-10 pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold mb-2">Instruksi Pembayaran:</h4>
                    <Textarea value={paymentInstructions} onChange={e => setPaymentInstructions(e.target.value)} className="text-sm text-gray-600 print:border-none print:p-0" />
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Catatan:</h4>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-sm text-gray-600 print:border-none print:p-0" />
                </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-10">Terima kasih atas kepercayaan Anda.</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
