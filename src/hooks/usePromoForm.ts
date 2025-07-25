// hooks/usePromoForm.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePromoValidation } from './usePromoValidation';

interface PromoFormData {
  selectedRecipeId: string;
  promoType: string;
  discountValue: number;
  bogoBuy: number;
  bogoGet: number;
  promoName: string;
}

interface PromoFormOptions {
  initialData?: Partial<PromoFormData>;
  autoSave?: boolean;
  autoSaveDelay?: number;
  validateOnChange?: boolean;
  resetOnSubmit?: boolean;
}

interface FormField {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

interface FormState {
  selectedRecipeId: FormField;
  promoType: FormField;
  discountValue: FormField;
  bogoBuy: FormField;
  bogoGet: FormField;
  promoName: FormField;
}

export const usePromoForm = (
  selectedRecipe: any,
  promoResult: any,
  options: PromoFormOptions = {}
) => {
  const {
    initialData = {},
    autoSave = false,
    autoSaveDelay = 2000,
    validateOnChange = true,
    resetOnSubmit = true
  } = options;

  // 📊 Form state initialization
  const createInitialState = useCallback((): FormState => ({
    selectedRecipeId: {
      value: initialData.selectedRecipeId || '',
      touched: false,
      dirty: false
    },
    promoType: {
      value: initialData.promoType || 'discount_percent',
      touched: false,
      dirty: false
    },
    discountValue: {
      value: initialData.discountValue || 0,
      touched: false,  
      dirty: false
    },
    bogoBuy: {
      value: initialData.bogoBuy || 2,
      touched: false,
      dirty: false
    },
    bogoGet: {
      value: initialData.bogoGet || 1,
      touched: false,
      dirty: false
    },
    promoName: {
      value: initialData.promoName || '',
      touched: false,
      dirty: false
    }
  }), [initialData]);

  const [formState, setFormState] = useState<FormState>(createInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // 🎯 Get form values  
  const formValues: PromoFormData = {
    selectedRecipeId: formState.selectedRecipeId.value,
    promoType: formState.promoType.value,
    discountValue: formState.discountValue.value,  
    bogoBuy: formState.bogoBuy.value,
    bogoGet: formState.bogoGet.value,
    promoName: formState.promoName.value
  };

  // ✅ Validation
  const validation = usePromoValidation({
    promoName: formValues.promoName,
    selectedRecipe,
    promoType: formValues.promoType,
    discountValue: formValues.discountValue,
    bogoBuy: formValues.bogoBuy,
    bogoGet: formValues.bogoGet,
    promoResult
  });

  // 🔄 Update field
  const updateField = useCallback((
    fieldName: keyof FormState, 
    value: any, 
    options: { validate?: boolean; touch?: boolean } = {}
  ) => {
    const { validate = validateOnChange, touch = true } = options;

    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        touched: touch ? true : prev[fieldName].touched,
        dirty: true,
        error: validate ? undefined : prev[fieldName].error // Clear error if validating
      }
    }));

    // 🔍 Field-level validation
    if (validate) {
      setTimeout(() => {
        // Validation will be handled by usePromoValidation hook
        // This timeout allows state to update first
      }, 0);
    }

    // 💾 Auto-save
    if (autoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, autoSaveDelay);
    }
  }, [validateOnChange, autoSave, autoSaveDelay]);

  // 📝 Field setters
  const setSelectedRecipeId = useCallback((value: string) => {
    updateField('selectedRecipeId', value);
  }, [updateField]);

  const setPromoType = useCallback((value: string) => {
    updateField('promoType', value);
    // Reset related fields when promo type changes
    if (value !== formValues.promoType) {
      updateField('discountValue', 0, { validate: false });
    }
  }, [updateField, formValues.promoType]);

  const setDiscountValue = useCallback((value: number) => {
    updateField('discountValue', value);
  }, [updateField]);

  const setBogoBuy = useCallback((value: number) => {
    updateField('bogoBuy', Math.max(1, value));
  }, [updateField]);

  const setBogoGet = useCallback((value: number) => {
    updateField('bogoGet', Math.max(0, value));
  }, [updateField]);

  const setPromoName = useCallback((value: string) => {
    updateField('promoName', value);
  }, [updateField]);

  // 🎯 Touch field
  const touchField = useCallback((fieldName: keyof FormState) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true
      }
    }));
  }, []);

  // 🧹 Reset form
  const resetForm = useCallback((newInitialData?: Partial<PromoFormData>) => {
    const resetData = newInitialData || initialData;
    setFormState(createInitialState());
    setSubmitCount(0);
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    toast.success('Form direset');
  }, [initialData, createInitialState]);

  // 📊 Form state helpers
  const isFormDirty = Object.values(formState).some(field => field.dirty);
  const isFormTouched = Object.values(formState).some(field => field.touched);
  const hasFieldErrors = Object.values(formState).some(field => field.error);

  // 💾 Auto-save handler
  const handleAutoSave = useCallback(async () => {
    if (!validation.canSave || !isFormDirty) return;
    
    try {
      // Save draft to localStorage or send to server
      const draftData = {
        ...formValues,
        savedAt: new Date().toISOString(),
        autoSaved: true
      };
      
      localStorage.setItem('promo_form_draft', JSON.stringify(draftData));
      toast.success('Draft tersimpan otomatis', { 
        duration: 2000,
        id: 'auto-save'
      });
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [validation.canSave, isFormDirty, formValues]);

  // 📤 Submit handler
  const handleSubmit = useCallback(async (
    onSubmit: (data: PromoFormData) => Promise<boolean>
  ) => {
    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    // Touch all fields to show validation errors
    Object.keys(formState).forEach(fieldName => {
      touchField(fieldName as keyof FormState);
    });

    // Show validation messages
    if (!validation.isValid) {
      validation.showValidationMessages(true);
      setIsSubmitting(false);
      return false;
    }

    try {
      const success = await onSubmit(formValues);
      
      if (success) {
        if (resetOnSubmit) {
          resetForm();
        }
        
        // Clear auto-save draft
        localStorage.removeItem('promo_form_draft');
        
        toast.success('Promo berhasil disimpan!');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Gagal menyimpan promo');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, touchField, validation, formValues, resetOnSubmit, resetForm]);

  // 📋 Load draft
  const loadDraft = useCallback(() => {
    try {
      const draftJson = localStorage.getItem('promo_form_draft');
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        
        // Update form with draft data
        Object.keys(draft).forEach(key => {
          if (key in formState && key !== 'savedAt' && key !== 'autoSaved') {
            updateField(key as keyof FormState, draft[key], { validate: false, touch: false });
          }
        });
        
        toast.info(`Draft dimuat (${new Date(draft.savedAt).toLocaleString()})`, {
          action: {
            label: 'Hapus Draft',
            onClick: () => {
              localStorage.removeItem('promo_form_draft');
              toast.success('Draft dihapus');
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
    }
  }, [formState, updateField]);

  // 🔍 Check for draft on mount
  useEffect(() => {
    const hasDraft = localStorage.getItem('promo_form_draft');
    if (hasDraft) {
      toast.info('Ada draft yang tersimpan', {
        duration: 5000,
        action: {
          label: 'Muat Draft',
          onClick: loadDraft
        }
      });
    }
  }, [loadDraft]);

  // 🧹 Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // 📊 Form statistics
  const getFormStats = useCallback(() => {
    const stats = validation.getValidationStats();
    return {
      ...stats,
      isDirty: isFormDirty,
      isTouched: isFormTouched,
      submitCount,
      isSubmitting,
      canSubmit: validation.canSave && !isSubmitting
    };
  }, [validation, isFormDirty, isFormTouched, submitCount, isSubmitting]);

  return {
    // 📊 Form data
    formValues,
    formState,
    
    // 🎯 Field setters
    setSelectedRecipeId,
    setPromoType,
    setDiscountValue,
    setBogoBuy,
    setBogoGet,
    setPromoName,
    
    // 📝 Form actions
    touchField,
    resetForm,
    handleSubmit,
    loadDraft,
    
    // ✅ Validation
    validation,
    
    // 📊 Form state
    isFormDirty,
    isFormTouched,
    hasFieldErrors,
    isSubmitting,
    submitCount,
    
    // 📈 Utilities
    getFormStats
  };
};

export default usePromoForm;