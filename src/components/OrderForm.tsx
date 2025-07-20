// src/components/OrderForm.tsx

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
  onSubmit: (order: Partial<NewOrder> | Partial<Order>) => void;
  initialData?: Order | null;
}

const OrderForm = ({ open, onOpenChange, onSubmit, initialData }: OrderFormProps) => {
  // =========================================================
  // --- PERBAIKAN UTAMA #1: Sesuaikan nama state di sini ---
  // =========================================================
  const [formData, setFormData] = useState({
    namaPelanggan: '',
    teleponPelanggan: '',
    emailPelanggan: '',
    alamatPengiriman: '', // Dulu 'alamatPelanggan', sekarang 'alamatPengiriman'
    status: 'pending',
    catatan: '',        // Dulu 'catatanPesanan', sekarang 'catatan'
  });
  const [items, setItems] = useState<Partial<OrderItem>[]>([]);
  const [pajakInput, setPajakInput] = useState<number | string>(10);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    if (open) {
      // =========================================================
      // --- PERBAIKAN UTAMA #2: Sesuaikan pengisian data awal ---
      // =========================================================
      setFormData({
        namaPelanggan: initialData?.namaPelanggan || '',
        teleponPelanggan: initialData?.teleponPelanggan || '',
        emailPelanggan: initialData?.emailPelanggan || '',
        alamatPengiriman: initialData?.alamatPengiriman || '', // Sesuaikan
        status: initialData?.status || 'pending',
        catatan: initialData?.catatan || '', // Sesuaikan
      });
      setItems(initialData?.items && initialData.items.length > 0
        ? initialData.items.map(item => ({ ...item, id: item.id || generateUUID() }))
        : [{ id: generateUUID(), nama: '', quantity: 1, hargaSatuan: 0 }]
      );
      setPajakInput(initialData?.pajak ? (initialData.subtotal > 0 ? (initialData.pajak / initialData.subtotal) * 100 : 10) : 10);
      setIsSubmitting(false); 
    }
  }, [open, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addItem = () => setItems([...items, { id: generateUUID(), nama: '', quantity: 1, hargaSatuan: 0 }]);
  const removeItem = (id: string | number) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
    else toast.error('Pesanan harus memiliki setidaknya satu item.');
  };

  const updateItem = (id: string | number, field: keyof OrderItem, value: string | number) => { 
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const { subtotal, pajak, total } = useMemo(() => {
    const calculatedSubtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.hargaSatuan) || 0)), 0);
    const pajakPercentage = Number(pajakInput) || 0;
    const calculatedPajak = calculatedSubtotal * (pajakPercentage / 100);
    const calculatedTotal = calculatedSubtotal + calculatedPajak;
    return { subtotal: calculatedSubtotal, pajak: calculatedPajak, total: calculatedTotal };
  }, [items, pajakInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); 

    if (!formData.namaPelanggan.trim() || !formData.teleponPelanggan.trim()) {
      toast.error('Nama dan Nomor Telepon pelanggan wajib diisi.');
      setIsSubmitting(false);
      return;
    }
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

    const finalOrderData: Partial<Order> = {
        ...formData,
        items: validItems,
        subtotal: subtotal,
        pajak: pajak,
        totalPesanan: total,
    };
    
    onSubmit(finalOrderData);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-inter flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Pesanan' : 'Tambah Pesanan Baru'}</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label htmlFor="namaPelanggan">Nama Pelanggan *</Label><Input id="namaPelanggan" name="namaPelanggan" value={formData.namaPelanggan} onChange={handleInputChange} required disabled={isSubmitting} /></div>
            <div><Label htmlFor="teleponPelanggan">Nomor Whatsapp *</Label><Input id="teleponPelanggan" name="teleponPelanggan" value={formData.teleponPelanggan} onChange={handleInputChange} required disabled={isSubmitting} /></div>
          </div>
          
          {/* ========================================================= */}
          {/* --- PERBAIKAN UTAMA #3: Hubungkan Textarea ke state yang benar --- */}
          {/* ========================================================= */}
          <div>
            <Label htmlFor="alamatPengiriman">Alamat Pengiriman</Label>
            <Textarea id="alamatPengiriman" name="alamatPengiriman" value={formData.alamatPengiriman} onChange={handleInputChange} disabled={isSubmitting} rows={2} />
          </div>
          <div>
            <Label htmlFor="emailPelanggan">Email Pelanggan</Label>
            <Input id="emailPelanggan" name="emailPelanggan" type="email" value={formData.emailPelanggan} onChange={handleInputChange} disabled={isSubmitting} />
          </div>
          
          {initialData && (
            <div>
              <Label htmlFor="status">Status Pesanan</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({...prev, status: value}))} disabled={isSubmitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipping">Shipped</SelectItem><SelectItem value="delivered">Delivered</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">Item Pesanan</Label>
              <Button type="button" onClick={addItem} size="sm" className="h-8" disabled={isSubmitting}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
            </div>
            {/* ... Tabel item ... */}
          </div>
          
          {/* ========================================================= */}
          {/* --- PERBAIKAN UTAMA #4: Hubungkan Textarea ke state yang benar --- */}
          {/* ========================================================= */}
          <div>
            <Label htmlFor="catatan">Catatan Pesanan</Label>
            <Textarea id="catatan" name="catatan" value={formData.catatan} onChange={handleInputChange} disabled={isSubmitting} rows={2} />
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
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : (initialData ? 'Update Pesanan' : 'Buat Pesanan')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;