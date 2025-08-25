// src/components/recipe/hooks/useRecipeBulk.ts

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { recipeApi } from '../services/recipeApi';
import type { Recipe } from '../types';
import { RECIPE_QUERY_KEYS } from '@/pages/Recipes';

export interface RecipeBulkEditData {
  kategoriResep?: string;
  biayaTenagaKerja?: number;
  biayaOverhead?: number;
  marginKeuntunganPersen?: number;
}

export interface RecipeBulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

export const useRecipeBulk = () => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (recipeIds: string[]): Promise<RecipeBulkOperationResult> => {
      logger.component('RecipeBulk', 'Starting bulk delete:', { count: recipeIds.length });
      
      const result: RecipeBulkOperationResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      setIsProcessing(true);
      setProgress({ current: 0, total: recipeIds.length });

      // Process in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < recipeIds.length; i += batchSize) {
        const batch = recipeIds.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (id, index) => {
            try {
              await recipeApi.deleteRecipe(id);
              result.success++;
              setProgress(prev => ({ ...prev, current: prev.current + 1 }));
              logger.success('Recipe deleted:', id);
            } catch (error) {
              result.failed++;
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              result.errors.push(`Resep ${id}: ${errorMessage}`);
              logger.error('Failed to delete recipe:', { id, error });
              setProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < recipeIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setIsProcessing(false);
      return result;
    },
    onSuccess: (result) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });

      if (result.success > 0) {
        toast.success(`${result.success} resep berhasil dihapus`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} resep gagal dihapus`);
      }

      logger.component('RecipeBulk', 'Bulk delete completed:', result);
    },
    onError: (error) => {
      setIsProcessing(false);
      logger.error('Bulk delete failed:', error);
      toast.error('Operasi bulk delete gagal');
    }
  });

  // Bulk edit mutation
  const bulkEditMutation = useMutation({
    mutationFn: async ({
      recipeIds,
      editData
    }: {
      recipeIds: string[];
      editData: RecipeBulkEditData;
    }): Promise<RecipeBulkOperationResult> => {
      logger.component('RecipeBulk', 'Starting bulk edit:', { 
        count: recipeIds.length, 
        editData 
      });
      
      const result: RecipeBulkOperationResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      setIsProcessing(true);
      setProgress({ current: 0, total: recipeIds.length });

      // Get current recipes data for validation
      const currentRecipes = queryClient.getQueryData<Recipe[]>(RECIPE_QUERY_KEYS.lists()) || [];

      // Process in batches
      const batchSize = 3;
      for (let i = 0; i < recipeIds.length; i += batchSize) {
        const batch = recipeIds.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (id) => {
            try {
              const currentRecipe = currentRecipes.find(r => r.id === id);
              if (!currentRecipe) {
                throw new Error('Resep tidak ditemukan');
              }

              // Validate edit data
              const validationErrors = validateBulkEditData(editData, currentRecipe);
              if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
              }

              // Prepare update data
              const updateData: Partial<Recipe> = {
                ...editData
              };

              // If we're updating cost-related fields, recalculate HPP
              if (editData.biayaTenagaKerja !== undefined || 
                  editData.biayaOverhead !== undefined || 
                  editData.marginKeuntunganPersen !== undefined) {
                
                const biayaTenagaKerja = editData.biayaTenagaKerja ?? currentRecipe.biayaTenagaKerja;
                const biayaOverhead = editData.biayaOverhead ?? currentRecipe.biayaOverhead;
                const marginKeuntunganPersen = editData.marginKeuntunganPersen ?? currentRecipe.marginKeuntunganPersen;
                
                // Calculate ingredient cost
                const biayaBahan = currentRecipe.bahanResep.reduce((total, bahan) => 
                  total + (bahan.jumlah * bahan.hargaSatuan), 0
                );
                
                // Calculate total HPP
                const totalHpp = biayaBahan + biayaTenagaKerja + biayaOverhead;
                const hppPerPorsi = totalHpp / currentRecipe.jumlahPorsi;
                const hargaJualPorsi = hppPerPorsi * (1 + marginKeuntunganPersen / 100);
                const hppPerPcs = hppPerPorsi / currentRecipe.jumlahPcsPerPorsi;
                const hargaJualPerPcs = hargaJualPorsi / currentRecipe.jumlahPcsPerPorsi;
                
                Object.assign(updateData, {
                  biayaTenagaKerja,
                  biayaOverhead,
                  marginKeuntunganPersen,
                  totalHpp,
                  hppPerPorsi,
                  hargaJualPorsi,
                  hppPerPcs,
                  hargaJualPerPcs
                });
              }

              await recipeApi.updateRecipe(id, updateData);
              result.success++;
              setProgress(prev => ({ ...prev, current: prev.current + 1 }));
              logger.success('Recipe updated:', id);
            } catch (error) {
              result.failed++;
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              result.errors.push(`Resep ${id}: ${errorMessage}`);
              logger.error('Failed to update recipe:', { id, error });
              setProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < recipeIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setIsProcessing(false);
      return result;
    },
    onSuccess: (result) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });

      if (result.success > 0) {
        toast.success(`${result.success} resep berhasil diperbarui`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} resep gagal diperbarui`);
      }

      logger.component('RecipeBulk', 'Bulk edit completed:', result);
    },
    onError: (error) => {
      setIsProcessing(false);
      logger.error('Bulk edit failed:', error);
      toast.error('Operasi bulk edit gagal');
    }
  });

  // Validation function for bulk edit data
  const validateBulkEditData = (editData: RecipeBulkEditData, recipe: Recipe): string[] => {
    const errors: string[] = [];

    if (editData.biayaTenagaKerja !== undefined && editData.biayaTenagaKerja < 0) {
      errors.push('Biaya tenaga kerja tidak boleh negatif');
    }

    if (editData.biayaOverhead !== undefined && editData.biayaOverhead < 0) {
      errors.push('Biaya overhead tidak boleh negatif');
    }

    if (editData.marginKeuntunganPersen !== undefined) {
      if (editData.marginKeuntunganPersen < 0) {
        errors.push('Margin keuntungan tidak boleh negatif');
      }
      if (editData.marginKeuntunganPersen > 1000) {
        errors.push('Margin keuntungan terlalu tinggi (maksimal 1000%)');
      }
    }

    return errors;
  };

  // Exposed functions
  const bulkDelete = useCallback(async (recipeIds: string[]) => {
    if (recipeIds.length === 0) {
      toast.error('Tidak ada resep yang dipilih');
      return;
    }

    logger.component('RecipeBulk', 'Initiating bulk delete:', { count: recipeIds.length });
    return bulkDeleteMutation.mutateAsync(recipeIds);
  }, [bulkDeleteMutation]);

  const bulkEdit = useCallback(async (recipeIds: string[], editData: RecipeBulkEditData) => {
    if (recipeIds.length === 0) {
      toast.error('Tidak ada resep yang dipilih');
      return;
    }

    if (Object.keys(editData).length === 0) {
      toast.error('Tidak ada perubahan yang akan diterapkan');
      return;
    }

    logger.component('RecipeBulk', 'Initiating bulk edit:', { 
      count: recipeIds.length, 
      editData 
    });
    return bulkEditMutation.mutateAsync({ recipeIds, editData });
  }, [bulkEditMutation]);

  return {
    bulkDelete,
    bulkEdit,
    isProcessing: isProcessing || bulkDeleteMutation.isPending || bulkEditMutation.isPending,
    progress,
    validateBulkEditData
  };
};