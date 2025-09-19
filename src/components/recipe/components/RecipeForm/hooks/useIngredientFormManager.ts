// src/components/recipe/components/RecipeForm/hooks/useIngredientFormManager.ts

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { BahanResep, NewRecipe } from '../../../types';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import { logger } from '@/utils/logger';

interface UseIngredientFormManagerProps {
  recipeData: NewRecipe;
  warehouseItems: BahanBakuFrontend[];
  onUpdate: (field: keyof NewRecipe, value: any) => void;
  isLoading?: boolean;
}

export const useIngredientFormManager = ({
  recipeData,
  warehouseItems,
  onUpdate,
  isLoading = false
}: UseIngredientFormManagerProps) => {
  
  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState<Partial<BahanResep>>({
    nama: '',
    jumlah: 0,
    satuan: '',
    hargaSatuan: 0,
    totalHarga: 0,
  });

  // Helper function to get ingredient display name
  const getIngredientDisplayName = useCallback((ingredient: BahanResep): string => {
    // If ingredient has warehouseId, try to get name from warehouse
    if (ingredient.warehouseId) {
      const warehouseItem = warehouseItems.find(item => item.id === ingredient.warehouseId);
      if (warehouseItem?.nama) {
        return warehouseItem.nama;
      }
    }
    
    // Fallback to ingredient's own name
    if (ingredient.nama && ingredient.nama.trim()) {
      return ingredient.nama;
    }
    
    // Last resort fallback
    return 'Bahan tidak dikenal';
  }, [warehouseItems]);

  // Auto-fix ingredients with missing names but valid warehouseId
  useEffect(() => {
    if (warehouseItems.length > 0 && recipeData.bahanResep.length > 0) {
      const updatedIngredients = recipeData.bahanResep.map(ingredient => {
        // If ingredient has warehouseId but missing/empty name, try to fix it
        if (ingredient.warehouseId && (!ingredient.nama || !ingredient.nama.trim())) {
          const warehouseItem = warehouseItems.find(item => item.id === ingredient.warehouseId);
          if (warehouseItem?.nama) {
            logger.debug('useIngredientFormManager: Auto-fixing ingredient name:', {
              warehouseId: ingredient.warehouseId,
              oldName: ingredient.nama,
              newName: warehouseItem.nama
            });
            return {
              ...ingredient,
              nama: warehouseItem.nama
            };
          }
        }
        return ingredient;
      });
      
      // Only update if there were changes
      const hasChanges = updatedIngredients.some((updated, index) => 
        updated.nama !== recipeData.bahanResep[index].nama
      );
      
      if (hasChanges) {
        onUpdate('bahanResep', updatedIngredients);
        toast.success('Nama bahan yang kosong berhasil diperbaiki');
      }
    }
  }, [warehouseItems, recipeData.bahanResep, onUpdate]);

  // Add new ingredient
  const handleAddIngredient = useCallback(() => {
    if (!newIngredient.warehouseId) {
      toast.error('Bahan harus dipilih dari warehouse');
      return false;
    }
    if (!newIngredient.nama?.trim()) {
      toast.error('Nama bahan harus dipilih');
      return false;
    }
    if (!newIngredient.satuan?.trim()) {
      toast.error('Satuan harus dipilih');
      return false;
    }
    if ((newIngredient.jumlah || 0) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return false;
    }
    if ((newIngredient.hargaSatuan || 0) <= 0) {
      toast.error('Harga satuan harus lebih dari 0');
      return false;
    }

    const ingredient: BahanResep = {
      id: Date.now().toString(),
      nama: newIngredient.nama!,
      jumlah: newIngredient.jumlah!,
      satuan: newIngredient.satuan!,
      hargaSatuan: newIngredient.hargaSatuan!,
      totalHarga: newIngredient.jumlah! * newIngredient.hargaSatuan!,
      warehouseId: newIngredient.warehouseId, // Store warehouse reference
    };
    
    logger.debug('useIngredientFormManager: Adding ingredient:', {
      ingredient,
      jumlah: newIngredient.jumlah,
      hargaSatuan: newIngredient.hargaSatuan,
      totalHarga: newIngredient.jumlah! * newIngredient.hargaSatuan!,
      calculation: `${newIngredient.jumlah} × ${newIngredient.hargaSatuan} = ${newIngredient.jumlah! * newIngredient.hargaSatuan!}`
    });

    onUpdate('bahanResep', [...recipeData.bahanResep, ingredient]);
    
    // Reset form
    setNewIngredient({
      nama: '',
      jumlah: 0,
      satuan: '',
      hargaSatuan: 0,
      totalHarga: 0,
    });
    
    toast.success('Bahan berhasil ditambahkan');
    return true;
  }, [newIngredient, recipeData.bahanResep, onUpdate]);

  // Remove ingredient
  const handleRemoveIngredient = useCallback((index: number) => {
    if (index < 0 || index >= recipeData.bahanResep.length) {
      toast.error('Index bahan tidak valid');
      return;
    }

    const ingredientName = recipeData.bahanResep[index]?.nama;
    const newIngredients = recipeData.bahanResep.filter((_, i) => i !== index);
    onUpdate('bahanResep', newIngredients);
    
    logger.debug('useIngredientFormManager: Removed ingredient:', {
      index,
      ingredientName,
      remaining: newIngredients.length
    });
    
    toast.success(`Bahan "${ingredientName}" berhasil dihapus`);
  }, [recipeData.bahanResep, onUpdate]);

  // Update existing ingredient
  const handleUpdateIngredient = useCallback((
    index: number, 
    field: keyof BahanResep, 
    value: any
  ) => {
    if (index < 0 || index >= recipeData.bahanResep.length) {
      toast.error('Index bahan tidak valid');
      return;
    }

    const newIngredients = [...recipeData.bahanResep];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    };

    // Recalculate total if quantity or unit price changes
    if (field === 'jumlah' || field === 'hargaSatuan') {
      newIngredients[index].totalHarga = newIngredients[index].jumlah * newIngredients[index].hargaSatuan;
      
      logger.debug('useIngredientFormManager: Updated ingredient with recalculation:', {
        index,
        field,
        value,
        newTotal: newIngredients[index].totalHarga,
        ingredient: newIngredients[index].nama
      });
    }

    onUpdate('bahanResep', newIngredients);
  }, [recipeData.bahanResep, onUpdate]);

  // Update new ingredient form
  const handleNewIngredientChange = useCallback((
    field: keyof BahanResep, 
    value: any
  ) => {
    const updated = { ...newIngredient, [field]: value };
    
    // Auto-calculate total
    if (field === 'jumlah' || field === 'hargaSatuan') {
      const jumlah = field === 'jumlah' ? (value || 0) : (updated.jumlah || 0);
      const harga = field === 'hargaSatuan' ? (value || 0) : (updated.hargaSatuan || 0);
      updated.totalHarga = jumlah * harga;
      
      logger.debug('useIngredientFormManager: New ingredient auto-calculation:', {
        field,
        value,
        jumlah,
        harga,
        totalHarga: updated.totalHarga
      });
    }
    
    setNewIngredient(updated);
  }, [newIngredient]);

  // Set new ingredient data (for external updates like warehouse selection)
  const setNewIngredientData = useCallback((data: Partial<BahanResep>) => {
    setNewIngredient(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  // Reset new ingredient form
  const resetNewIngredientForm = useCallback(() => {
    setNewIngredient({
      nama: '',
      jumlah: 0,
      satuan: '',
      hargaSatuan: 0,
      totalHarga: 0,
    });
  }, []);

  // Validate new ingredient form
  const validateNewIngredient = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!newIngredient.warehouseId) {
      errors.push('Bahan harus dipilih dari warehouse');
    }
    if (!newIngredient.nama?.trim()) {
      errors.push('Nama bahan harus dipilih');
    }
    if (!newIngredient.satuan?.trim()) {
      errors.push('Satuan harus dipilih');
    }
    if ((newIngredient.jumlah || 0) <= 0) {
      errors.push('Jumlah harus lebih dari 0');
    }
    if ((newIngredient.hargaSatuan || 0) <= 0) {
      errors.push('Harga satuan harus lebih dari 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [newIngredient]);

  // Check if new ingredient form has data
  const hasNewIngredientData = useCallback(() => {
    return !!(newIngredient.jumlah && newIngredient.hargaSatuan);
  }, [newIngredient]);

  return {
    // State
    newIngredient,
    ingredients: recipeData.bahanResep,
    
    // Actions
    handleAddIngredient,
    handleRemoveIngredient,
    handleUpdateIngredient,
    handleNewIngredientChange,
    setNewIngredientData,
    resetNewIngredientForm,
    
    // Helpers
    getIngredientDisplayName,
    validateNewIngredient,
    hasNewIngredientData,
    
    // Status
    isLoading,
    ingredientCount: recipeData.bahanResep.length
  };
};