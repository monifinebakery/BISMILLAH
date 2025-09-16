// src/components/assets/hooks/useAssetForm.ts

import { useState, useCallback, useEffect } from 'react';
import { AssetFormData, AssetFormErrors, AssetFormState, AssetFormActions, Asset } from '../types';
import { validateField, validateForm, isFormValid, hasRequiredFields, hasFormChanged, sanitizeFormData } from '../utils';
import { DEFAULT_FORM_DATA } from '../utils/assetConstants';

interface UseAssetFormProps {
  initialData?: Partial<AssetFormData>;
  mode: 'create' | 'edit';
  asset?: Asset;
}

interface UseAssetFormReturn extends AssetFormState, AssetFormActions {
  canSubmit: boolean;
  hasChanges: boolean;
}

/**
 * Hook for managing asset form state and validation
 */
export const useAssetForm = ({
  initialData,
  mode,
  asset,
}: UseAssetFormProps): UseAssetFormReturn => {
  // Initialize form data
  const getInitialFormData = useCallback((): AssetFormData => {
    if (mode === 'edit' && asset) {
      return {
        nama: asset.nama,
        kategori: asset.kategori,
        nilaiAwal: asset.nilaiAwal,
        nilaiSaatIni: asset.nilaiSaatIni,
        tanggalPembelian: asset.tanggalPembelian,
        kondisi: asset.kondisi,
        lokasi: asset.lokasi,
        deskripsi: asset.deskripsi || '',
        depresiasi: asset.depresiasi !== null ? asset.depresiasi : null,
      };
    }
    
    return {
      ...DEFAULT_FORM_DATA,
      ...initialData,
    };
  }, [initialData, mode, asset]);

  const [formData, setFormData] = useState<AssetFormData>(getInitialFormData);
  const [errors, setErrors] = useState<AssetFormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormData] = useState<AssetFormData>(getInitialFormData);

  // Update form data when asset changes in edit mode
  useEffect(() => {
    if (mode === 'edit' && asset) {
      const newFormData = getInitialFormData();
      setFormData(newFormData);
      setIsDirty(false);
      setErrors({});
    }
  }, [asset, mode, getInitialFormData]);

  // Update single field
  const updateField = useCallback((field: keyof AssetFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    setIsDirty(true);

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate field on change for immediate feedback
    setTimeout(() => {
      const fieldError = validateField(field, value);
      if (fieldError) {
        setErrors(prev => ({
          ...prev,
          [field]: fieldError,
        }));
      }
    }, 300); // Debounce validation
  }, [errors]);

  // Set multiple errors at once
  const setFormErrors = useCallback((newErrors: AssetFormErrors) => {
    setErrors(newErrors);
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    const initialData = getInitialFormData();
    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [getInitialFormData]);

  // Set form data (for external updates)
  const setFormDataExternal = useCallback((data: Partial<AssetFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
    setIsDirty(true);
  }, []);

  // Validate entire form
  const validateFormData = useCallback((): boolean => {
    const sanitizedData = sanitizeFormData(formData);
    const formErrors = validateForm(sanitizedData);
    setErrors(formErrors);
    return isFormValid(formErrors);
  }, [formData]);

  // Validate single field
  const validateSingleField = useCallback((field: keyof AssetFormData): string | undefined => {
    return validateField(field, formData[field]);
  }, [formData]);

  // Calculate derived state
  const isValid = isFormValid(errors);
  const hasRequiredData = hasRequiredFields(formData);
  const hasChanges = hasFormChanged(formData, initialFormData);
  const canSubmit = isValid && hasRequiredData && !isSubmitting;

  // Set submitting state (for external use)
  const setSubmittingState = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  return {
    // State
    data: formData,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    
    // Derived state
    canSubmit,
    hasChanges,
    
    // Actions
    updateField,
    setErrors: setFormErrors,
    clearErrors,
    resetForm,
    setFormData: setFormDataExternal,
    validateForm: validateFormData,
    validateField: validateSingleField,
    
    // Additional utilities
    setSubmitting: setSubmittingState,
    sanitizeData: () => sanitizeFormData(formData),
  };
};