// src/components/recipe/hooks/useRecipeOperations.ts

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { recipeApi } from '../services/recipeApi';
import { calculateHPP, validateRecipeData, duplicateRecipe as duplicateRecipeUtil } from '../services/recipeUtils';
import type { Recipe, NewRecipe } from '../types';

interface UseRecipeOperationsProps {
  userId: string;
  onRecipeAdded?: (recipe: Recipe) => void;
  onRecipeUpdated?: (recipe: Recipe) => void;
  onRecipeDeleted?: (id: string) => void;
}

export const useRecipeOperations = ({
  userId,
  onRecipeAdded,
  onRecipeUpdated,
  onRecipeDeleted
}: UseRecipeOperationsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Add new recipe
  const addRecipe = useCallback(async (recipeData: NewRecipe): Promise<boolean> => {
    if (!userId) {
      toast.error('User tidak ditemukan');
      return false;
    }

    // Validate recipe data
    const validation = validateRecipeData(recipeData);
    if (!validation.isValid) {
      const errorMessage = `Data resep tidak valid: ${validation.errors.join(', ')}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useRecipeOperations: Adding recipe:', recipeData.namaResep);

      // Calculate HPP if not provided
      let finalRecipeData = { ...recipeData };
      if (!finalRecipeData.totalHpp || !finalRecipeData.hppPerPorsi) {
        const calculation = calculateHPP(
          finalRecipeData.bahanResep || [],
          finalRecipeData.jumlahPorsi || 1,
          finalRecipeData.biayaTenagaKerja || 0,
          finalRecipeData.biayaOverhead || 0,
          finalRecipeData.marginKeuntunganPersen || 0,
          finalRecipeData.jumlahPcsPerPorsi || 1
        );

        finalRecipeData = {
          ...finalRecipeData,
          totalHpp: calculation.totalHPP,
          hppPerPorsi: calculation.hppPerPorsi,
          hargaJualPorsi: calculation.hargaJualPorsi,
          hppPerPcs: calculation.hppPerPcs,
          hargaJualPerPcs: calculation.hargaJualPerPcs,
        };
      }

      const result = await recipeApi.addRecipe(finalRecipeData, userId);

      if (result.success && result.data) {
        // Toast notifications sudah ditangani oleh useRecipeMutations
        onRecipeAdded?.(result.data);
        logger.debug('useRecipeOperations: Successfully added recipe:', result.data.id);
        return true;
      } else {
        throw new Error(result.error || 'Gagal menambahkan resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('useRecipeOperations: Error adding recipe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, onRecipeAdded]);

  // Update existing recipe
  const updateRecipe = useCallback(async (id: string, updates: Partial<NewRecipe>): Promise<boolean> => {
    if (!userId) {
      toast.error('User tidak ditemukan');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useRecipeOperations: Updating recipe:', id);

      // Recalculate HPP if relevant data changed
      let finalUpdates = { ...updates };
      if (
        updates.bahanResep !== undefined ||
        updates.jumlahPorsi !== undefined ||
        updates.biayaTenagaKerja !== undefined ||
        updates.biayaOverhead !== undefined ||
        updates.marginKeuntunganPersen !== undefined ||
        updates.jumlahPcsPerPorsi !== undefined
      ) {
        // Get current recipe data for missing fields
        const currentRecipe = await recipeApi.fetchRecipeById(id, userId);
        if (!currentRecipe.data) {
          throw new Error('Resep tidak ditemukan');
        }

        const bahanResep = updates.bahanResep ?? currentRecipe.data.bahanResep;
        const jumlahPorsi = updates.jumlahPorsi ?? currentRecipe.data.jumlahPorsi;
        const biayaTenagaKerja = updates.biayaTenagaKerja ?? currentRecipe.data.biayaTenagaKerja;
        const biayaOverhead = updates.biayaOverhead ?? currentRecipe.data.biayaOverhead;
        const marginKeuntunganPersen = updates.marginKeuntunganPersen ?? currentRecipe.data.marginKeuntunganPersen;
        const jumlahPcsPerPorsi = updates.jumlahPcsPerPorsi ?? currentRecipe.data.jumlahPcsPerPorsi;

        const calculation = calculateHPP(
          bahanResep,
          jumlahPorsi,
          biayaTenagaKerja,
          biayaOverhead,
          marginKeuntunganPersen,
          jumlahPcsPerPorsi
        );

        // ✅ PERBAIKAN: Jangan override harga jual otomatis jika user sudah set manual
        finalUpdates = {
          ...finalUpdates,
          totalHpp: calculation.totalHPP,
          hppPerPorsi: calculation.hppPerPorsi,
          hppPerPcs: calculation.hppPerPcs,
          // Hanya update harga jual jika tidak ada di updates (user tidak mengubahnya)
          ...(updates.hargaJualPorsi === undefined ? { hargaJualPorsi: calculation.hargaJualPorsi } : {}),
          ...(updates.hargaJualPerPcs === undefined ? { hargaJualPerPcs: calculation.hargaJualPerPcs } : {}),
        };
      }

      const result = await recipeApi.updateRecipe(id, finalUpdates, userId);

      if (result.success && result.data) {
        // Toast notifications sudah ditangani oleh useRecipeMutations
        onRecipeUpdated?.(result.data);
        logger.debug('useRecipeOperations: Successfully updated recipe:', result.data.id);
        return true;
      } else {
        throw new Error(result.error || 'Gagal memperbarui resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('useRecipeOperations: Error updating recipe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, onRecipeUpdated]);

  // Delete recipe
  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    if (!userId) {
      toast.error('User tidak ditemukan');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useRecipeOperations: Deleting recipe:', id);

      const result = await recipeApi.deleteRecipe(id, userId);

      if (result.success) {
        // Toast notifications sudah ditangani oleh useRecipeMutations
        onRecipeDeleted?.(id);
        logger.debug('useRecipeOperations: Successfully deleted recipe:', id);
        return true;
      } else {
        throw new Error(result.error || 'Gagal menghapus resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('useRecipeOperations: Error deleting recipe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, onRecipeDeleted]);

  // Duplicate recipe
  const duplicateRecipe = useCallback(async (
    originalRecipe: Recipe, 
    newName: string
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('User tidak ditemukan');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useRecipeOperations: Duplicating recipe:', originalRecipe.id, 'with name:', newName);

      const duplicatedRecipe = duplicateRecipeUtil(originalRecipe, newName);
      const success = await addRecipe(duplicatedRecipe);

      if (success) {
        // Toast notifications sudah ditangani oleh useRecipeMutations
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menduplikasi resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('useRecipeOperations: Error duplicating recipe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, addRecipe]);

  // Bulk delete recipes
  const bulkDeleteRecipes = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!userId) {
      toast.error('User tidak ditemukan');
      return false;
    }

    if (ids.length === 0) {
      toast.error('Tidak ada resep yang dipilih');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useRecipeOperations: Bulk deleting recipes:', ids);

      const result = await recipeApi.bulkDeleteRecipes(ids, userId);

      if (result.success) {
        // Toast notifications sudah ditangani oleh useRecipeBulk
        // Notify for each deleted recipe
        ids.forEach(id => onRecipeDeleted?.(id));
        logger.debug('useRecipeOperations: Successfully bulk deleted recipes:', ids.length);
        return true;
      } else {
        throw new Error(result.error || 'Gagal menghapus resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('useRecipeOperations: Error bulk deleting recipes:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, onRecipeDeleted]);

  return {
    // State
    isLoading,
    error,
    
    // Actions
    addRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    bulkDeleteRecipes,
    clearError,
  };
};