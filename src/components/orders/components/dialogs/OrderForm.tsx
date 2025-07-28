// 🎯 200 lines - Order form dialog dengan semua logika asli
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Phone, Mail, MapPin, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Order, NewOrder, OrderItem } from '../../types';
import { ORDER_STATUSES, getStatusText } from '../../constants';
import { validateOrderData } from '../../utils';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Order> | Partial<NewOrder>) => void;
  initialData?: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData
}) => {
  const isEditMode = !!initialData;
  
  // Form state dengan semua field dari kode asli
  const [formData, setFormData] = useState({
    namaPelanggan: '',
    telefonPelanggan: '',
    emailPelanggan: '',
    alamatPengiriman: '',
    status: 'pending' as Order['status'],
    catatan: '',
    items: [] as OrderItem[],
    subtotal: 0,
    pajak: 0,
    totalPesanan: 0,
  });

  const [loading, setLoading] = useState(false);

  // Initialize form dengan data existing jika edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        namaPelanggan: initialData.namaPelanggan || '',
        telefonPelanggan: initialData.telefonPelanggan || '',
        emailPelanggan: initialData.emailPelanggan || '',
        alamatPengiriman: initialData.alamatPengiriman || '',
        status: initialData.status || 'pending',
        catatan: initialData.catatan || '',
        items: initialData.items || [],
        subtotal: initialData.subtotal || 0,
        pajak: initialData.pajak || 0,
        totalPesanan: initialData.totalPesanan || 0,
      });
    } else {
      // Reset form untuk mode baru
      setFormData({
        namaPelanggan: '',
        telefonPelanggan: '',
        emailPelanggan: '',
        alamatPengiriman: '',
        status: 'pending',
        catatan: '',
        items: [],
        subtotal: 0,
        pajak: 0,
        totalPesanan: 0,
      });
    }
  }, [initialData, open]);

  // Update form field
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add new item
  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Update item
  const updateItem = (itemId: string, field: keyof OrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total untuk item ini
          if (field === 'quantity' || field === 'price') {
            updatedItem.total = updatedItem.quantity * updatedItem.price;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Calculate totals seperti kode asli
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const pajak = subtotal * 0.1; // 10% tax
    const totalPesanan = subtotal + pajak;

    setFormData(prev => ({
      ...prev,
      subtotal,
      pajak,
      totalPesanan
    }));
  }, [formData.items]);

  // Handle submit dengan validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation seperti kode asli
    const validation = validateOrderData(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Gagal menyimpan pesanan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditMode ? 'Edit Pesanan' : 'Pesanan Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pelanggan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaPelanggan">Nama Pelanggan *</Label>
                <Input
                  id="namaPelanggan"
                  value={formData.namaPelanggan}
                  onChange={(e) => updateField('namaPelanggan', e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="telefonPelanggan">Telepon</Label>
                <Input
                  id="telefonPelanggan"
                  value={formData.telefonPelanggan}
                  onChange={(e) => updateField('telefonPelanggan', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              
              <div>
                <Label htmlFor="emailPelanggan">Email</Label>
                <Input
                  id="emailPelanggan"
                  type="email"
                  value={formData.emailPelanggan}
                  onChange={(e) => updateField('emailPelanggan', e.target.value)}
                  placeholder="Masukkan email pelanggan"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusText(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="alamatPengiriman">Alamat Pengiriman</Label>
              <Textarea
                id="alamatPengiriman"
                value={formData.alamatPengiriman}
                onChange={(e) => updateField('alamatPengiriman', e.target.value)}
                placeholder="Masukkan alamat lengkap pengiriman"
                rows={3}
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Item Pesanan</h3>
              <Button type="button" onClick={addItem} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Item
              </Button>
            </div>
            
            {formData.items.length > 0 ? (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Nama item"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Harga"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <div className="w-32 text-right font-semibold">
                      Rp {item.total.toLocaleString('id-ID')}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Belum ada item. Klik "Tambah Item" untuk menambahkan item pesanan.
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Calculator className="h-5 w-5" />
              Ringkasan Pesanan
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {formData.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (10%):</span>
                <span>Rp {formData.pajak.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>Rp {formData.totalPesanan.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <Label htmlFor="catatan">Catatan Tambahan</Label>
            <Textarea
              id="catatan"
              value={formData.catatan}
              onChange={(e) => updateField('catatan', e.target.value)}
              placeholder="Catatan atau instruksi khusus untuk pesanan ini"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.items.length === 0}
              className="min-w-[120px]"
            >
              {loading ? 'Menyimpan...' : (isEditMode ? 'Update Pesanan' : 'Buat Pesanan')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;