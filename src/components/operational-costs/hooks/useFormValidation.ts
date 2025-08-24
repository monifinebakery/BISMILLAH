// src/components/operational-costs/hooks/useFormValidation.ts
// 📋 Comprehensive Form Validation Hook (Revision 8)
// Guardrails and user-friendly validation with Indonesian microcopy

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  validateCostForm,
  validateTargetOutput,
  validateMonthlyAmount,
  validateCostName,
  validatePercentage,
  formatValidationMessage,
  MICROCOPY,
  type ValidationResult
} from '../utils/validationAndMicrocopy';

interface UseFormValidationProps {
  showWarnings?: boolean;
  autoValidate?: boolean;
  showToasts?: boolean;
}

interface UseFormValidationReturn {
  // Validation state
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  isValid: boolean;
  isValidating: boolean;
  
  // Validation methods
  validateField: (field: string, value: any) => ValidationResult;
  validateForm: (data: any) => ValidationResult;
  clearFieldErrors: (field: string) => void;
  clearAllErrors: () => void;
  
  // Validation results
  getFieldError: (field: string) => string | null;
  getFieldWarning: (field: string) => string | null;
  hasFieldError: (field: string) => boolean;
  hasAnyErrors: () => boolean;
  
  // Utilities
  formatErrorMessage: (validation: ValidationResult) => string;
  showValidationToast: (validation: ValidationResult, field?: string) => void;
}

export const useFormValidation = ({
  showWarnings = true,
  autoValidate = true,
  showToasts = false
}: UseFormValidationProps = {}): UseFormValidationReturn => {
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Computed validation state
  const isValid = Object.keys(errors).length === 0;

  /**
   * Validate individual field
   */
  const validateField = useCallback((field: string, value: any): ValidationResult => {
    let validation: ValidationResult = { isValid: true, errors: [], warnings: [] };
    
    switch (field) {
      case 'nama_biaya':
      case 'cost_name':
        validation = validateCostName(value);
        break;
        
      case 'jumlah_per_bulan':
      case 'monthly_amount':
        validation = validateMonthlyAmount(Number(value));
        break;
        
      case 'target_output':
      case 'target_output_monthly':
        validation = validateTargetOutput(Number(value));
        break;
        
      case 'margin_percentage':
      case 'markup_percentage':
        validation = validatePercentage(Number(value), 'Margin/Markup');
        break;
        
      default:
        // Generic validation for required fields
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          validation = {
            isValid: false,
            errors: [MICROCOPY.VALIDATION.REQUIRED(field.replace('_', ' '))],
            warnings: []
          };
        }
    }
    
    // Update validation state
    setErrors(prev => ({
      ...prev,
      [field]: validation.errors
    }));
    
    if (showWarnings) {
      setWarnings(prev => ({
        ...prev,
        [field]: validation.warnings
      }));
    }
    
    // Show toast if configured
    if (showToasts && (!validation.isValid || validation.warnings.length > 0)) {
      showValidationToast(validation, field);
    }
    
    return validation;
  }, [showWarnings, showToasts]);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((data: any): ValidationResult => {
    setIsValidating(true);
    
    try {
      // Use comprehensive form validation
      const validation = validateCostForm(data);
      
      // Update all field errors at once
      const fieldErrors: Record<string, string[]> = {};
      const fieldWarnings: Record<string, string[]> = {};
      
      // Validate each field individually to get specific field errors
      Object.keys(data).forEach(field => {
        const fieldValidation = validateField(field, data[field]);
        if (fieldValidation.errors.length > 0) {
          fieldErrors[field] = fieldValidation.errors;
        }
        if (showWarnings && fieldValidation.warnings.length > 0) {
          fieldWarnings[field] = fieldValidation.warnings;
        }
      });
      
      setErrors(fieldErrors);
      if (showWarnings) {
        setWarnings(fieldWarnings);
      }
      
      // Show overall validation toast
      if (showToasts) {
        if (!validation.isValid) {
          toast.error('Form belum valid', {
            description: formatValidationMessage(validation, false)
          });
        } else if (validation.warnings.length > 0) {
          toast.warning('Perhatian', {
            description: formatValidationMessage({ ...validation, errors: [] }, true)
          });
        }
      }
      
      return validation;
      
    } finally {
      setIsValidating(false);
    }
  }, [validateField, showWarnings, showToasts]);

  /**
   * Clear errors for specific field
   */
  const clearFieldErrors = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    setWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[field];
      return newWarnings;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
    setWarnings({});
  }, []);

  /**
   * Get first error for field
   */
  const getFieldError = useCallback((field: string): string | null => {
    const fieldErrors = errors[field];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
  }, [errors]);

  /**
   * Get first warning for field
   */
  const getFieldWarning = useCallback((field: string): string | null => {
    const fieldWarnings = warnings[field];
    return fieldWarnings && fieldWarnings.length > 0 ? fieldWarnings[0] : null;
  }, [warnings]);

  /**
   * Check if field has errors
   */
  const hasFieldError = useCallback((field: string): boolean => {
    return errors[field] && errors[field].length > 0;
  }, [errors]);

  /**
   * Check if any field has errors
   */
  const hasAnyErrors = useCallback((): boolean => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Format validation message for display
   */
  const formatErrorMessage = useCallback((validation: ValidationResult): string => {
    return formatValidationMessage(validation, showWarnings);
  }, [showWarnings]);

  /**
   * Show validation toast
   */
  const showValidationToast = useCallback((validation: ValidationResult, field?: string) => {
    const fieldName = field ? field.replace('_', ' ') : 'Field';
    
    if (!validation.isValid) {
      toast.error(`Error pada ${fieldName}`, {
        description: validation.errors.join('. ')
      });
    } else if (validation.warnings.length > 0) {
      toast.warning(`Peringatan untuk ${fieldName}`, {
        description: validation.warnings.join('. ')
      });
    }
  }, []);

  return {
    // Validation state
    errors,
    warnings,
    isValid,
    isValidating,
    
    // Validation methods
    validateField,
    validateForm,
    clearFieldErrors,
    clearAllErrors,
    
    // Validation results
    getFieldError,
    getFieldWarning,
    hasFieldError,
    hasAnyErrors,
    
    // Utilities
    formatErrorMessage,
    showValidationToast
  };
};

// ====================================
// SPECIALIZED VALIDATION HOOKS
// ====================================

/**
 * Hook for dual-mode calculator validation
 */
export const useDualModeValidation = () => {
  const validation = useFormValidation({
    showWarnings: true,
    autoValidate: true,
    showToasts: true
  });
  
  const validateCalculatorInputs = useCallback((
    targetOutput: number,
    costs: any[]
  ) => {
    const errors: string[] = [];
    
    // Validate target output
    const outputValidation = validateTargetOutput(targetOutput);
    if (!outputValidation.isValid) {
      errors.push(...outputValidation.errors);
    }
    
    // Validate costs
    if (costs.length === 0) {
      errors.push('Minimal harus ada 1 biaya untuk kalkulasi');
    }
    
    const totalCosts = costs.reduce((sum, cost) => sum + (cost.jumlah_per_bulan || 0), 0);
    if (totalCosts === 0) {
      errors.push('Total biaya tidak boleh 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: outputValidation.warnings
    };
  }, []);
  
  return {
    ...validation,
    validateCalculatorInputs
  };
};

/**
 * Hook for recipe HPP validation
 */
export const useRecipeHppValidation = () => {
  const validation = useFormValidation({
    showWarnings: true,
    autoValidate: false,
    showToasts: false
  });
  
  const validateRecipeInputs = useCallback((recipeData: {
    namaResep: string;
    jumlahPorsi: number;
    jumlahPcsPerPorsi: number;
    bahanResep: any[];
    biayaTenagaKerja: number;
    marginKeuntunganPersen: number;
  }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate recipe name
    const nameValidation = validateCostName(recipeData.namaResep);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }
    
    // Validate portions and pieces
    if (recipeData.jumlahPorsi <= 0) {
      errors.push('Jumlah porsi harus lebih dari 0');
    }
    
    if (recipeData.jumlahPcsPerPorsi <= 0) {
      errors.push('Jumlah pcs per porsi harus lebih dari 0');
    }
    
    // Validate ingredients
    if (recipeData.bahanResep.length === 0) {
      errors.push('Minimal harus ada 1 bahan resep');
    }
    
    // Validate margin
    const marginValidation = validatePercentage(recipeData.marginKeuntunganPersen, 'Margin keuntungan');
    if (!marginValidation.isValid) {
      errors.push(...marginValidation.errors);
    }
    warnings.push(...marginValidation.warnings);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);
  
  return {
    ...validation,
    validateRecipeInputs
  };
};