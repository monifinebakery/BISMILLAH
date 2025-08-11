// src/components/assets/hooks/useAssetValidation.ts

import { useCallback, useMemo } from 'react';
import { AssetFormData, AssetFormErrors } from '../types';
import { validateField, validateForm, isFormValid, hasRequiredFields } from '../utils';

interface UseAssetValidationProps {
  formData: AssetFormData;
  validateOnChange?: boolean;
  debounceMs?: number;
}

interface UseAssetValidationReturn {
  validateField: (field: keyof AssetFormData) => string | undefined;
  validateForm: () => AssetFormErrors;
  isFieldValid: (field: keyof AssetFormData) => boolean;
  isFormValid: boolean;
  hasRequiredFields: boolean;
  getFieldError: (field: keyof AssetFormData, errors: AssetFormErrors) => string | undefined;
  validateBeforeSubmit: () => { isValid: boolean; errors: AssetFormErrors };
  validateFieldRealtime: (field: keyof AssetFormData, value: any) => string | undefined;
  validateCrossFields: () => AssetFormErrors;
  getValidationSummary: () => {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    requiredFields: number;
    filledRequiredFields: number;
    isComplete: boolean;
  };
}

/**
 * Comprehensive hook for asset form validation
 */
export const useAssetValidation = ({
  formData,
  validateOnChange = true,
  debounceMs = 300,
}: UseAssetValidationProps): UseAssetValidationReturn => {

  // Validate single field
  const validateSingleField = useCallback((field: keyof AssetFormData): string | undefined => {
    return validateField(field, formData[field]);
  }, [formData]);

  // Validate entire form
  const validateEntireForm = useCallback((): AssetFormErrors => {
    return validateForm(formData);
  }, [formData]);

  // Check if field is valid
  const isFieldValid = useCallback((field: keyof AssetFormData): boolean => {
    const error = validateSingleField(field);
    return !error;
  }, [validateSingleField]);

  // Check if form is valid (memoized)
  const formIsValid = useMemo(() => {
    const errors = validateEntireForm();
    return isFormValid(errors);
  }, [validateEntireForm]);

  // Check if required fields are filled
  const requiredFieldsFilled = useMemo(() => {
    return hasRequiredFields(formData);
  }, [formData]);

  // Get field error from errors object
  const getFieldError = useCallback((
    field: keyof AssetFormData, 
    errors: AssetFormErrors
  ): string | undefined => {
    return errors[field];
  }, []);

  // Real-time field validation
  const validateFieldRealtime = useCallback((
    field: keyof AssetFormData, 
    value: any
  ): string | undefined => {
    if (!validateOnChange) return undefined;
    
    return validateField(field, value);
  }, [validateOnChange]);

  // Cross-field validations
  const validateCrossFields = useCallback((): AssetFormErrors => {
    const errors: AssetFormErrors = {};
    
    // Check if nilai sekarang is not greater than nilai awal
    if (formData.nilaiAwal && formData.nilaiSaatIni && 
        typeof formData.nilaiAwal === 'number' && typeof formData.nilaiSaatIni === 'number') {
      if (formData.nilaiSaatIni > formData.nilaiAwal) {
        errors.nilaiSaatIni = 'Nilai sekarang tidak boleh lebih besar dari nilai awal';
      }
    }
    
    // Check if tanggal pembelian is not in the future
    if (formData.tanggalPembelian instanceof Date) {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (formData.tanggalPembelian > today) {
        errors.tanggalPembelian = 'Tanggal pembelian tidak boleh di masa depan';
      }
      
      // Check if date is not too old (more than 50 years)
      const fiftyYearsAgo = new Date();
      fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
      
      if (formData.tanggalPembelian < fiftyYearsAgo) {
        errors.tanggalPembelian = 'Tanggal pembelian terlalu lama (maksimal 50 tahun yang lalu)';
      }
    }
    
    // Validate depreciation logic
    if (formData.depresiasi && typeof formData.depresiasi === 'number' && 
        formData.nilaiAwal && formData.nilaiSaatIni &&
        typeof formData.nilaiAwal === 'number' && typeof formData.nilaiSaatIni === 'number') {
      
      const calculatedCurrentValue = formData.nilaiAwal * (1 - formData.depresiasi / 100);
      const tolerance = formData.nilaiAwal * 0.1; // 10% tolerance
      
      if (Math.abs(formData.nilaiSaatIni - calculatedCurrentValue) > tolerance) {
        errors.depresiasi = `Dengan depresiasi ${formData.depresiasi}%, nilai sekarang seharusnya sekitar ${calculatedCurrentValue.toLocaleString('id-ID')}`;
      }
    }

    // Business logic validations
    if (formData.kondisi === 'Rusak Berat' && 
        formData.nilaiAwal && formData.nilaiSaatIni &&
        typeof formData.nilaiAwal === 'number' && typeof formData.nilaiSaatIni === 'number') {
      
      const depreciationPercentage = ((formData.nilaiAwal - formData.nilaiSaatIni) / formData.nilaiAwal) * 100;
      
      if (depreciationPercentage < 30) {
        errors.kondisi = 'Aset dengan kondisi "Rusak Berat" seharusnya memiliki depresiasi minimal 30%';
      }
    }

    if (formData.kondisi === 'Baik' && 
        formData.nilaiAwal && formData.nilaiSaatIni &&
        typeof formData.nilaiAwal === 'number' && typeof formData.nilaiSaatIni === 'number') {
      
      const depreciationPercentage = ((formData.nilaiAwal - formData.nilaiSaatIni) / formData.nilaiAwal) * 100;
      
      if (depreciationPercentage > 80) {
        errors.kondisi = 'Aset dengan depresiasi > 80% seharusnya tidak berkondisi "Baik"';
      }
    }

    return errors;
  }, [formData]);

  // Comprehensive validation before submit
  const validateBeforeSubmit = useCallback(() => {
    // Basic field validation
    const fieldErrors = validateEntireForm();
    
    // Cross-field validation
    const crossFieldErrors = validateCrossFields();
    
    // Combine all errors
    const allErrors = { ...fieldErrors, ...crossFieldErrors };
    
    return {
      isValid: isFormValid(allErrors),
      errors: allErrors,
    };
  }, [validateEntireForm, validateCrossFields]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const requiredFields: Array<keyof AssetFormData> = [
      'nama', 'kategori', 'nilaiAwal', 'nilaiSaatIni', 'tanggalPembelian', 'kondisi', 'lokasi'
    ];
    
    const allFields: Array<keyof AssetFormData> = [
      'nama', 'kategori', 'nilaiAwal', 'nilaiSaatIni', 'tanggalPembelian', 
      'kondisi', 'lokasi', 'deskripsi', 'depresiasi'
    ];

    const validFields = allFields.filter(field => isFieldValid(field)).length;
    const invalidFields = allFields.length - validFields;

    const filledRequiredFields = requiredFields.filter(field => {
      const value = formData[field];
      if (field === 'tanggalPembelian') {
        return value instanceof Date && !isNaN(value.getTime());
      }
      return value !== '' && value !== null && value !== undefined;
    }).length;

    return {
      totalFields: allFields.length,
      validFields,
      invalidFields,
      requiredFields: requiredFields.length,
      filledRequiredFields,
      isComplete: filledRequiredFields === requiredFields.length && validFields === allFields.length,
    };
  }, [formData, isFieldValid]);

  return {
    validateField: validateSingleField,
    validateForm: validateEntireForm,
    isFieldValid,
    isFormValid: formIsValid,
    hasRequiredFields: requiredFieldsFilled,
    getFieldError,
    validateBeforeSubmit,
    validateFieldRealtime,
    validateCrossFields,
    getValidationSummary,
  };
};