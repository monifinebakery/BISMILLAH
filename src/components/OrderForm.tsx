// src/components/orders/components/OrderForm.tsx
// MODULAR VERSION - Integrated with Orders System

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Import modular orders types and utils
import { Order, NewOrder, OrderItem } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { generateOrderNumber } from '@/utils/formatUtils';
import { orderStatusList } from '@/components/orders/components/constants/orderConstants';

// Context imports
import { useRecipe } from '@/contexts/RecipeContext';

interface Recipe {
  id: string;
  namaResep: string;
  hargaJualPorsi: number;
  stok?: number;
}

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: Partial<NewOrder> | Partial<Order>) => Promise<void>;
  initialData?: Order | null;
  isSubmitting?: boolean;
}

// Custom hook for order form state management
const useOrderFormState = (initialData: Order | null, open: boolean) => {
  const [orderData, setOrderData] = useState<Partial<Order | NewOrder>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultData = useMemo(() => ({
    namaPelanggan: '',
    telefonPelanggan: '',
    emailPelanggan: '',
    alamatPengiriman: '',
    status: 'pending' as const,
    catatan: '',
    items: [] as OrderItem[],
    subtotal: 0,
    pajak: 0,
    totalPesanan: 0,
    tanggal: new Date(),
  }), []);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setOrderData({ ...defaultData, ...initialData });
      } else {
        setOrderData(defaultData);
      }
      setErrors({});
    }
  }, [open, initialData, defaultData]);

  const updateField = useCallback((field: keyof (Order | NewOrder), value: any) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const validateField = useCallback((field: string, value: any): string => {
    switch (field) {
      case 'namaPelanggan':
        if (!value || !value.trim()) return 'Nama pelanggan wajib diisi';
        if (value.trim().length < 2) return 'Nama pelanggan minimal 2 karakter';
        return '';
      case 'telefonPelanggan':
        if (!value || !value.trim()) return 'Nomor telepon wajib diisi';
        if (!/^[\d\s\-\+\(\)]{10,}$/.test(value.trim())) return 'Format nomor telepon tidak valid';
        return '';
      case 'emailPelanggan':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Format email tidak valid';
        }
        return '';
      case 'items':
        if (!value || !Array.isArray(value) || value.length === 0) {
          return 'Pesanan harus memiliki minimal satu item';
        }
        const validItems = value.filter(item => item.recipe_id && item.quantity > 0);
        if (validItems.length === 0) {
          return 'Pesanan harus memiliki minimal satu item yang valid';
        }
        return '';
      default:
        return '';
    }
  }, []);

  return {
    orderData,
    errors,
    updateField,
    setFieldError,
    validateField
  };
};

// Custom hook for order items management
const useOrderItems = (
  orderData: Partial<Order | NewOrder>,
  updateField: (field: keyof (Order | NewOrder), value: any) => void,
  recipes: Recipe[]
) => {
  const handleItemChange = useCallback((index: number, field: keyof OrderItem, value: any) => {
    const items = orderData.items || [];
    const newItems = [...items];
    const currentItem = { ...newItems[index] };
    
    if (field === 'recipe_id') {
      const selectedRecipe = recipes.find(r => r.id === value);
      if (selectedRecipe) {
        currentItem.recipe_id = selectedRecipe.id;
        currentItem.namaBarang = selectedRecipe.namaResep;
        currentItem.hargaSatuan = selectedRecipe.hargaJualPorsi;
        // Auto-set quantity to 1 if not set
        if (!currentItem.quantity) {
          currentItem.quantity = 1;
        }
      }
    } else {
      currentItem[field] = value;
    }
    
    // Recalculate total for this item
    currentItem.totalHarga = (currentItem.quantity || 0) * (currentItem.hargaSatuan || 0);
    newItems[index] = currentItem;
    updateField('items', newItems);
  }, [orderData.items, updateField, recipes]);

  const handleAddItem = useCallback(() => {
    const newItem: OrderItem = {
      recipe_id: '',
      namaBarang: '',
      quantity: 1,
      hargaSatuan: 0,
      totalHarga: 0
    };
    const items = orderData.items || [];
    updateField('items', [...items, newItem]);
  }, [orderData.items, updateField]);

  const handleRemoveItem = useCallback((index: number) => {
    const items = orderData.items || [];
    const newItems = items.filter((_, i) => i !== index);
    updateField('items', newItems);
  }, [orderData.items, updateField]);

  const calculateTotals = useMemo(() => {
    const items = orderData.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.totalHarga || 0), 0);
    const pajak = orderData.pajak || 0;
    const total = subtotal + pajak;
    
    return { subtotal, pajak, total };
  }, [orderData.items, orderData.pajak]);

  return {
    handleItemChange,
    handleAddItem,
    handleRemoveItem,
    calculateTotals
  };
};

const OrderForm: React.FC<OrderFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) => {
  const { recipes = [] } = useRecipe();
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  // Custom hooks
  const formState = useOrderFormState(initialData, open);
  const itemsManagement = useOrderItems(formState.orderData, formState.updateField, recipes);

  const { orderData, errors, updateField, validateField } = formState;
  const { handleItemChange, handleAddItem, handleRemoveItem, calculateTotals } = itemsManagement;

  // Update totals when items change
  useEffect(() => {
    updateField('subtotal', calculateTotals.subtotal);
    updateField('totalPesanan', calculateTotals.total);
  }, [calculateTotals.subtotal, calculateTotals.total, updateField]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const fieldsToValidate = ['namaPelanggan', 'telefonPelanggan', 'emailPelanggan', 'items'];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const value = orderData[field as keyof typeof orderData];
      const error = validateField(field, value);
      if (error) {
        formState.setFieldError(field, error);
        isValid = false;
      }
    });

    // Validate individual items
    const items = orderData.items || [];
    items.forEach((item, index) => {
      if (!item.recipe_id) {
        formState.setFieldError(`item_${index}`, 'Pilih resep untuk item ini');
        isValid = false;
      }
      if (!item.quantity || item.quantity <= 0) {
        formState.setFieldError(`item_quantity_${index}`, 'Quantity harus lebih dari 0');
        isValid = false;
      }
    });

    return isValid;
  }, [orderData, validateField, formState.setFieldError]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Harap lengkapi semua field yang wajib diisi');
      return;
    }

    const validItems = (orderData.items || []).filter(item => 
      item.recipe_id && item.quantity && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error('Pesanan harus memiliki setidaknya satu item yang valid');
      return;
    }

    setInternalSubmitting(true);
    
    try {
      const submitData = {
        ...orderData,
        items: validItems,
        // Generate order number for new orders
        ...(initialData ? {} : { nomorPesanan: generateOrderNumber() })
      };

      await onSubmit(submitData);
      
      // Close dialog on successful submission
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Gagal menyimpan pesanan');
    } finally {
      setInternalSubmitting(false);
    }
  }, [validateForm, orderData, initialData, onSubmit, onOpenChange]);

  const isProcessing = isSubmitting || internalSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {initialData ? 'Edit Pesanan' : 'Buat Pesanan Baru'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Pastikan item yang dipilih berasal dari resep agar stok terpotong otomatis saat pesanan selesai.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Informasi Pelanggan</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaPelanggan" className="font-medium">
                  Nama Pelanggan *
                </Label>
                <Input
                  id="namaPelanggan"
                  value={orderData.namaPelanggan || ''}
                  onChange={e => updateField('namaPelanggan', e.target.value)}
                  disabled={isProcessing}
                  className={errors.namaPelanggan ? 'border-red-500' : ''}
                  placeholder="Masukkan nama pelanggan"
                />
                {errors.namaPelanggan && (
                  <p className="text-sm text-red-600 mt-1">{errors.namaPelanggan}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="telefonPelanggan" className="font-medium">
                  Nomor Telepon *
                </Label>
                <Input
                  id="telefonPelanggan"
                  value={orderData.telefonPelanggan || ''}
                  onChange={e => updateField('telefonPelanggan', e.target.value)}
                  disabled={isProcessing}
                  className={errors.telefonPelanggan ? 'border-red-500' : ''}
                  placeholder="Contoh: 08123456789"
                />
                {errors.telefonPelanggan && (
                  <p className="text-sm text-red-600 mt-1">{errors.telefonPelanggan}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="emailPelanggan" className="font-medium">
                Email Pelanggan (Opsional)
              </Label>
              <Input
                id="emailPelanggan"
                type="email"
                value={orderData.emailPelanggan || ''}
                onChange={e => updateField('emailPelanggan', e.target.value)}
                disabled={isProcessing}
                className={errors.emailPelanggan ? 'border-red-500' : ''}
                placeholder="contoh@email.com"
              />
              {errors.emailPelanggan && (
                <p className="text-sm text-red-600 mt-1">{errors.emailPelanggan}</p>
              )}
            </div>

            <div>
              <Label htmlFor="alamatPengiriman" className="font-medium">
                Alamat Pengiriman
              </Label>
              <Textarea
                id="alamatPengiriman"
                value={orderData.alamatPengiriman || ''}
                onChange={e => updateField('alamatPengiriman', e.target.value)}
                disabled={isProcessing}
                placeholder="Masukkan alamat lengkap untuk pengiriman"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status" className="font-medium">
                Status Pesanan
              </Label>
              <Select 
                value={orderData.status} 
                onValueChange={(value) => updateField('status', value)}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status pesanan" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatusList.map(status => (
                    <SelectItem key={status.key} value={status.key}>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${status.bgColor.replace('bg-', 'bg-')}`}
                        />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 border-b pb-2 flex-1">
                Item Pesanan
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={isProcessing}
                className="ml-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </div>

            {errors.items && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.items}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {(orderData.items || []).map((item, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-[1fr,100px,120px,auto] gap-3 items-center p-3 border rounded-lg bg-gray-50"
                >
                  <div>
                    <Select
                      value={item.recipe_id}
                      onValueChange={(value) => handleItemChange(index, 'recipe_id', value)}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className={errors[`item_${index}`] ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih Resep..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map(recipe => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            <div className="flex flex-col">
                              <span>{recipe.namaResep}</span>
                              <span className="text-xs text-gray-500">
                                {formatCurrency(recipe.hargaJualPorsi)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`item_${index}`] && (
                      <p className="text-xs text-red-600 mt-1">{errors[`item_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                      disabled={isProcessing}
                      min="1"
                      className={errors[`item_quantity_${index}`] ? 'border-red-500' : ''}
                    />
                    {errors[`item_quantity_${index}`] && (
                      <p className="text-xs text-red-600 mt-1">{errors[`item_quantity_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      type="text"
                      value={formatCurrency(item.hargaSatuan || 0)}
                      readOnly
                      className="bg-gray-100 text-gray-600"
                      title="Harga otomatis dari resep"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={isProcessing}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {(!orderData.items || orderData.items.length === 0) && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p>Belum ada item pesanan</p>
                  <p className="text-sm">Klik "Tambah Item" untuk menambah item pertama</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="catatan" className="font-medium">
              Catatan Pesanan (Opsional)
            </Label>
            <Textarea
              id="catatan"
              value={orderData.catatan || ''}
              onChange={e => updateField('catatan', e.target.value)}
              disabled={isProcessing}
              placeholder="Tambahkan catatan khusus untuk pesanan ini..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t flex-col sm:flex-row sm:justify-between">
          <div className="text-lg font-bold text-gray-800 mb-3 sm:mb-0">
            Total: {formatCurrency(calculateTotals.total)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                initialData ? 'Update Pesanan' : 'Buat Pesanan'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;