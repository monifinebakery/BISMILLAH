import React, 'useState', useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import type { Order, NewOrder, OrderItem } from '@/types/order';
import { toast } from 'sonner';
import { useRecipe } from '@/contexts/RecipeContext'; // Import hook resep
import { orderStatusList } from '@/constants/orderConstants';
import { formatCurrency } from '@/utils/currencyUtils';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: Partial<NewOrder> | Partial<Order>) => void;
  initialData?: Order | null;
}

const OrderForm = ({ open, onOpenChange, onSubmit, initialData }: OrderFormProps) => {
  const { recipes } = useRecipe(); // Ambil daftar resep dari context
  const [orderData, setOrderData] = useState<Partial<Order | NewOrder>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultData = {
        namaPelanggan: '', teleponPelanggan: '', emailPelanggan: '', alamatPengiriman: '',
        status: 'pending', catatan: '', items: [],
        subtotal: 0, pajak: 0, totalPesanan: 0,
      };
      setOrderData(initialData ? { ...defaultData, ...initialData } : defaultData);
    }
  }, [open, initialData]);

  const handleInputChange = (field: keyof (Order | NewOrder), value: any) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...(orderData.items || [])];
    const currentItem = { ...newItems[index] };
    
    if (field === 'recipe_id') {
      const selectedRecipe = recipes.find(r => r.id === value);
      if (selectedRecipe) {
        currentItem.recipe_id = selectedRecipe.id;
        currentItem.namaBarang = selectedRecipe.namaResep;
        currentItem.hargaSatuan = selectedRecipe.hargaJualPorsi;
      }
    } else {
      currentItem[field] = value;
    }
    
    currentItem.totalHarga = (currentItem.quantity || 0) * (currentItem.hargaSatuan || 0);
    newItems[index] = currentItem;
    handleInputChange('items', newItems);
  };
  
  const handleAddItem = () => {
    const newItem: OrderItem = { recipe_id: '', namaBarang: '', quantity: 1, hargaSatuan: 0, totalHarga: 0 };
    handleInputChange('items', [...(orderData.items || []), newItem]);
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = (orderData.items || []).filter((_, i) => i !== index);
    handleInputChange('items', newItems);
  };
  
  const calculatedTotal = useMemo(() => {
    return orderData.items?.reduce((sum, item) => sum + (item.totalHarga || 0), 0) || 0;
  }, [orderData.items]);

  useEffect(() => {
    handleInputChange('totalPesanan', calculatedTotal);
  }, [calculatedTotal]);
  
  const handleSubmit = async () => {
    if (!orderData.namaPelanggan?.trim() || !orderData.teleponPelanggan?.trim()) {
      toast.error('Nama Pelanggan dan Nomor Whatsapp wajib diisi.');
      return;
    }
    const validItems = orderData.items?.filter(item => item.recipe_id);
    if (!validItems || validItems.length === 0) {
      toast.error('Pesanan harus memiliki setidaknya satu item resep yang valid.');
      return;
    }

    setIsSubmitting(true);
    await onSubmit({ ...orderData, items: validItems });
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Pesanan' : 'Buat Pesanan Baru'}</DialogTitle>
          <DialogDescription>Pastikan item yang dipilih berasal dari resep agar stok terpotong otomatis.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Nama Pelanggan *</Label><Input value={orderData.namaPelanggan || ''} onChange={e => handleInputChange('namaPelanggan', e.target.value)} /></div>
            <div><Label>Nomor Whatsapp *</Label><Input value={orderData.teleponPelanggan || ''} onChange={e => handleInputChange('teleponPelanggan', e.target.value)} /></div>
          </div>
          <div className="sm:col-span-2"><Label>Alamat Pengiriman</Label><Textarea value={orderData.alamatPengiriman || ''} onChange={e => handleInputChange('alamatPengiriman', e.target.value)} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Email Pelanggan</Label><Input type="email" value={orderData.emailPelanggan || ''} onChange={e => handleInputChange('emailPelanggan', e.target.value)} /></div>
            <div><Label>Status Pesanan</Label>
              <Select value={orderData.status} onValueChange={val => handleInputChange('status', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{orderStatusList.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
              <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">Item Pesanan</h3><Button variant="outline" size="sm" onClick={handleAddItem}><Plus className="h-4 w-4 mr-2"/>Tambah Item</Button></div>
              <div className="space-y-2">
                  {(orderData.items || []).map((item, index) => (
                      <div key={index} className="grid grid-cols-[1fr,80px,120px,auto] gap-2 items-center">
                          <Select value={item.recipe_id} onValueChange={val => handleItemChange(index, 'recipe_id', val)}>
                              <SelectTrigger><SelectValue placeholder="Pilih Resep..."/></SelectTrigger>
                              <SelectContent>{recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.namaResep}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} />
                          <Input type="number" placeholder="Harga" value={item.hargaSatuan} readOnly />
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
                      </div>
                  ))}
              </div>
          </div>
          
          <div><Label>Catatan Pesanan</Label><Textarea value={orderData.catatan || ''} onChange={e => handleInputChange('catatan', e.target.value)} /></div>
        </div>
        
        <DialogFooter className="pt-4 border-t flex-col sm:flex-row sm:justify-between">
            <div className="text-lg font-bold">
                Total: {formatCurrency(calculatedTotal)}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : (initialData ? 'Update Pesanan' : 'Buat Pesanan')}</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;