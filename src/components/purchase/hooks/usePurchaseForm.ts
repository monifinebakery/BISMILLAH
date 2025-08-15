// src/components/purchase/hooks/usePurchaseForm.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { Purchase, PurchaseFormData, PurchaseItem } from '../types/purchase.types';
import { validatePurchaseForm, ValidationResult } from '../utils/validation';
import { calculateItemSubtotal, calculatePurchaseTotal } from '../utils/purchaseTransformers';
import { usePurchase } from '../context/PurchaseContext';
import { logger } from '@/utils/logger';

interface UsePurchaseFormProps {
  mode: 'create' | 'edit';
  initialData?: Purchase | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UsePurchaseFormReturn {
  // Form data
  formData: PurchaseFormData;
  setFormData: (data: PurchaseFormData) => void;
  
  // Form state
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Validation
  validation: ValidationResult;
  validateField: (field: string) => void;
  
  // Items management
  addItem: (item: Omit<PurchaseItem, 'subtotal'>) => void;
  updateItem: (index: number, item: Partial<PurchaseItem>) => void;
  removeItem: (index: number) => void;
  
  // Form actions
  handleSubmit: () => Promise<void>;
  handleReset: () => void;
  
  // Calculations
  totalValue: number;
}

const defaultFormData: PurchaseFormData = {
  supplier: '',
  tanggal: new Date(),
  items: [],
  metodePerhitungan: 'FIFO',
};

export const usePurchaseForm = ({
  mode,
  initialData,
  onSuccess,
  onError,
}: UsePurchaseFormProps): UsePurchaseFormReturn => {
  // Dependencies
  const { addPurchase, updatePurchase } = usePurchase();

  // Form state
  const [formData, setFormDataState] = useState<PurchaseFormData>(() => {
    if (mode === 'edit' && initialData) {
      return {
        supplier: initialData.supplier,
        tanggal: initialData.tanggal,
        items: initialData.items,
        metodePerhitungan: initialData.metodePerhitungan,
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

  // Update form data with side effects
  const setFormData = useCallback((data: PurchaseFormData) => {
    setFormDataState(data);
    setIsDirty(true);

    // Debounce validation to avoid lag on fast typing
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      const validationResult = validatePurchaseForm(data);
      setValidation(validationResult);
    }, 300);
  }, []);

  // Validate specific field
  const validateField = useCallback((field: string) => {
    const validationResult = validatePurchaseForm(formData);
    setValidation(validationResult);
  }, [formData]);

  // Items management
  const addItem = useCallback((item: Omit<PurchaseItem, 'subtotal'>) => {
    const newItem: PurchaseItem = {
      ...item,
      subtotal: calculateItemSubtotal(item.kuantitas, item.hargaSatuan),
    };

    const newItems = [...formData.items, newItem];
    const updatedFormData = {
      ...formData,
      items: newItems,
    };

    setFormData(updatedFormData);
  }, [formData, setFormData]);

  const updateItem = useCallback((index: number, itemUpdate: Partial<PurchaseItem>) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      ...itemUpdate,
    };

    // Recalculate subtotal if quantity or price changed
    if (itemUpdate.kuantitas !== undefined || itemUpdate.hargaSatuan !== undefined) {
      updatedItems[index].subtotal = calculateItemSubtotal(
        updatedItems[index].kuantitas,
        updatedItems[index].hargaSatuan
      );
    }

    const updatedFormData = {
      ...formData,
      items: updatedItems,
    };

    setFormData(updatedFormData);
  }, [formData, setFormData]);

  const removeItem = useCallback((index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const updatedFormData = {
      ...formData,
      items: updatedItems,
    };

    setFormData(updatedFormData);
  }, [formData, setFormData]);

  // Form submission
  const handleSubmit = useCallback(async () => {
    // Final validation
    const validationResult = validatePurchaseForm(formData);
    setValidation(validationResult);

    if (!validationResult.isValid) {
      onError?.(validationResult.errors[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const purchaseData = {
        ...formData,
        totalNilai: totalValue,
        status: 'pending' as const,
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
      onError?.(error.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, totalValue, mode, addPurchase, updatePurchase, initialData, onSuccess, onError]);

  // Reset form
  const handleReset = useCallback(() => {
    if (mode === 'edit' && initialData) {
      setFormDataState({
        supplier: initialData.supplier,
        tanggal: initialData.tanggal,
        items: initialData.items,
        metodePerhitungan: initialData.metodePerhitungan,
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

  // Initial validation on mount
  useEffect(() => {
    const validationResult = validatePurchaseForm(formData);
    setValidation(validationResult);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup pending validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Update total in form data when items change
  useEffect(() => {
    const newTotal = calculatePurchaseTotal(formData.items);
    if (Math.abs(newTotal - totalValue) > 0.01) {
      setFormDataState(current => ({
        ...current,
        // Note: We don't store totalNilai in formData since it's calculated
      }));
    }
  }, [formData.items, totalValue]);

  return {
    // Form data
    formData,
    setFormData,
    
    // Form state
    isSubmitting,
    isDirty,
    
    // Validation
    validation,
    validateField,
    
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