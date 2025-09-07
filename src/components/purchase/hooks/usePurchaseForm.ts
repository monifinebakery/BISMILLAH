// src/components/purchase/hooks/usePurchaseForm.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { Purchase, PurchaseFormData, PurchaseItem } from '../types/purchase.types';
import { validatePurchaseForm, ValidationResult } from '../utils/validation';
import { calculateItemSubtotal, calculatePurchaseTotal } from '../utils/purchaseTransformers';
import { usePurchase } from './usePurchase';
import { useSupplierAutoSave } from './useSupplierAutoSave';
import { logger } from '@/utils/logger';

interface UsePurchaseFormProps {
  mode: 'create' | 'edit';
  initialData?: Purchase | null;
  suppliers?: Array<{ id: string; nama: string }> | null;
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
  keterangan: '',
};

export const usePurchaseForm = ({
  mode,
  initialData,
  suppliers,
  onSuccess,
  onError,
}: UsePurchaseFormProps): UsePurchaseFormReturn => {
  // Dependencies
  const { addPurchase, updatePurchase } = usePurchase();
  const { getOrCreateSupplierId } = useSupplierAutoSave();

  // Form data state
  const [formDataState, setFormDataState] = useState<PurchaseFormData>(() => {
    if (mode === 'edit' && initialData) {
      console.log('Initializing form with purchase data:', initialData);
      
      // Convert supplier ID to name for editing
      let supplierName = initialData.supplier;
      
      // If supplier looks like an ID (UUID pattern), try to find the supplier name
      if (initialData.supplier && initialData.supplier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Find supplier by ID to get the name
        const supplierFound = suppliers?.find(s => s.id === initialData.supplier);
        if (supplierFound) {
          supplierName = supplierFound.nama;
        }
      }
      
      const formData = {
        supplier: supplierName,
        tanggal: initialData.tanggal,
        items: initialData.items || [],
        metodePerhitungan: initialData.metodePerhitungan ?? 'AVERAGE',
        keterangan: initialData.keterangan || '',
      };
      
      console.log('Form initialized with:', formData);
      return formData;
    }
    
    console.log('Form initialized with default data for create mode');
    return defaultFormData;
  });
  
  // ✅ RE-INITIALIZE form when initialData changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      console.log('Re-initializing form due to initialData change:', initialData);
      
      // Convert supplier ID to name for editing
      let supplierName = initialData.supplier;
      
      // If supplier looks like an ID (UUID pattern), try to find the supplier name
      if (initialData.supplier && initialData.supplier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Find supplier by ID to get the name
        const supplierFound = suppliers?.find(s => s.id === initialData.supplier);
        if (supplierFound) {
          supplierName = supplierFound.nama;
        }
      }
      
      const formData = {
        supplier: supplierName,
        tanggal: initialData.tanggal,
        items: initialData.items || [],
        metodePerhitungan: initialData.metodePerhitungan ?? 'AVERAGE',
        keterangan: initialData.keterangan || '',
      };
      
      console.log('Form re-initialized with:', formData);
      setFormDataState(formData);
      setIsDirty(false); // Reset dirty state when reloading data
    }
  }, [mode, initialData, suppliers]);

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
  const totalValue = calculatePurchaseTotal(formDataState.items);

  // Expose form data with consistent name
  const formData = formDataState;

  // ✅ ULTRA LIGHTWEIGHT: Skip all validation for form field updates
  const setFormDataFn = useCallback((data: PurchaseFormData, skipValidation = true) => { // Default skip!
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

    try {
      const status = newStatus ?? (mode === 'edit' && initialData ? initialData.status : 'pending' as const);

      // ✅ AUTO-SAVE SUPPLIER: Handle supplier auto-save before purchase
      let supplierIdToUse = formData.supplier;
      
      // Check if supplier is a new name (not an existing ID)
      if (formData.supplier && !formData.supplier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // This looks like a supplier name, not an ID - try to auto-save
        logger.info('PurchaseForm', 'Auto-saving supplier:', formData.supplier);
        
        const savedSupplierId = await getOrCreateSupplierId(formData.supplier);
        if (savedSupplierId) {
          supplierIdToUse = savedSupplierId;
          logger.info('PurchaseForm', 'Supplier auto-saved with ID:', savedSupplierId);
        } else {
          logger.warn('PurchaseForm', 'Failed to auto-save supplier, using name as is');
          // Continue with supplier name - the backend should handle it
        }
      }

      const purchaseData = {
        ...formData,
        supplier: supplierIdToUse, // Use the resolved supplier ID or name
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
    getOrCreateSupplierId
  ]);

  // Reset form
  const handleReset = useCallback(() => {
    if (mode === 'edit' && initialData) {
      // Convert supplier ID to name when resetting, same as initialization
      let supplierName = initialData.supplier;
      
      if (initialData.supplier && initialData.supplier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const supplierFound = suppliers?.find(s => s.id === initialData.supplier);
        if (supplierFound) {
          supplierName = supplierFound.nama;
        }
      }
      
      setFormDataState({
        supplier: supplierName,
        tanggal: initialData.tanggal,
        items: initialData.items,
        metodePerhitungan: initialData.metodePerhitungan ?? 'AVERAGE',
        keterangan: initialData.keterangan || '',
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
  }, [mode, initialData, suppliers]);

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
    setFormData: setFormDataFn,
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