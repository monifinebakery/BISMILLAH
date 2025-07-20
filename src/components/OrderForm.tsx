import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X } from 'lucide-react'; 
import type { Order, NewOrder, OrderItem } from '@/types/order';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currencyUtils';
import { generateUUID } from '@/utils/uuid'; 

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: Partial<NewOrder> | Partial<Order>) => Promise<boolean>; // Mengharapkan Promise<boolean>
  initialData?: Order | null;
}

const OrderForm = ({ open, onOpenChange, onSubmit, initialData }: OrderFormProps) => {
  // State untuk menyimpan data formulir, diselaraskan dengan nama properti di Order/NewOrder
  const [formData, setFormData] = useState<Partial<NewOrder | Order>>({
    namaPelanggan: '',
    teleponPelanggan: '',
    emailPelanggan: '',
    alamatPengiriman: '',
    status: 'pending', // Default status untuk pesanan baru
    catatan: '', 
  });
  const [items, setItems] = useState<Partial<OrderItem>[]>([]);
  const [pajakInput, setPajakInput] = useState<number | string>(10);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // Effect untuk mengisi form saat dialog dibuka atau initialData berubah
  useEffect(() => {
    if (open) {
      setFormData({
        id: initialData?.id, // Penting untuk update
        nomorPesanan: initialData?.nomorPesanan, // Hanya untuk display/info, tidak diinput
        namaPelanggan: initialData?.namaPelanggan || '',
        teleponPelanggan: initialData?.teleponPelanggan || '',
        emailPelanggan: initialData?.emailPelanggan || '',
        alamatPengiriman: initialData?.alamatPengiriman || '',
        status: initialData?.status || 'pending',
        catatan: initialData?.catatan || '',
        // tanggal tidak perlu diatur di form jika otomatis di DB/RPC
      });
      setItems(initialData?.items && initialData.items.length > 0
        ? initialData.items.map(item => ({ ...item, id: item.id || generateUUID() })) // Pastikan item memiliki ID
        : [{ id: generateUUID(), nama: '', quantity: 1, hargaSatuan: 0 }] // Default satu item kosong
      );
      // Kalkulasi pajak yang benar untuk pengeditan
      setPajakInput(initialData?.pajak && initialData.subtotal > 0
        ? (initialData.pajak / initialData.subtotal) * 100
        : 10 // Default 10% jika tidak ada pajak atau subtotal 0
      );
      setIsSubmitting(false); 
    }
  }, [open, initialData]);

  // Handler untuk input teks dan textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler untuk Select (misal Status Pesanan)
  const handleSelectChange = (name: keyof (NewOrder | Order), value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => setItems([...items, { id: generateUUID(), nama: '', quantity: 1, hargaSatuan: 0 }]);
  const removeItem = (id: string) => { // ID sekarang string
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
    else toast.error('Pesanan harus memiliki setidaknya satu item.');
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => { 
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  // Perhitungan subtotal, pajak, dan total
  const { subtotal, pajak, total } = useMemo(() => {
    const calculatedSubtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.hargaSatuan) || 0)), 0);
    const pajakPercentage = Number(pajakInput) || 0;
    const calculatedPajak = calculatedSubtotal * (pajakPercentage / 100);
    const calculatedTotal = calculatedSubtotal + calculatedPajak;
    return { subtotal: calculatedSubtotal, pajak: calculatedPajak, total: calculatedTotal };
  }, [items, pajakInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); 

    // Validasi wajib diisi
    if (!formData.namaPelanggan?.trim() || !formData.teleponPelanggan?.trim()) {
      toast.error('Nama Pelanggan dan Nomor Whatsapp wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    // Filter item yang valid (punya nama)
    const validItems = items.filter(item => item.nama?.trim()).map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      hargaSatuan: Number(item.hargaSatuan) || 0,
    })) as OrderItem[];

    if (validItems.length === 0) {
      toast.error('Pesanan harus memiliki setidaknya satu item dengan nama yang valid.');
      setIsSubmitting(false);
      return;
    }

    // Siapkan data akhir yang akan dikirim ke onSubmit (OrderContext)
    const finalOrderData: Partial<Order> = {
      ...formData, // Ini akan mencakup namaPelanggan, teleponPelanggan, alamatPengiriman, catatan, status
      items: validItems,
      subtotal: subtotal,
      pajak: pajak,
      totalPesanan: total,
      // ID hanya ditambahkan jika sedang mode edit
      ...(initialData && { id: initialData.id }),
    };
    
    // Panggil fungsi onSubmit dari props (yang akan memanggil addOrder/updateOrder)
    const success = await onSubmit(finalOrderData);
    
    if (success) {
      onOpenChange(false); // Tutup dialog hanya jika pengiriman berhasil
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-inter flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Pesanan' : 'Tambah Pesanan Baru'}</DialogTitle></DialogHeader>

        {/* Form dengan ScrollArea untuk konten yang panjang */}
        <ScrollArea className="flex-grow pr-4 -mr-4"> {/* pr-4 dan -mr-4 untuk mencegah scrollbar memotong konten */}
          <form onSubmit={handleSubmit} className="space-y-4 p-1"> {/* Padding agar konten tidak terlalu menempel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label htmlFor="namaPelanggan">Nama Pelanggan *</Label><Input id="namaPelanggan" name="namaPelanggan" value={formData.namaPelanggan || ''} onChange={handleInputChange} required disabled={isSubmitting} /></div>
              <div><Label htmlFor="teleponPelanggan">Nomor Whatsapp *</Label><Input id="teleponPelanggan" name="teleponPelanggan" value={formData.teleponPelanggan || ''} onChange={handleInputChange} required disabled={isSubmitting} /></div>
            </div>
          
            <div>
              <Label htmlFor="alamatPengiriman">Alamat Pengiriman</Label>
              <Textarea id="alamatPengiriman" name="alamatPengiriman" value={formData.alamatPengiriman || ''} onChange={handleInputChange} disabled={isSubmitting} rows={2} />
            </div>
            <div>
              <Label htmlFor="emailPelanggan">Email Pelanggan</Label>
              <Input id="emailPelanggan" name="emailPelanggan" type="email" value={formData.emailPelanggan || ''} onChange={handleInputChange} disabled={isSubmitting} />
            </div>
          
            {initialData && ( // Status pesanan hanya ditampilkan saat mengedit (pesanan baru defaultnya 'pending')
              <div>
                <Label htmlFor="status">Status Pesanan</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipping">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Item Pesanan</Label>
                <Button type="button" onClick={addItem} size="sm" className="h-8" disabled={isSubmitting}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
              </div>
              <ScrollArea className="h-40 border rounded-md">
                <Table>
                  <TableHeader><TableRow><TableHead>Nama Item</TableHead><TableHead className="w-[80px]">Qty</TableHead><TableHead className="w-[100px]">Harga Satuan</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell><Input value={item.nama || ''} onChange={(e) => updateItem(item.id!, 'nama', e.target.value)} placeholder="Nama Item" disabled={isSubmitting} /></TableCell>
                        <TableCell><Input type="number" value={item.quantity || ''} onChange={(e) => updateItem(item.id!, 'quantity', parseFloat(e.target.value))} min="1" disabled={isSubmitting} /></TableCell>
                        <TableCell><Input type="number" value={item.hargaSatuan || ''} onChange={(e) => updateItem(item.id!, 'hargaSatuan', parseFloat(e.target.value))} min="0" disabled={isSubmitting} /></TableCell>
                        <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id!)} disabled={isSubmitting}><X className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
              {items.length === 0 && (
                <p className="p-4 text-center text-gray-500 text-sm">Tambahkan item pesanan</p>
              )}
              </ScrollArea>
          </div>
          
          <div>
            <Label htmlFor="catatan">Catatan Pesanan</Label>
            <Textarea id="catatan" name="catatan" value={formData.catatan || ''} onChange={handleInputChange} disabled={isSubmitting} rows={2} />
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between items-center text-sm">
              <span>Pajak (%)</span>
              <Input type="number" value={pajakInput} onChange={(e) => setPajakInput(e.target.value ? parseFloat(e.target.value) : '')} className="h-8 w-24 text-right" disabled={isSubmitting} />
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
          </form>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : (initialData ? 'Update Pesanan' : 'Buat Pesanan')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;