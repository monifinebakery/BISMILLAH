// src/components/OrderForm.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// MODIFIED: Pastikan Badge tidak diimpor di sini (karena tidak digunakan secara langsung)
// import { Badge } from '@/components/ui/badge'; 
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X } from 'lucide-react';
import type { Order, NewOrder, OrderItem } from '@/types/order';
import { toast } from 'sonner';
// PASTIKAN safeParseDate DIIMPORT DARI LOKASI YANG BENAR
import { safeParseDate } from '@/utils/dateUtils'; 

// BARIS INI DITAMBAHKAN/DIUBAH UNTUK IMPORT UTILS
import { formatCurrency } from '@/utils/currencyUtils';
// MODIFIED: Import generateUUID dari utils/uuid
import { generateUUID } from '@/utils/uuid'; // PASTIKAN BARIS INI ADA

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: NewOrder | Order) => void;
  initialData?: Order | null;
  isViewMode?: boolean;
}

const OrderForm = ({ open, onOpenChange, onSubmit, initialData, isViewMode = false }: OrderFormProps) => {
  const [formData, setFormData] = useState({
    namaPelanggan: '',
    emailPelanggan: '',
    teleponPelanggan: '',
    alamatPelanggan: '',
    status: 'pending',
    catatan: '',
  });

  // MODIFIED: Gunakan generateUUID untuk id item baru
  const [items, setItems] = useState<Partial<OrderItem>[]>([]);
  const [pajakInput, setPajakInput] = useState<number | string>('');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    if (open) {
      setFormData({
        namaPelanggan: initialData?.namaPelanggan || '',
        emailPelanggan: initialData?.emailPelanggan || '',
        teleponPelanggan: initialData?.teleponPelanggan || '',
        alamatPelanggan: initialData?.alamatPelanggan || '',
        status: initialData?.status || 'pending',
        catatan: initialData?.catatan || '',
      });
      setItems(initialData?.items && initialData.items.length > 0
        ? initialData.items.map(item => ({
            ...item,
            id: item.id || generateUUID(), // MODIFIED: Gunakan generateUUID
            quantity: Number(item.quantity) || 0,
            hargaSatuan: Number(item.hargaSatuan) || 0,
            totalHarga: Number(item.totalHarga) || 0,
          }))
        : [{ id: generateUUID(), nama: '', quantity: 1, hargaSatuan: 0, totalHarga: 0 }]); // MODIFIED: Gunakan generateUUID
      setPajakInput(initialData?.pajak || '');
      setIsSubmitting(false);
    }
  }, [open, initialData]);

  const handleInputChange = (field: string, value: string) => {
    if (isViewMode) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    if (isViewMode) return;
    setItems([...items, { id: generateUUID(), nama: '', quantity: 1, hargaSatuan: 0, totalHarga: 0 }]); // MODIFIED: Gunakan generateUUID
  };

  const removeItem = (id: string | number) => { // ID sekarang bisa string atau number dari UUID
    if (isViewMode) return;
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      toast.error('Pesanan harus memiliki setidaknya satu item.');
    }
  };

  const updateItem = (id: string | number, field: keyof OrderItem, value: string | number) => { // ID bisa string atau number
    if (isViewMode) return;
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const quantity = parseFloat(String(updatedItem.quantity)) || 0;
        const hargaSatuan = parseFloat(String(updatedItem.hargaSatuan)) || 0;
        
        updatedItem.totalHarga = quantity * hargaSatuan;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.totalHarga || 0), 0);
    const pajakValue = typeof pajakInput === 'number' ? pajakInput : parseFloat(String(pajakInput));
    const pajak = !isNaN(pajakValue) && pajakValue >= 0 ? pajakValue : subtotal * 0.1;
    const total = subtotal + pajak;
    return { subtotal, pajak, total };
  };

  const { subtotal, pajak, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) {
      toast.info('Tidak bisa menyimpan perubahan saat dalam mode Lihat Detail. Silakan masuk ke mode Edit.');
      return;
    }

    setIsSubmitting(true);

    if (!formData.namaPelanggan.trim() || !formData.teleponPelanggan.trim()) {
      toast.error('Nama dan Nomor Telepon pelanggan wajib diisi.');
      setIsSubmitting(false);
      return;
    }
    const validItems = items.filter(item =>
      item.nama?.trim() && parseFloat(String(item.quantity)) > 0 && parseFloat(String(item.hargaSatuan)) >= 0
    );

    if (validItems.length === 0) {
        toast.error('Pesanan harus memiliki setidaknya satu item yang valid (nama, jumlah > 0, harga >= 0).');
        setIsSubmitting(false);
        return;
    }

    const { subtotal: finalSubtotal, pajak: finalPajak, total: finalTotal } = calculateTotals();
    const commonData = {
        ...formData,
        items: validItems as OrderItem[],
        subtotal: finalSubtotal,
        pajak: finalPajak,
        totalPesanan: finalTotal
    };

    try {
        if (initialData) {
            const parsedInitialDate = safeParseDate(initialData.tanggal);
            const finalDate = parsedInitialDate || new Date(); 
            onSubmit({ ...initialData, tanggal: finalDate, ...commonData });
        } else {
            onSubmit({ ...commonData, tanggal: new Date() });
        }
    } catch (error) {
        console.error("Error submitting OrderForm:", error);
        toast.error("Terjadi kesalahan saat menyimpan pesanan.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-inter flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode ? 'Detail Pesanan' : (initialData ? 'Edit Pesanan' : 'Tambah Pesanan Baru')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="namaPelanggan">Nama Pelanggan *</Label>
              <Input 
                id="namaPelanggan" 
                value={formData.namaPelanggan} 
                onChange={(e) => handleInputChange('namaPelanggan', e.target.value)} 
                required 
                readOnly={isViewMode} 
                disabled={isSubmitting} 
              />
            </div>
            <div>
              <Label htmlFor="teleponPelanggan">Nomor Whatsapp *</Label>
              <Input 
                id="teleponPelanggan" 
                value={formData.teleponPelanggan} 
                onChange={(e) => handleInputChange('teleponPelanggan', e.target.value)} 
                required 
                readOnly={isViewMode} 
                disabled={isSubmitting} 
              />
            </div>
          </div>
          <div>
            <Label htmlFor="alamatPelanggan">Alamat Pengiriman</Label>
            <Textarea 
              id="alamatPelanggan" 
              value={formData.alamatPelanggan} 
              onChange={(e) => handleInputChange('alamatPelanggan', e.target.value)} 
              readOnly={isViewMode} 
              disabled={isSubmitting} 
              rows={2} 
            />
          </div>
          {/* Email Pelanggan (opsional) */}
          <div>
            <Label htmlFor="emailPelanggan">Email Pelanggan</Label>
            <Input 
              id="emailPelanggan" 
              type="email" 
              value={formData.emailPelanggan} 
              onChange={(e) => handleInputChange('emailPelanggan', e.target.value)} 
              readOnly={isViewMode} 
              disabled={isSubmitting} 
            />
          </div>
          {/* Status Pesanan (hanya untuk view/edit, bukan new order) */}
          {initialData && (
            <div>
              <Label htmlFor="status">Status Pesanan</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => handleInputChange('status', value)} 
                disabled={isViewMode || isSubmitting} 
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">Item Pesanan</Label>
              {!isViewMode && ( 
                <Button type="button" onClick={addItem} size="sm" className="h-8" disabled={isSubmitting}>
                  <Plus className="h-4 w-4 mr-1" /> Tambah
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-[300px] rounded-md border">
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] px-2">Nama</TableHead>
                      <TableHead className="px-1 text-center">Jml</TableHead>
                      <TableHead className="px-2">Harga</TableHead>
                      <TableHead className="text-right px-2">Total</TableHead>
                      {!isViewMode && <TableHead className="w-10 p-0"></TableHead>} 
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}> {/* Menggunakan item.id sebagai key */}
                        <TableCell className="font-medium p-1">
                          <Input 
                            value={item.nama || ''} 
                            onChange={(e) => updateItem(item.id!, 'nama', e.target.value)} 
                            className="h-8 px-2" 
                            readOnly={isViewMode} 
                            disabled={isSubmitting} 
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            type="number" 
                            value={item.quantity || ''} 
                            onChange={(e) => updateItem(item.id!, 'quantity', parseInt(e.target.value) || 0)} 
                            className="h-8 w-14 text-center px-1" 
                            readOnly={isViewMode} 
                            disabled={isSubmitting} 
                            min="0" 
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            type="number" 
                            value={item.hargaSatuan || ''} 
                            onChange={(e) => updateItem(item.id!, 'hargaSatuan', parseFloat(e.target.value) || 0)} 
                            className="h-8 px-2" 
                            readOnly={isViewMode} 
                            disabled={isSubmitting} 
                            min="0" 
                          />
                        </TableCell>
                        <TableCell className="text-right p-2 text-xs">
                          {formatCurrency(item.totalHarga || 0)}
                        </TableCell>
                        {!isViewMode && ( 
                          <TableCell className="p-0 text-center">
                            {items.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id!)} disabled={isSubmitting}>
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
          {/* Catatan Pesanan */}
          <div>
            <Label htmlFor="catatan">Catatan Pesanan</Label>
            <Textarea 
              id="catatan" 
              value={formData.catatan} 
              onChange={(e) => handleInputChange('catatan', e.target.value)} 
              readOnly={isViewMode} 
              disabled={isSubmitting} 
              rows={2} 
            />
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Pajak</span>
              <Input
                type="number"
                value={pajakInput}
                onChange={(e) => setPajakInput(e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="10%"
                className="h-8 w-24 text-right"
                readOnly={isViewMode} 
                disabled={isSubmitting} 
                min="0"
              />
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </form>

        {/* Tombol Footer - di luar form, jadi tetap di bawah */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting} 
          >
            {isViewMode ? 'Tutup' : 'Batal'} 
          </Button>
          {!isViewMode && ( 
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
            >
              {isSubmitting ? 
                (initialData ? 'Memperbarui...' : 'Membuat...') 
                : (initialData ? 'Update Pesanan' : 'Buat Pesanan')} 
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;