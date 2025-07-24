// hooks/usePromoState.ts - Promo State Management

import { useState, useCallback, useMemo } from 'react';
import { PromoFormState, FormErrors, UsePromoStateReturn } from '@/types';
import { DEFAULT_VALUES, VALIDATION_RULES } from '@/utils/constants';
import { DEBOUNCE } from '@/utils/constants';

// 🎯 Initial form state
const initialFormState: PromoFormState = {
  selectedRecipeId: '',
  promoType: DEFAULT_VALUES.PROMO_TYPE,
  discountValue: DEFAULT_VALUES.DISCOUNT_PERCENT,
  bogoBuy: DEFAULT_VALUES.BOGO_BUY,
  bogoGet: DEFAULT_VALUES.BOGO_GET,
  promoName: ''
};

// ✅ Validation functions
const validatePromoName = (name: string): string | undefined => {
  if (!name.trim()) {
    return 'Nama promo wajib diisi';
  }
  if (name.trim().length < VALIDATION_RULES.PROMO_NAME.MIN_LENGTH) {
    return `Nama promo minimal ${VALIDATION_RULES.PROMO_NAME.MIN_LENGTH} karakter`;
  }
  if (name.length > VALIDATION_RULES.PROMO_NAME.MAX_LENGTH) {
    return `Nama promo maksimal ${VALIDATION_RULES.PROMO_NAME.MAX_LENGTH} karakter`;
  }
  return undefined;
};

const validateDiscountPercent = (value: number): string | undefined => {
  if (value <= 0) {
    return 'Diskon harus lebih dari 0%';
  }
  if (value > VALIDATION_RULES.DISCOUNT_PERCENT.MAX) {
    return `Diskon maksimal ${VALIDATION_RULES.DISCOUNT_PERCENT.MAX}%`;
  }
  return undefined;
};

const validateDiscountRp = (value: number): string | undefined => {
  if (value <= 0) {
    return 'Diskon harus lebih dari 0';
  }
  if (value > VALIDATION_RULES.DISCOUNT_RP.MAX) {
    return `Diskon maksimal ${VALIDATION_RULES.DISCOUNT_RP.MAX.toLocaleString('id-ID')}`;
  }
  return undefined;
};

const validateBOGO = (buy: number, get: number): { buy?: string; get?: string } => {
  const errors: { buy?: string; get?: string } = {};
  
  if (buy < VALIDATION_RULES.BOGO.MIN_BUY) {
    errors.buy = `Minimal beli ${VALIDATION_RULES.BOGO.MIN_BUY}`;
  }
  if (buy > VALIDATION_RULES.BOGO.MAX_BUY) {
    errors.buy = `Maksimal beli ${VALIDATION_RULES.BOGO.MAX_BUY}`;
  }
  if (get < VALIDATION_RULES.BOGO.MIN_GET) {
    errors.get = `Minimal gratis ${VALIDATION_RULES.BOGO.MIN_GET}`;
  }
  if (get > VALIDATION_RULES.BOGO.MAX_GET) {
    errors.get = `Maksimal gratis ${VALIDATION_RULES.BOGO.MAX_GET}`;
  }
  
  return errors;
};

// 🎯 Main hook
export const usePromoState = (
  initialState?: Partial<PromoFormState>
): UsePromoStateReturn => {
  // 📊 Form state
  const [formState, setFormState] = useState<PromoFormState>(() => ({
    ...initialFormState,
    ...initialState
  }));

  // ⚠️ Error state
  const [errors, setErrors] = useState<FormErrors>({});

  // 🔄 Update form state
  const updateFormState = useCallback((updates: Partial<PromoFormState>) => {
    setFormState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // Clear related errors when values change
      const newErrors = { ...errors };
      Object.keys(updates).forEach(key => {
        delete newErrors[key];
      });
      
      // Special handling for promo type change
      if (updates.promoType && updates.promoType !== prevState.promoType) {
        // Reset discount value when changing promo type
        if (updates.promoType === 'discount_percent') {
          newState.discountValue = DEFAULT_VALUES.DISCOUNT_PERCENT;
        } else if (updates.promoType === 'discount_rp') {
          newState.discountValue = DEFAULT_VALUES.DISCOUNT_RP;
        }
        
        // Clear discount-related errors
        delete newErrors.discountValue;
        delete newErrors.bogoBuy;
        delete newErrors.bogoGet;
      }
      
      setErrors(newErrors);
      return newState;
    });
  }, [errors]);

  // 🧹 Reset form
  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setErrors({});
  }, []);

  // ✅ Validate form
  const validateForm = useCallback((state: PromoFormState): FormErrors => {
    const newErrors: FormErrors = {};

    // Validate recipe selection
    if (!state.selectedRecipeId) {
      newErrors.selectedRecipeId = 'Pilih produk terlebih dahulu';
    }

    // Validate promo name
    const promoNameError = validatePromoName(state.promoName);
    if (promoNameError) {
      newErrors.promoName = promoNameError;
    }

    // Validate based on promo type
    switch (state.promoType) {
      case 'discount_percent':
        const percentError = validateDiscountPercent(state.discountValue);
        if (percentError) {
          newErrors.discountValue = percentError;
        }
        break;

      case 'discount_rp':
        const rpError = validateDiscountRp(state.discountValue);
        if (rpError) {
          newErrors.discountValue = rpError;
        }
        break;

      case 'bogo':
        const bogoErrors = validateBOGO(state.bogoBuy, state.bogoGet);
        if (bogoErrors.buy) {
          newErrors.bogoBuy = bogoErrors.buy;
        }
        if (bogoErrors.get) {
          newErrors.bogoGet = bogoErrors.get;
        }
        break;
    }

    return newErrors;
  }, []);

  // 📊 Debounced validation
  const debouncedValidation = useMemo(
    () => debounce((state: PromoFormState) => {
      const validationErrors = validateForm(state);
      setErrors(validationErrors);
    }, 300),
    [validateForm]
  );

  // ✅ Check if form is valid
  const isValid = useMemo(() => {
    const currentErrors = validateForm(formState);
    return Object.keys(currentErrors).length === 0;
  }, [formState, validateForm]);

  // 🔄 Auto-validation when form state changes
  React.useEffect(() => {
    debouncedValidation(formState);
  }, [formState, debouncedValidation]);

  // 💾 Local storage persistence
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('promo_form_state', JSON.stringify(formState));
    } catch (error) {
      console.warn('Failed to save form state to localStorage:', error);
    }
  }, [formState]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('promo_form_state');
      if (saved) {
        const parsedState = JSON.parse(saved);
        setFormState(prevState => ({ ...prevState, ...parsedState }));
        return true;
      }
    } catch (error) {
      console.warn('Failed to load form state from localStorage:', error);
    }
    return false;
  }, []);

  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem('promo_form_state');
    } catch (error) {
      console.warn('Failed to clear form state from localStorage:', error);
    }
  }, []);

  // 📊 Form statistics
  const formStats = useMemo(() => {
    const totalFields = Object.keys(formState).length;
    const filledFields = Object.values(formState).filter(value => 
      value !== '' && value !== 0 && value !== null && value !== undefined
    ).length;
    const errorCount = Object.keys(errors).length;
    
    return {
      totalFields,
      filledFields,
      errorCount,
      completionPercent: Math.round((filledFields / totalFields) * 100),
      isComplete: filledFields === totalFields && errorCount === 0
    };
  }, [formState, errors]);

  // 🎯 Field-specific update functions
  const updateField = useCallback((field: keyof PromoFormState) => 
    (value: any) => updateFormState({ [field]: value }), 
    [updateFormState]
  );

  const setSelectedRecipeId = updateField('selectedRecipeId');
  const setPromoType = updateField('promoType');
  const setDiscountValue = updateField('discountValue');
  const setBogoBuy = updateField('bogoBuy');
  const setBogoGet = updateField('bogoGet');
  const setPromoName = updateField('promoName');

  // 🔧 Advanced state management
  const isDirty = useMemo(() => {
    return JSON.stringify(formState) !== JSON.stringify(initialFormState);
  }, [formState]);

  const hasChanges = useCallback((field?: keyof PromoFormState) => {
    if (field) {
      return formState[field] !== initialFormState[field];
    }
    return isDirty;
  }, [formState, isDirty]);

  const getFieldError = useCallback((field: keyof PromoFormState) => {
    return errors[field];
  }, [errors]);

  const clearFieldError = useCallback((field: keyof PromoFormState) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: keyof PromoFormState, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // 🎯 Bulk operations
  const updateMultipleFields = useCallback((updates: Partial<PromoFormState>) => {
    updateFormState(updates);
  }, [updateFormState]);

  const resetField = useCallback((field: keyof PromoFormState) => {
    updateFormState({ [field]: initialFormState[field] });
  }, [updateFormState]);

  const resetMultipleFields = useCallback((fields: Array<keyof PromoFormState>) => {
    const updates = fields.reduce((acc, field) => {
      acc[field] = initialFormState[field];
      return acc;
    }, {} as Partial<PromoFormState>);
    updateFormState(updates);
  }, [updateFormState]);

  return {
    // State
    formState,
    errors,
    isValid,
    isDirty,
    formStats,
    
    // Actions
    updateFormState,
    resetForm,
    
    // Field-specific setters
    setSelectedRecipeId,
    setPromoType,
    setDiscountValue,
    setBogoBuy,
    setBogoGet,
    setPromoName,
    
    // Advanced actions
    updateField,
    updateMultipleFields,
    resetField,
    resetMultipleFields,
    hasChanges,
    
    // Error management
    getFieldError,
    clearFieldError,
    setFieldError,
    
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    
    // Validation
    validateForm: () => validateForm(formState)
  };
};