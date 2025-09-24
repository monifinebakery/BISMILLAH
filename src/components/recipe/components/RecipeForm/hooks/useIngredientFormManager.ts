// src/components/recipe/components/RecipeForm/hooks/useIngredientFormManager.ts

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { BahanResep, NewRecipe } from '../../../types';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import { logger } from '@/utils/logger';
import { useIngredientValidation } from '../ingredients-step/hooks';

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

  const { validateNewIngredient } = useIngredientValidation();
  
  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState<Partial<BahanResep>>({
    nama: '',
    jumlah: 0,
    satuan: '',
    harga_satuan: 0,
    total_harga: 0,
  });

  // Helper function to get ingredient display name
  const getIngredientDisplayName = useCallback((ingredient: BahanResep): string => {
    // If ingredient has warehouseId, try to get name from warehouse
    if (ingredient.warehouse_id) {
      const warehouseItem = warehouseItems.find(item => item.id === ingredient.warehouse_id);
      if (warehouseItem?.nama) {
        return `${warehouseItem.nama} (${ingredient.warehouse_id.slice(0, 8)}...)`;
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
        if (ingredient.warehouse_id && (!ingredient.nama || !ingredient.nama.trim())) {
          const warehouseItem = warehouseItems.find(item => item.id === ingredient.warehouse_id);
          if (warehouseItem?.nama) {
            logger.debug('useIngredientFormManager: Auto-fixing ingredient name:', {
              warehouseId: ingredient.warehouse_id,
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
    const validationResult = validateNewIngredient(newIngredient);
    if (!validationResult.isValid) {
      return false;
    }

    const ingredient: BahanResep = {
      id: Date.now().toString(),
      nama: newIngredient.nama!,
      jumlah: newIngredient.jumlah!,
      satuan: newIngredient.satuan!,
      harga_satuan: newIngredient.harga_satuan || 0,
      total_harga: (newIngredient.jumlah || 0) * (newIngredient.harga_satuan || 0),
      warehouse_id: newIngredient.warehouse_id, // Store warehouse reference
    };
    
    logger.debug('useIngredientFormManager: Adding ingredient:', {
      ingredient,
      jumlah: newIngredient.jumlah,
      harga_satuan: newIngredient.harga_satuan,
      totalHarga: (newIngredient.jumlah || 0) * (newIngredient.harga_satuan || 0),
      calculation: `${newIngredient.jumlah} × ${newIngredient.harga_satuan} = ${(newIngredient.jumlah || 0) * (newIngredient.harga_satuan || 0)}`
    });

    onUpdate('bahanResep', [...recipeData.bahanResep, ingredient]);
    
    // Reset form
    setNewIngredient({
      nama: '',
      jumlah: 0,
      satuan: '',
      harga_satuan: 0,
      total_harga: 0,
      warehouse_id: undefined,
    });
    
    toast.success('Bahan berhasil ditambahkan');
    return true;
  }, [newIngredient, recipeData.bahanResep, onUpdate, validateNewIngredient]);

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
    if (field === 'jumlah' || field === 'harga_satuan') {
      newIngredients[index].total_harga = newIngredients[index].jumlah * newIngredients[index].harga_satuan;
      
      logger.debug('useIngredientFormManager: Updated ingredient with recalculation:', {
        index,
        field,
        value,
        newTotal: newIngredients[index].total_harga,
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
    if (field === 'jumlah' || field === 'harga_satuan') {
      updated.total_harga = (updated.jumlah || 0) * (updated.harga_satuan || 0);
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
      harga_satuan: 0,
      total_harga: 0,
    });
  }, []);

  // Validate new ingredient form
  // Check if new ingredient form has data
  const hasNewIngredientData = useCallback(() => {
    return !!(newIngredient.jumlah && newIngredient.harga_satuan);
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