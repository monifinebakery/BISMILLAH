// src/contexts/RecipeContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { logger } from '@/utils/logger';

// Import recipe services and types
import { recipeApi } from '@/components/recipe/services/recipeApi';
import { calculateHPP, validateRecipeData } from '@/components/recipe/services/recipeUtils';
import type { Recipe, NewRecipe, HPPCalculationResult, BahanResep } from '@/components/recipe/types';

interface RecipeContextType {
  // State
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  addRecipe: (recipe: NewRecipe) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<NewRecipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  duplicateRecipe: (id: string, newName: string) => Promise<boolean>;
  bulkDeleteRecipes: (ids: string[]) => Promise<boolean>;

  // Business Logic
  calculateHPP: (
    bahanResep: BahanResep[],
    jumlahPorsi: number,
    biayaTenagaKerja: number,
    biayaOverhead: number,
    marginKeuntunganPersen: number,
    jumlahPcsPerPorsi?: number
  ) => HPPCalculationResult;
  validateRecipeData: (recipe: Partial<NewRecipe>) => { isValid: boolean; errors: string[] };

  // Search & Filter
  searchRecipes: (query: string) => Recipe[];
  getRecipesByCategory: (category: string) => Recipe[];
  getUniqueCategories: () => string[];

  // Statistics
  getRecipeStats: () => {
    totalRecipes: number;
    totalCategories: number;
    averageHppPerPorsi: number;
    mostExpensiveRecipe: Recipe | null;
    cheapestRecipe: Recipe | null;
    profitabilityStats: {
      high: number;
      medium: number;
      low: number;
    };
  };

  // Utilities
  refreshRecipes: () => Promise<void>;
  clearError: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load recipes from API
  const loadRecipes = useCallback(async () => {
    if (!user?.id) {
      setRecipes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('RecipeContext: Loading recipes for user:', user.id);
      const result = await recipeApi.fetchRecipes(user.id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setRecipes(result.data);
      logger.debug(`RecipeContext: Loaded ${result.data.length} recipes`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recipes';
      setError(errorMessage);
      logger.error('RecipeContext: Error loading recipes:', error);
      toast.error(`Gagal memuat resep: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Refresh recipes
  const refreshRecipes = useCallback(async () => {
    await loadRecipes();
  }, [loadRecipes]);

  // Add new recipe
  const addRecipe = useCallback(async (recipeData: NewRecipe): Promise<boolean> => {
    if (!user?.id) {
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

    try {
      setError(null);
      logger.debug('RecipeContext: Adding recipe:', recipeData.namaResep);

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

      const result = await recipeApi.addRecipe(finalRecipeData, user.id);

      if (result.success && result.data) {
        // Add to local state
        setRecipes(prev => [result.data!, ...prev].sort((a, b) => a.namaResep.localeCompare(b.namaResep)));
        toast.success('Resep berhasil ditambahkan!');
        logger.debug('RecipeContext: Successfully added recipe:', result.data.id);
        return true;
      } else {
        throw new Error(result.error || 'Gagal menambahkan resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('RecipeContext: Error adding recipe:', error);
      return false;
    }
  }, [user?.id]);

  // Update existing recipe
  const updateRecipe = useCallback(async (id: string, updates: Partial<NewRecipe>): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    try {
      setError(null);
      logger.debug('RecipeContext: Updating recipe:', id);

      // Recalculate HPP if relevant data changed
      let finalUpdates = { ...updates };
      const existingRecipe = recipes.find(r => r.id === id);
      
      if (existingRecipe && (
        updates.bahanResep !== undefined ||
        updates.jumlahPorsi !== undefined ||
        updates.biayaTenagaKerja !== undefined ||
        updates.biayaOverhead !== undefined ||
        updates.marginKeuntunganPersen !== undefined ||
        updates.jumlahPcsPerPorsi !== undefined
      )) {
        const bahanResep = updates.bahanResep ?? existingRecipe.bahanResep;
        const jumlahPorsi = updates.jumlahPorsi ?? existingRecipe.jumlahPorsi;
        const biayaTenagaKerja = updates.biayaTenagaKerja ?? existingRecipe.biayaTenagaKerja;
        const biayaOverhead = updates.biayaOverhead ?? existingRecipe.biayaOverhead;
        const marginKeuntunganPersen = updates.marginKeuntunganPersen ?? existingRecipe.marginKeuntunganPersen;
        const jumlahPcsPerPorsi = updates.jumlahPcsPerPorsi ?? existingRecipe.jumlahPcsPerPorsi;

        const calculation = calculateHPP(
          bahanResep,
          jumlahPorsi,
          biayaTenagaKerja,
          biayaOverhead,
          marginKeuntunganPersen,
          jumlahPcsPerPorsi
        );

        finalUpdates = {
          ...finalUpdates,
          totalHpp: calculation.totalHPP,
          hppPerPorsi: calculation.hppPerPorsi,
          hargaJualPorsi: calculation.hargaJualPorsi,
          hppPerPcs: calculation.hppPerPcs,
          hargaJualPerPcs: calculation.hargaJualPerPcs,
        };
      }

      const result = await recipeApi.updateRecipe(id, finalUpdates, user.id);

      if (result.success && result.data) {
        // Update local state
        setRecipes(prev => prev.map(r => r.id === id ? result.data! : r));
        toast.success('Resep berhasil diperbarui!');
        logger.debug('RecipeContext: Successfully updated recipe:', result.data.id);
        return true;
      } else {
        throw new Error(result.error || 'Gagal memperbarui resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('RecipeContext: Error updating recipe:', error);
      return false;
    }
  }, [user?.id, recipes]);

  // Delete recipe
  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    try {
      setError(null);
      const recipeToDelete = recipes.find(r => r.id === id);
      if (!recipeToDelete) {
        toast.error('Resep tidak ditemukan');
        return false;
      }

      logger.debug('RecipeContext: Deleting recipe:', id);
      const result = await recipeApi.deleteRecipe(id, user.id);

      if (result.success) {
        // Remove from local state
        setRecipes(prev => prev.filter(r => r.id !== id));
        toast.success(`Resep "${recipeToDelete.namaResep}" berhasil dihapus`);
        logger.debug('RecipeContext: Successfully deleted recipe:', id);
        return true;
      } else {
        throw new Error(result.error || 'Gagal menghapus resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('RecipeContext: Error deleting recipe:', error);
      return false;
    }
  }, [user?.id, recipes]);

  // Duplicate recipe
  const duplicateRecipe = useCallback(async (id: string, newName: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    try {
      setError(null);
      const originalRecipe = recipes.find(r => r.id === id);
      if (!originalRecipe) {
        toast.error('Resep tidak ditemukan');
        return false;
      }

      logger.debug('RecipeContext: Duplicating recipe:', id, 'with name:', newName);

      const duplicatedRecipe: NewRecipe = {
        namaResep: newName,
        jumlahPorsi: originalRecipe.jumlahPorsi,
        kategoriResep: originalRecipe.kategoriResep,
        deskripsi: originalRecipe.deskripsi,
        fotoUrl: originalRecipe.fotoUrl,
        bahanResep: [...originalRecipe.bahanResep],
        biayaTenagaKerja: originalRecipe.biayaTenagaKerja,
        biayaOverhead: originalRecipe.biayaOverhead,
        marginKeuntunganPersen: originalRecipe.marginKeuntunganPersen,
        totalHpp: originalRecipe.totalHpp,
        hppPerPorsi: originalRecipe.hppPerPorsi,
        hargaJualPorsi: originalRecipe.hargaJualPorsi,
        jumlahPcsPerPorsi: originalRecipe.jumlahPcsPerPorsi,
        hppPerPcs: originalRecipe.hppPerPcs,
        hargaJualPerPcs: originalRecipe.hargaJualPerPcs,
      };

      const success = await addRecipe(duplicatedRecipe);
      if (success) {
        toast.success(`Resep "${newName}" berhasil diduplikasi`);
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menduplikasi resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('RecipeContext: Error duplicating recipe:', error);
      return false;
    }
  }, [user?.id, recipes, addRecipe]);

  // Bulk delete recipes
  const bulkDeleteRecipes = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    if (ids.length === 0) {
      toast.error('Tidak ada resep yang dipilih');
      return false;
    }

    try {
      setError(null);
      logger.debug('RecipeContext: Bulk deleting recipes:', ids);

      const result = await recipeApi.bulkDeleteRecipes(ids, user.id);

      if (result.success) {
        // Remove from local state
        setRecipes(prev => prev.filter(r => !ids.includes(r.id)));
        toast.success(`${ids.length} resep berhasil dihapus`);
        logger.debug('RecipeContext: Successfully bulk deleted recipes:', ids.length);
        return true;
      } else {
        throw new Error(result.error || 'Gagal menghapus resep');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus resep';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('RecipeContext: Error bulk deleting recipes:', error);
      return false;
    }
  }, [user?.id]);

  // Search recipes
  const searchRecipes = useCallback((query: string): Recipe[] => {
    if (!query.trim()) return recipes;
    
    const lowercaseQuery = query.toLowerCase();
    return recipes.filter(recipe => 
      recipe.namaResep.toLowerCase().includes(lowercaseQuery) ||
      recipe.kategoriResep?.toLowerCase().includes(lowercaseQuery) ||
      recipe.deskripsi?.toLowerCase().includes(lowercaseQuery) ||
      recipe.bahanResep.some(bahan => 
        bahan.nama.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [recipes]);

  // Get recipes by category
  const getRecipesByCategory = useCallback((category: string): Recipe[] => {
    if (!category.trim()) return recipes;
    return recipes.filter(recipe => recipe.kategoriResep === category);
  }, [recipes]);

  // Get unique categories
  const getUniqueCategories = useCallback((): string[] => {
    const categories = new Set(
      recipes
        .map(recipe => recipe.kategoriResep)
        .filter((category): category is string => Boolean(category))
    );
    return Array.from(categories).sort();
  }, [recipes]);

  // Get recipe statistics
  const getRecipeStats = useCallback(() => {
    const totalRecipes = recipes.length;
    const categories = getUniqueCategories();
    const totalCategories = categories.length;

    // Calculate average HPP
    const hppValues = recipes.map(r => r.hppPerPorsi).filter(hpp => hpp > 0);
    const averageHppPerPorsi = hppValues.length > 0 
      ? hppValues.reduce((sum, hpp) => sum + hpp, 0) / hppValues.length 
      : 0;

    // Find most/least expensive recipes
    const recipesWithHpp = recipes.filter(r => r.hppPerPorsi > 0);
    const mostExpensiveRecipe = recipesWithHpp.length > 0
      ? recipesWithHpp.reduce((max, recipe) => recipe.hppPerPorsi > max.hppPerPorsi ? recipe : max)
      : null;
    
    const cheapestRecipe = recipesWithHpp.length > 0
      ? recipesWithHpp.reduce((min, recipe) => recipe.hppPerPorsi < min.hppPerPorsi ? recipe : min)
      : null;

    // Calculate profitability stats
    const profitabilityStats = { high: 0, medium: 0, low: 0 };
    recipes.forEach(recipe => {
      const profitability = recipe.marginKeuntunganPersen || 0;
      if (profitability >= 30) {
        profitabilityStats.high++;
      } else if (profitability >= 15) {
        profitabilityStats.medium++;
      } else {
        profitabilityStats.low++;
      }
    });

    return {
      totalRecipes,
      totalCategories,
      averageHppPerPorsi,
      mostExpensiveRecipe,
      cheapestRecipe,
      profitabilityStats,
    };
  }, [recipes, getUniqueCategories]);

  // Load recipes on mount and user change
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Setup real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    logger.debug('RecipeContext: Setting up real-time subscription for user:', user.id);
    
    const unsubscribe = recipeApi.setupRealtimeSubscription(
      user.id,
      (newRecipe) => {
        setRecipes(prev => {
          const exists = prev.find(r => r.id === newRecipe.id);
          if (exists) return prev;
          return [newRecipe, ...prev].sort((a, b) => a.namaResep.localeCompare(b.namaResep));
        });
      },
      (updatedRecipe) => {
        setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
      },
      (deletedId) => {
        setRecipes(prev => prev.filter(r => r.id !== deletedId));
      }
    );

    return () => {
      logger.debug('RecipeContext: Cleaning up real-time subscription');
      unsubscribe();
    };
  }, [user?.id]);

  const value: RecipeContextType = {
    // State
    recipes,
    isLoading,
    error,

    // CRUD Operations
    addRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    bulkDeleteRecipes,

    // Business Logic
    calculateHPP,
    validateRecipeData,

    // Search & Filter
    searchRecipes,
    getRecipesByCategory,
    getUniqueCategories,

    // Statistics
    getRecipeStats,

    // Utilities
    refreshRecipes,
    clearError,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};