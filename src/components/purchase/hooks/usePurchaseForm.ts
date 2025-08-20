// src/components/purchase/hooks/usePurchaseForm.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { Purchase, PurchaseFormData, PurchaseItem } from '../types/purchase.types';
import { validatePurchaseForm, ValidationResult } from '../utils/validation';
import { calculateItemSubtotal, calculatePurchaseTotal } from '../utils/purchaseTransformers';
import { usePurchase } from '../context/PurchaseContext';
import { logger } from '@/utils/logger';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';

interface UsePurchaseFormProps {
  mode: 'create' | 'edit';
  initialData?: Purchase | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UsePurchaseFormReturn {
  // Form data
  formData: PurchaseFormData;
  setFormData: (data: PurchaseFormData, skipValidation?: boolean) => void;
  updateFormField: (field: keyof PurchaseFormData, value: any) => void; // ✅ NEW


  // Form state
  isSubmitting: boolean;
  isDirty: boolean;

  // Validation
  validation: ValidationResult;
  validateField: (field: string) => void;
  validateForm: () => void; // NEW: Manual validation trigger

  // Items management
  addItem: (item: Omit<PurchaseItem, 'subtotal'>) => void;
  updateItem: (index: number, item: Partial<PurchaseItem>) => void;
  removeItem: (index: number) => void;

  // Form actions
  handleSubmit: (newStatus?: 'completed') => Promise<void>;
  handleReset: () => void;

  // Calculations
  totalValue: number;
}

const defaultFormData: PurchaseFormData = {
  supplier: '',
  tanggal: new Date(),
  items: [],
  // ✅ konsisten dengan transformer
  metodePerhitungan: 'AVERAGE',
};

export const usePurchaseForm = ({
  mode,
  initialData,
  onSuccess,
  onError,
}: UsePurchaseFormProps): UsePurchaseFormReturn => {
  // Dependencies
  const { addPurchase, updatePurchase } = usePurchase();
  const { bahanBaku: warehouseItems, updateBahanBaku } = useBahanBaku();

  // Form state
  const [formData, setFormDataState] = useState<PurchaseFormData>(() => {
    if (mode === 'edit' && initialData) {
      return {
        supplier: initialData.supplier,
        tanggal: initialData.tanggal,
        items: initialData.items,
        metodePerhitungan: initialData.metodePerhitungan ?? 'AVERAGE',
      };
    }
    return defaultFormData;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  // Ref for debounced validation
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate total value
  const totalValue = calculatePurchaseTotal(formData.items);

  // ✅ ULTRA LIGHTWEIGHT: Skip all validation for form field updates
  const setFormData = useCallback((data: PurchaseFormData, skipValidation = true) => { // Default skip!
    setFormDataState(data);
    setIsDirty(true);

    // ✅ ALWAYS SKIP validation for performance during typing
    if (skipValidation) return;

    // Only validate on explicit request (submit/blur)

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      const validationResult = validatePurchaseForm(data);
      setValidation(validationResult);
    }, 300);
  }, []); // ✅ FIXED: Empty deps to prevent re-creation

  // ✅ LIGHTWEIGHT: Direct field updater without validation
  const updateFormField = useCallback((field: keyof PurchaseFormData, value: any) => {
    if (field === 'supplier') {
      console.log('Updating supplier with value:', value);
    }
    setFormDataState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // NO validation during typing - only on submit

  }, []);

  // ✅ NEW: Manual validation trigger (untuk dipanggil saat submit atau blur)
  const validateForm = useCallback(() => {
    const validationResult = validatePurchaseForm(formData);
    setValidation(validationResult);
    return validationResult;
  }, [formData]);

  // Validate specific field (sederhana: re-validate seluruh form)
  const validateField = useCallback(
    (_field: string) => {
      setValidation(validatePurchaseForm(formData));
    },
    [formData]
  );

  // ✅ FIXED: Items management dengan stable references
  const addItem = useCallback(
    (item: Omit<PurchaseItem, 'subtotal'>) => {
      const newItem: PurchaseItem = {
        ...item,
        subtotal: calculateItemSubtotal(item.kuantitas, item.hargaSatuan),
      };

      setFormDataState(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setIsDirty(true);
      // Skip validation untuk operasi item
    },
    []
  );

  const updateItem = useCallback(
    (index: number, itemUpdate: Partial<PurchaseItem>) => {
      setFormDataState(prev => {
        const updatedItems = [...prev.items];
        const merged = { ...updatedItems[index], ...itemUpdate };

        // Recalculate subtotal if qty or price changed
        if (
          itemUpdate.kuantitas !== undefined ||
          itemUpdate.hargaSatuan !== undefined
        ) {
          merged.subtotal = calculateItemSubtotal(
            merged.kuantitas,
            merged.hargaSatuan
          );
        }

        updatedItems[index] = merged;
        return { ...prev, items: updatedItems };
      });
      setIsDirty(true);
      // Skip validation untuk operasi item
    },
    []
  );

  const removeItem = useCallback(
    (index: number) => {
      setFormDataState(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
      setIsDirty(true);
      // Skip validation untuk operasi item
    },
    []

  );

  // Form submission
  const handleSubmit = useCallback(async (newStatus?: 'completed') => {
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      onError?.(validationResult.errors[0]);
      return;
    }

    setIsSubmitting(true);

    // --- WAREHOUSE UPDATE LOGIC ---
    if (newStatus === 'completed') {
      try {
        for (const item of formData.items) {
          const warehouseItem = warehouseItems.find(wh => wh.id === item.bahanBakuId);
          if (warehouseItem) {
            const currentStock = warehouseItem.stok;
            const currentAvgPrice = warehouseItem.hargaRataRata;
            const newQty = item.kuantitas;
            const newPrice = item.hargaSatuan;

            const newStockTotal = currentStock + newQty;
            const newAvgPrice = ((currentStock * currentAvgPrice) + (newQty * newPrice)) / newStockTotal;

            await updateBahanBaku(warehouseItem.id, {
              stok: newStockTotal,
              hargaRataRata: newAvgPrice,
              harga: newPrice, // Update last purchase price
            });
          }
        }
      } catch (error) {
        logger.error('Warehouse update failed:', error);
        onError?.('Gagal memperbarui stok gudang. Pembelian tidak disimpan.');
        setIsSubmitting(false);
        return;
      }
    }
    // --- END WAREHOUSE UPDATE LOGIC ---

    try {
      const status = newStatus ?? (mode === 'edit' && initialData ? initialData.status : 'pending' as const);

      const purchaseData = {
        ...formData,
        totalNilai: totalValue,
        status,
      };

      let success = false;
      if (mode === 'create') {
        success = await addPurchase(purchaseData);
      } else if (mode === 'edit' && initialData) {
        success = await updatePurchase(initialData.id, purchaseData);
      }

      if (success) {
        setIsDirty(false);
        onSuccess?.();
      } else {
        onError?.('Gagal menyimpan pembelian');
      }
    } catch (error: any) {
      logger.error('Form submission error:', error);
      onError?.(error?.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData, 
    totalValue, 
    mode, 
    addPurchase, 
    updatePurchase, 
    initialData, 
    onSuccess, 
    onError, 
    validateForm,
    warehouseItems,
    updateBahanBaku
  ]);

  // Reset form
  const handleReset = useCallback(() => {
    if (mode === 'edit' && initialData) {
      setFormDataState({
        supplier: initialData.supplier,
        tanggal: initialData.tanggal,
        items: initialData.items,
        metodePerhitungan: initialData.metodePerhitungan ?? 'AVERAGE',
      });
    } else {
      setFormDataState(defaultFormData);
    }

    setIsDirty(false);
    setValidation({
      isValid: true,
      errors: [],
      warnings: [],
    });
  }, [mode, initialData]);

  // Cleanup pending validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Form data
    formData,
    setFormData,
    updateFormField,


    // Form state
    isSubmitting,
    isDirty,

    // Validation
    validation,
    validateField,
    validateForm,

    // Items management
    addItem,
    updateItem,
    removeItem,

    // Form actions
    handleSubmit,
    handleReset,

    // Calculations
    totalValue,
  };
};