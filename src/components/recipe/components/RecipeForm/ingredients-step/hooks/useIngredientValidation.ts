// src/components/recipe/components/RecipeForm/ingredients-step/hooks/useIngredientValidation.ts

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { BahanResep } from '../../../../types';

interface ValidationOptions {
  showToast?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const useIngredientValidation = ({ showToast = true }: ValidationOptions = {}) => {
  const validateNewIngredient = useCallback((ingredient: Partial<BahanResep>): ValidationResult => {
    const errors: string[] = [];

    if (!ingredient.warehouseId) {
      errors.push('Bahan harus dipilih dari warehouse');
    }
    if (!ingredient.nama?.trim()) {
      errors.push('Nama bahan harus dipilih');
    }
    if (!ingredient.satuan?.trim()) {
      errors.push('Satuan harus dipilih');
    }
    if ((ingredient.jumlah || 0) <= 0) {
      errors.push('Jumlah harus lebih dari 0');
    }
    if ((ingredient.hargaSatuan || 0) <= 0) {
      errors.push('Harga satuan harus lebih dari 0');
    }

    if (errors.length > 0 && showToast) {
      errors.forEach(message => toast.error(message));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [showToast]);

  return {
    validateNewIngredient,
  };
};
