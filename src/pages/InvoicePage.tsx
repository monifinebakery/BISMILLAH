import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Printer, FileText, Settings, ArrowLeft, Copy } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

// Mock function untuk load order - ganti dengan implementasi sesungguhnya
const loadOrderById = async (orderId: string) => {
  // Simulasi loading data dari API/database
  // Ganti dengan implementasi yang sesungguhnya
  return {
    id: orderId,
    nomorPesanan: `ORD-${orderId}`,
    namaPelanggan: 'Customer Name',
    alamatPelanggan: 'Customer Address',
    telefonPelanggan: '+62 123 456 789',
    emailPelanggan: 'customer@email.com',
    items: [
      { id: 1, namaBarang: 'Product 1', quantity: 2, hargaSatuan: 50000, totalHarga: 100000 },
      { id: 2, namaBarang: 'Product 2', quantity: 1, hargaSatuan: 75000, totalHarga: 75000 }
    ],
    subtotal: 175000,
    pajak: 19250,
    totalPesanan: 194250
  };
};

const InvoicePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV/${format(new Date(), 'yyyyMMdd')}-001`);
  const [issueDate, setIssueDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 14)));
  const [customer, setCustomer] = useState({ name: '', address: '', phone: '', email: '' });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: Date.now(), description: '', quantity: 1, price: 0 }
  ]);
  const [discount, setDiscount] = useState({ type: 'percent' as 'percent' | 'fixed', value: 0 });
  const [tax, setTax] = useState({ type: 'percent' as 'percent', value: 11 });
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('Terima kasih atas kepercayaan Anda.');
  const [paymentInstructions, setPaymentInstructions] = useState(
    `Transfer ke:\nBank BCA\n1234567890\na/n ${settings.businessName || 'Nama Bisnis'}`
  );
  const [status, setStatus] = useState<'BELUM LUNAS' | 'LUNAS' | 'JATUH TEMPO'>('BELUM LUNAS');

  // Load order data jika ada orderId
  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) return;
      
      setLoading(true);
      try {
        const orderData = await loadOrderById(orderId);
        
        // Update form dengan data order
        setInvoiceNumber(`INV-${orderData.nomorPesanan}`);
        setCustomer({
          name: orderData.namaPelanggan,
          address: orderData.alamatPelanggan,
          phone: orderData.teleponPelanggan || '',
          email: orderData.emailPelanggan || ''
        });
        
        // Convert order items ke invoice items
        const invoiceItems = orderData.items.map((item: any, index: number) => ({
          id: Date.now() + index,
          description: item.namaBarang,
          quantity: item.quantity,
          price: item.hargaSatuan
        }));
        
        setItems(invoiceItems);
        toast.success('Data pesanan berhasil dimuat');
      } catch (error) {
        console.error('Error loading order:', error);
        toast.error('Gagal memuat data pesanan');
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  const handleItemChange = (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'description' ? value : Number(value) || 0 } 
        : item
    ));
  };

  const addItem = () => setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  
  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const { subtotal, discountAmount, taxAmount, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const disc = discount.type === 'percent' ? sub * (discount.value / 100) : discount.value;
    const subAfterDiscount = sub - disc;
    const taxAmt = subAfterDiscount * (tax.value / 100);
    const grandTotal = subAfterDiscount + taxAmt + shipping;
    return { 
      subtotal: sub, 
      discountAmount: disc, 
      taxAmount: taxAmt, 
      total: grandTotal 
    };
  }, [items, discount, tax, shipping]);

  // Alternatif 1: Menggunakan browser's native print
  const handlePrint = () => {
    window.print();
    toast.success('Membuka dialog print...');
  };

  // Alternatif 2: Download sebagai HTML file
  const handleDownloadHTML = () => {
    const element = document.getElementById('invoice-content');
    if (!element) {
      toast.error('Elemen invoice tidak ditemukan');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .invoice-header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .totals { float: right; width: 300px; }
          .grand-total { background-color: #f0f8ff; padding: 10px; font-weight: bold; font-size: 18px; }
          @media print { 
            body { margin: 0; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceNumber.replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Invoice berhasil didownload sebagai HTML');
  };

  // Alternatif 3: Copy invoice content ke clipboard
  const handleCopyToClipboard = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) {
      toast.error('Elemen invoice tidak ditemukan');
      return;
    }

    try {
      const textContent = element.innerText;
      await navigator.clipboard.writeText(textContent);
      toast.success('Invoice berhasil dicopy ke clipboard');
    } catch (error) {
      toast.error('Gagal copy ke clipboard');
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'LUNAS': 
        return 'bg-green-100 text-green-800 border-green-300';
      case 'JATUH TEMPO': 
        return 'bg-red-100 text-red-800 border-red-300';
      default: 
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const resetForm = () => {
    setInvoiceNumber(`INV/${format(new Date(), 'yyyyMMdd')}-001`);
    setIssueDate(new Date());
    setDueDate(new Date(new Date().setDate(new Date().getDate() + 14)));
    setCustomer({ name: '', address: '', phone: '', email: '' });
    setItems([{ id: Date.now(), description: '', quantity: 1, price: 0 }]);
    setDiscount({ type: 'percent', value: 0 });
    setTax({ type: 'percent', value: 11 });
    setShipping(0);
    setStatus('BELUM LUNAS');
    toast.success('Form berhasil direset');
  };

  const duplicateInvoice = () => {
    const newInvoiceNumber = `INV/${format(new Date(), 'yyyyMMdd')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    setInvoiceNumber(newInvoiceNumber);
    setIssueDate(new Date());
    setDueDate(new Date(new Date().setDate(new Date().getDate() + 14)));
    setStatus('BELUM LUNAS');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* CSS untuk print */}
      <style jsx>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { margin: 0; padding: 0; }
          .invoice-content { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card className="print:hidden shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Button>
                  <FileText className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">
                      {orderId ? 'Invoice dari Pesanan' : 'Invoice Generator'}
                    </CardTitle>
                    {orderId && (
                      <p className="text-blue-100 text-xs sm:text-sm">Order ID: {orderId}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    variant="secondary" 
                    onClick={resetForm}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20 text-sm"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button 
                    onClick={handlePrint}
                    className="bg-white text-orange-600 hover:bg-gray-100 text-sm"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button 
                    onClick={handleDownloadHTML}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20 text-sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Invoice Content */}
          <Card className="shadow-xl border-0 overflow-hidden invoice-content" id="invoice-content">
            <div className="bg-white p-4 sm:p-8">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-8 mb-6 sm:mb-8 pb-4 sm:pb-8 border-b-2 border-gray-200">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    {settings.businessName || 'Nama Bisnis Anda'}
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600">{settings.ownerName || 'Nama Pemilik'}</p>
                  <div className="mt-2 space-y-1 text-xs sm:text-sm text-gray-500">
                    <p>{settings.address || 'Alamat Bisnis'}</p>
                    <p>{settings.phone || 'Telepon Bisnis'}</p>
                    <p>{settings.email || 'Email Bisnis'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <h2 className="text-2xl sm:text-4xl font-bold text-gray-300 uppercase tracking-wider mb-2 sm:mb-4">
                    INVOICE
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-4 sm:gap-y-2 text-xs sm:text-sm">
                      <Label className="text-gray-600 font-medium">No. Invoice:</Label>
                      <Input 
                        value={invoiceNumber} 
                        onChange={e => setInvoiceNumber(e.target.value)} 
                        className="text-right font-mono bg-transparent border-none p-0 h-auto print:hidden"
                      />
                      <span className="hidden print:block text-right font-mono">{invoiceNumber}</span>
                      
                      <Label className="text-gray-600 font-medium">Tanggal:</Label>
                      <Input 
                        type="date" 
                        value={format(issueDate, 'yyyy-MM-dd')} 
                        onChange={e => setIssueDate(new Date(e.target.value))} 
                        className="text-right bg-transparent border-none p-0 h-auto print:hidden"
                      />
                      <span className="hidden print:block text-right">{format(issueDate, 'dd/MM/yyyy')}</span>
                      
                      <Label className="text-gray-600 font-medium">Jatuh Tempo:</Label>
                      <Input 
                        type="date" 
                        value={format(dueDate, 'yyyy-MM-dd')} 
                        onChange={e => setDueDate(new Date(e.target.value))} 
                        className="text-right bg-transparent border-none p-0 h-auto print:hidden"
                      />
                      <span className="hidden print:block text-right">{format(dueDate, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer and Status Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Ditagihkan Kepada:</h3>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Nama Pelanggan" 
                      value={customer.name} 
                      onChange={e => setCustomer({...customer, name: e.target.value})} 
                      className="font-bold text-base sm:text-lg border-gray-300 focus:border-blue-500 print:hidden"
                    />
                    <div className="hidden print:block font-bold text-lg">{customer.name}</div>
                    
                    <Textarea 
                      placeholder="Alamat Pelanggan" 
                      value={customer.address} 
                      onChange={e => setCustomer({...customer, address: e.target.value})} 
                      className="text-gray-600 border-gray-300 focus:border-blue-500 print:hidden"
                      rows={3}
                    />
                    <div className="hidden print:block text-gray-600 whitespace-pre-line">{customer.address}</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input 
                        placeholder="Telepon" 
                        value={customer.phone} 
                        onChange={e => setCustomer({...customer, phone: e.target.value})} 
                        className="text-gray-600 border-gray-300 focus:border-blue-500 print:hidden"
                      />
                      <div className="hidden print:block text-gray-600">{customer.phone}</div>
                      
                      <Input 
                        placeholder="Email" 
                        type="email"
                        value={customer.email} 
                        onChange={e => setCustomer({...customer, email: e.target.value})} 
                        className="text-gray-600 border-gray-300 focus:border-blue-500 print:hidden"
                      />
                      <div className="hidden print:block text-gray-600">{customer.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-start">
                  <div className="w-full max-w-xs">
                    <Label className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 block">
                      Status Pembayaran
                    </Label>
                    <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                      <SelectTrigger className={`w-full font-bold text-base sm:text-lg py-2 sm:py-3 border-2 ${getStatusBadge()} print:hidden`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BELUM LUNAS">BELUM LUNAS</SelectItem>
                        <SelectItem value="LUNAS">LUNAS</SelectItem>
                        <SelectItem value="JATUH TEMPO">JATUH TEMPO</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className={`hidden print:block w-full font-bold text-lg py-3 px-4 border-2 rounded text-center ${getStatusBadge()}`}>
                      {status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Detail Items:</h3>
                
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 sm:gap-4 bg-gray-50 p-2 sm:p-4 rounded-t-lg border">
                  <div className="col-span-5">
                    <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Deskripsi</Label>
                  </div>
                  <div className="col-span-2 text-center">
                    <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Jumlah</Label>
                  </div>
                  <div className="col-span-2 text-right">
                    <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Harga Satuan</Label>
                  </div>
                  <div className="col-span-2 text-right">
                    <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Total</Label>
                  </div>
                  <div className="col-span-1 print:hidden"></div>
                </div>
                
                {/* Table Items */}
                <div className="border border-t-0 rounded-b-lg">
                  {items.map((item, index) => (
                    <div key={item.id} className={`grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b last:border-b-0`}>
                      <div className="col-span-12 sm:col-span-5">
                        <Label className="sm:hidden font-medium text-gray-600 mb-1 block text-xs">Deskripsi:</Label>
                        <Textarea 
                          placeholder="Deskripsi produk/jasa" 
                          value={item.description} 
                          onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                          className="resize-none border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
                          rows={2}
                        />
                        <div className="hidden print:block text-sm whitespace-pre-line">{item.description}</div>
                      </div>
                      
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="sm:hidden font-medium text-gray-600 mb-1 block text-xs">Jumlah:</Label>
                        <Input 
                          type="number" 
                          min="1"
                          value={item.quantity} 
                          onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} 
                          className="text-center font-mono border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
                        />
                        <div className="hidden print:block text-center font-mono text-sm">{item.quantity}</div>
                      </div>
                      
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="sm:hidden font-medium text-gray-600 mb-1 block text-xs">Harga:</Label>
                        <Input 
                          type="number" 
                          min="0"
                          value={item.price} 
                          onChange={e => handleItemChange(item.id, 'price', e.target.value)} 
                          className="text-right font-mono border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
                        />
                        <div className="hidden print:block text-right font-mono text-sm">{formatCurrency(item.price)}</div>
                      </div>
                      
                      <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                        <Label className="sm:hidden font-medium text-gray-600 mr-1 text-xs print:hidden">Total:</Label>
                        <span className="font-bold text-base sm:text-lg font-mono">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center justify-center print:hidden">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={addItem} 
                  variant="outline" 
                  className="mt-3 sm:mt-4 w-full print:hidden hover:bg-blue-50 border-blue-200 text-blue-600 py-2 text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Item Baru
                </Button>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                {/* Payment Instructions & Notes */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <Label className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 block">
                      Instruksi Pembayaran
                    </Label>
                    <Textarea 
                      value={paymentInstructions} 
                      onChange={e => setPaymentInstructions(e.target.value)} 
                      className="text-gray-700 border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
                      rows={4}
                    />
                    <div className="hidden print:block text-gray-700 text-sm whitespace-pre-line">{paymentInstructions}</div>
                  </div>
                  
                  <div>
                    <Label className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 block">
                      Catatan Tambahan
                    </Label>
                    <Textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      className="text-gray-700 border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
                      rows={3}
                    />
                    <div className="hidden print:block text-gray-700 text-sm whitespace-pre-line">{notes}</div>
                  </div>
                </div>
                
                {/* Totals */}
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border-2 border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Ringkasan Pembayaran</h3>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-xs sm:text-sm">Subtotal</span>
                        <span className="font-mono text-base sm:text-lg">{formatCurrency(subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Label className="text-gray-600 text-xs sm:text-sm">Diskon</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={discount.value} 
                            onChange={e => setDiscount({...discount, value: Number(e.target.value) || 0})} 
                            className="w-16 sm:w-20 h-8 text-center text-xs sm:text-sm border-gray-300 print:hidden"
                          />
                          <span className="hidden print:inline text-xs sm:text-sm">({discount.value}{discount.type === 'percent' ? '%' : ' Rp'})</span>
                          <Select 
                            value={discount.type} 
                            onValueChange={(v: any) => setDiscount({...discount, type: v})}
                          >
                            <SelectTrigger className="w-12 sm:w-16 h-8 text-xs sm:text-sm border-gray-300 print:hidden">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">%</SelectItem>
                              <SelectItem value="fixed">Rp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <span className="font-mono text-base sm:text-lg text-red-600">
                          - {formatCurrency(discountAmount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Label className="text-gray-600 text-xs sm:text-sm">Pajak</Label>
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            value={tax.value} 
                            onChange={e => setTax({...tax, value: Number(e.target.value) || 0})} 
                            className="w-16 sm:w-20 h-8 text-center text-xs sm:text-sm border-gray-300 print:hidden"
                          />
                          <span className="text-xs sm:text-sm text-gray-600">%</span>
                        </div>
                        <span className="font-mono text-base sm:text-lg text-green-600">
                          + {formatCurrency(taxAmount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label className="text-gray-600 text-xs sm:text-sm">Biaya Pengiriman</Label>
                        <Input 
                          type="number" 
                          min="0"
                          value={shipping} 
                          onChange={e => setShipping(Number(e.target.value) || 0)} 
                          className="w-20 sm:w-32 h-8 text-right text-xs sm:text-sm font-mono border-gray-300 print:hidden"
                        />
                        <span className="hidden print:inline font-mono text-sm">{formatCurrency(shipping)}</span>
                      </div>
                      
                      <div className="border-t-2 border-gray-300 pt-3 sm:pt-4 mt-3 sm:mt-4">
                        <div className="flex justify-between items-center bg-blue-50 p-3 sm:p-4 rounded-lg">
                          <span className="text-base sm:text-xl font-bold text-gray-800">GRAND TOTAL</span>
                          <span className="text-lg sm:text-2xl font-bold text-blue-600 font-mono">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default InvoicePage;