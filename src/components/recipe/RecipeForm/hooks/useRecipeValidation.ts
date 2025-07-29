import { useState, useCallback } from 'react';
import { 
  validateRecipeName, 
  validateDescription, 
  validatePortions, 
  validatePrice,
  validateIngredient
} from '../../shared/utils/recipeValidators';

export const useRecipeValidation = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: any, additionalData?: any) => {
    let validation: { isValid: boolean; message?: string } = { isValid: true };
    
    switch (field) {
      case 'namaResep':
        validation = validateRecipeName(value);
        break;
      case 'deskripsi':
        validation = validateDescription(value);
        break;
      case 'jumlahPorsi':
        validation = validatePortions(value);
        break;
      case 'jumlahPcsPerPorsi':
        if (value && value <= 0) {
          validation = { isValid: false, message: 'Jumlah pcs per porsi harus lebih dari 0' };
        }
        break;
      case 'hargaJualPorsi':
        validation = validatePrice(value, 'Harga jual per porsi');
        break;
      case 'hargaJualPerPcs':
        validation = validatePrice(value, 'Harga jual per pcs');
        break;
      case 'biayaTenagaKerja':
        validation = validatePrice(value, 'Biaya tenaga kerja');
        break;
      case 'biayaOverhead':
        validation = validatePrice(value, 'Biaya overhead');
        break;
      case 'marginKeuntunganPersen':
        if (value < 0) {
          validation = { isValid: false, message: 'Margin keuntungan tidak boleh negatif' };
        }
        break;
      default:
        // Handle ingredient validation
        if (field.startsWith('ingredient-')) {
          const [, index, subField] = field.split('-');
          const ingredientValidation = validateIngredient(value);
          validation = ingredientValidation[subField] || { isValid: true };
        }
        break;
    }

    // Fixed: Store only the error message string, not the validation object
    setFieldErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? '' : (validation.message || 'Invalid field')
    }));

    return validation.isValid;
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  // Fixed: Simple boolean check
  const hasErrors = Object.values(fieldErrors).some(error => error && error.length > 0);

  return {
    fieldErrors, // Now contains only string messages
    validateField,
    clearFieldError,
    clearAllErrors,
    hasErrors // Simple boolean
  };
};