// src/components/financial/hooks/form/useFinancialForm.ts
import { useState, useCallback } from 'react';
import { validateTransaction } from '../../utils/financialCalculations';
import { FinancialTransaction, ValidationResult } from '../../types/financial';

interface FormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface UseFinancialFormReturn {
  formData: FormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  validateForm: () => ValidationResult;
  resetForm: () => void;
  initializeForm: (transaction?: FinancialTransaction | null) => void;
  isValid: boolean;
}

/**
 * Financial Form Management Hook
 * Handles form state, validation, and initialization for financial transactions
 */
export const useFinancialForm = (
  initialTransaction?: FinancialTransaction | null
): UseFinancialFormReturn => {
  const [formData, setFormData] = useState<FormData>({
    type: 'expense',
    amount: 0,
    category: '',
    description: '',
    date: new Date()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when transaction changes
  const initializeForm = useCallback((transaction?: FinancialTransaction | null) => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category || '',
        description: transaction.description || '',
        date: new Date(transaction.date!)
      });
    } else {
      setFormData({
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
        date: new Date()
      });
    }
    setErrors({});
  }, []);

  // Update form field
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Reset category when type changes
      if (field === 'type') {
        newData.category = '';
      }
      return newData;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): ValidationResult => {
    const result = validateTransaction(formData);
    
    // Convert to form-specific error format
    const formErrors: Record<string, string> = {};
    result.errors.forEach(error => {
      if (error.includes('Jumlah')) formErrors.amount = error;
      if (error.includes('Kategori')) formErrors.category = error;
      if (error.includes('Deskripsi')) formErrors.description = error;
      if (error.includes('Tanggal')) formErrors.date = error;
    });
    
    setErrors(formErrors);
    return result;
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    initializeForm();
  }, [initializeForm]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    initializeForm,
    isValid: Object.keys(errors).length === 0
  };
};