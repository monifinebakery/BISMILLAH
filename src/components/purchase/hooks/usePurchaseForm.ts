import { useState, useCallback } from 'react';
import { Purchase, PurchaseItem } from '@/types/supplier';
import { validateItemForm, ItemFormData } from '../services/purchaseValidators';
import { generateUUID } from '@/utils/uuid';
import { toast } from 'sonner';

export interface PurchaseFormState {
  supplier: string;
  tanggal: Date;
  items: PurchaseItem[];
  status: 'pending' | 'completed' | 'cancelled';
}

export interface ItemFormState {
  namaBarang: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
}

export const usePurchaseForm = (initialData?: Purchase) => {
  // Form state
  const [formData, setFormData] = useState<PurchaseFormState>({
    supplier: initialData?.supplier || '',
    tanggal: initialData?.tanggal ? new Date(initialData.tanggal) : new Date(),
    items: initialData?.items || [],
    status: (initialData?.status as any) || 'pending',
  });

  // Item form state
  const [itemForm, setItemForm] = useState<ItemFormState>({
    namaBarang: '',
    jumlah: 0,
    satuan: '',
    hargaSatuan: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Update form field
   */
  const updateField = useCallback(<K extends keyof PurchaseFormState>(
    field: K,
    value: PurchaseFormState[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Update item form field
   */
  const updateItemField = useCallback(<K extends keyof ItemFormState>(
    field: K,
    value: ItemFormState[K]
  ) => {
    setItemForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Auto-fill item form from bahan baku selection
   */
  const selectBahanBaku = useCallback((bahanBaku: any) => {
    setItemForm(prev => ({
      ...prev,
      namaBarang: bahanBaku.nama,
      satuan: bahanBaku.satuan || '',
      hargaSatuan: bahanBaku.hargaSatuan || 0,
    }));
  }, []);

  /**
   * Add item to purchase
   */
  const addItem = useCallback(() => {
    // Validate item form
    const validation = validateItemForm(itemForm);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    const newItem: PurchaseItem = {
      id: generateUUID(),
      namaBarang: itemForm.namaBarang,
      jumlah: itemForm.jumlah,
      satuan: itemForm.satuan,
      hargaSatuan: itemForm.hargaSatuan,
      totalHarga: itemForm.jumlah * itemForm.hargaSatuan,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Reset item form
    setItemForm({
      namaBarang: '',
      jumlah: 0,
      satuan: '',
      hargaSatuan: 0,
    });

    toast.success('Item berhasil ditambahkan.');
    return true;
  }, [itemForm]);

  /**
   * Remove item from purchase
   */
  const removeItem = useCallback((itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
    toast.success('Item berhasil dihapus.');
  }, []);

  /**
   * Update existing item
   */
  const updateItem = useCallback((itemId: string, updatedItem: Partial<PurchaseItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, ...updatedItem };
          // Recalculate total if quantity or price changed
          if (updatedItem.jumlah !== undefined || updatedItem.hargaSatuan !== undefined) {
            updated.totalHarga = updated.jumlah * updated.hargaSatuan;
          }
          return updated;
        }
        return item;
      }),
    }));
  }, []);

  /**
   * Calculate total purchase value
   */
  const calculateTotal = useCallback(() => {
    return formData.items.reduce((sum, item) => sum + item.totalHarga, 0);
  }, [formData.items]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      supplier: initialData?.supplier || '',
      tanggal: initialData?.tanggal ? new Date(initialData.tanggal) : new Date(),
      items: initialData?.items || [],
      status: (initialData?.status as any) || 'pending',
    });
    setItemForm({
      namaBarang: '',
      jumlah: 0,
      satuan: '',
      hargaSatuan: 0,
    });
    setIsSubmitting(false);
  }, [initialData]);

  /**
   * Load existing purchase data
   */
  const loadPurchase = useCallback((purchase: Purchase) => {
    setFormData({
      supplier: purchase.supplier,
      tanggal: purchase.tanggal instanceof Date ? purchase.tanggal : new Date(purchase.tanggal),
      items: purchase.items || [],
      status: purchase.status as any,
    });
  }, []);

  /**
   * Check if form has changes
   */
  const hasChanges = useCallback(() => {
    if (!initialData) return formData.items.length > 0 || formData.supplier !== '';
    
    return (
      formData.supplier !== initialData.supplier ||
      formData.tanggal.getTime() !== new Date(initialData.tanggal).getTime() ||
      formData.status !== initialData.status ||
      JSON.stringify(formData.items) !== JSON.stringify(initialData.items)
    );
  }, [formData, initialData]);

  /**
   * Get form validation errors
   */
  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];

    if (!formData.supplier.trim()) {
      errors.push('Supplier wajib dipilih');
    }

    if (formData.items.length === 0) {
      errors.push('Minimal satu item wajib ditambahkan');
    }

    return errors;
  }, [formData]);

  /**
   * Check if form is valid
   */
  const isFormValid = useCallback(() => {
    return getValidationErrors().length === 0;
  }, [getValidationErrors]);

  return {
    // State
    formData,
    itemForm,
    isSubmitting,
    setIsSubmitting,

    // Form actions
    updateField,
    updateItemField,
    selectBahanBaku,
    addItem,
    removeItem,
    updateItem,
    resetForm,
    loadPurchase,

    // Computed values
    totalValue: calculateTotal(),
    hasChanges: hasChanges(),
    isFormValid: isFormValid(),
    validationErrors: getValidationErrors(),

    // Item form validation
    isItemFormValid: validateItemForm(itemForm).isValid,
    itemFormErrors: validateItemForm(itemForm).errors,
  };
};