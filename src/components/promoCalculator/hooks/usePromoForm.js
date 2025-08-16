// 🎯 Custom hook untuk mengelola form promo

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { validation, storage } from '../utils';
import { PROMO_TYPES, DISCOUNT_TYPES } from '../constants';

export const usePromoForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    // Common fields
    namaPromo: '',
    deskripsi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    status: 'aktif',
    
    // BOGO fields
    resepUtama: '',
    resepGratis: '',
    minimalQty: 1,
    
    // Discount fields
    resep: '',
    tipeDiskon: DISCOUNT_TYPES.PERCENTAGE,
    nilaiDiskon: '',
    maksimalDiskon: '',
    minimalPembelian: '',
    
    // Bundle fields
    resepBundle: [],
    hargaBundle: '',
    
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Update form data
const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      // Auto-save to localStorage for draft using the exact next state
      storage.saveDraft(next);
      return next;
    });
    setIsDirty(true);
  }, []);

  // Validate form based on type
  const validateForm = useCallback((type = PROMO_TYPES.DISCOUNT, recipes = []) => {
    let validationResult;
    
    switch (type) {
      case PROMO_TYPES.BOGO:
        validationResult = validation.validateBogoConfig(
          formData.resepUtama,
          formData.resepGratis,
          recipes,
          formData.minimalQty
        );
        break;
        
      case PROMO_TYPES.DISCOUNT:
        validationResult = validation.validateDiscountConfig(
          formData.resep,
          formData.tipeDiskon,
          formData.nilaiDiskon,
          recipes,
          formData.maksimalDiskon
        );
        break;
        
      case PROMO_TYPES.BUNDLE:
        validationResult = validation.validateBundleConfig(
          formData.resepBundle,
          formData.hargaBundle,
          recipes
        );
        break;
        
      default:
        validationResult = { isValid: false, errors: ['Tipe promo tidak valid'] };
    }

    // Validate common fields
    const nameValidation = validation.validatePromoName(formData.namaPromo);
    if (!nameValidation.isValid) {
      validationResult.errors.push(...nameValidation.errors);
      validationResult.isValid = false;
    }

    const dateValidation = validation.validateDateRange(formData.tanggalMulai, formData.tanggalSelesai);
    if (!dateValidation.isValid) {
      validationResult.errors.push(...dateValidation.errors);
      validationResult.isValid = false;
    }

    setErrors(validationResult.errors.reduce((acc, error) => {
      acc[error] = true;
      return acc;
    }, {}));

    return validationResult;
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      namaPromo: '',
      deskripsi: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      status: 'aktif',
      resepUtama: '',
      resepGratis: '',
      minimalQty: 1,
      resep: '',
      tipeDiskon: DISCOUNT_TYPES.PERCENTAGE,
      nilaiDiskon: '',
      maksimalDiskon: '',
      minimalPembelian: '',
      resepBundle: [],
      hargaBundle: ''
    });
    setErrors({});
    setIsDirty(false);
    storage.clearDraft();
  }, []);

  // Load draft on mount
  useEffect(() => {
    const draft = storage.loadDraft();
    if (draft && Object.keys(draft).length > 1) { // More than just timestamp
      setFormData(prev => ({ ...prev, ...draft }));
      setIsDirty(true);
    }
  }, []);

  // Show notification when form is auto-saved
  const showSaveNotification = useCallback(() => {
    if (isDirty) {
      toast.success('Draft otomatis tersimpan', {
        duration: 2000,
        position: 'bottom-right'
      });
    }
  }, [isDirty]);

  return {
    formData,
    errors,
    isDirty,
    updateFormData,
    validateForm,
    resetForm,
    showSaveNotification,
    hasErrors: Object.keys(errors).length > 0
  };
};