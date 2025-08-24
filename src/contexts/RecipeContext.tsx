// src/contexts/RecipeContext.tsx
// REFACTORED VERSION - Using TanStack Query for better performance and caching

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { logger } from '@/utils/logger';

// Import recipe services and types
import { recipeApi } from '@/components/recipe/services/recipeApi';
import { calculateHPP, validateRecipeData } from '@/components/recipe/services/recipeUtils';
import {
  getAllAvailableCategories,
  type Recipe,
  type NewRecipe,
  type HPPCalculationResult,
  type BahanResep,
} from '@/components/recipe/types';

// ===========================================
// QUERY KEYS - Centralized for consistency
// ===========================================

export const recipeQueryKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeQueryKeys.all, 'list'] as const,
  list: (filters?: any) => [...recipeQueryKeys.lists(), filters] as const,
  details: () => [...recipeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeQueryKeys.details(), id] as const,
  categories: () => [...recipeQueryKeys.all, 'categories'] as const,
  stats: () => [...recipeQueryKeys.all, 'stats'] as const,
} as const;

// ===========================================
// CONTEXT TYPE
// ===========================================

interface RecipeContextType {
  // State
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  addRecipe: (recipe: NewRecipe) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<NewRecipe>, skipAutoCalculation?: boolean) => Promise<boolean>;
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

// ===========================================
// CONTEXT SETUP
// ===========================================

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// ===========================================
// CUSTOM HOOKS FOR QUERY OPERATIONS
// ===========================================

/**
 * Hook for fetching recipes
 */
const useRecipesQuery = (userId?: string) => {
  return useQuery({
    queryKey: recipeQueryKeys.list(),
    queryFn: () => recipeApi.getRecipes(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for recipe mutations
 */
const useRecipeMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Add recipe mutation
  const addMutation = useMutation({
    mutationFn: (data: NewRecipe) => recipeApi.createRecipe(data),
    onMutate: async (newRecipe) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: recipeQueryKeys.lists() 
      });

      // Snapshot previous value
      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list());

      // Optimistically update
      const optimisticRecipe: Recipe = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        namaResep: newRecipe.namaResep,
        jumlahPorsi: newRecipe.jumlahPorsi,
        kategoriResep: newRecipe.kategoriResep || '',
        deskripsi: newRecipe.deskripsi || '',
        fotoUrl: newRecipe.fotoUrl || '',
        bahanResep: newRecipe.bahanResep,
        biayaTenagaKerja: newRecipe.biayaTenagaKerja,
        biayaOverhead: newRecipe.biayaOverhead,
        marginKeuntunganPersen: newRecipe.marginKeuntunganPersen,
        totalHpp: newRecipe.totalHpp || 0,
        hppPerPorsi: newRecipe.hppPerPorsi || 0,
        hargaJualPorsi: newRecipe.hargaJualPorsi || 0,
        jumlahPcsPerPorsi: newRecipe.jumlahPcsPerPorsi || 1,
        hppPerPcs: newRecipe.hppPerPcs || 0,
        hargaJualPerPcs: newRecipe.hargaJualPerPcs || 0,
      };

      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) => [optimisticRecipe, ...old].sort((a, b) => a.namaResep.localeCompare(b.namaResep))
      );

      return { previousRecipes };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menambahkan resep: ${errorMessage}`);
    },
    onSuccess: (newRecipe, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success('Resep berhasil ditambahkan!');
      logger.debug('RecipeContext: Successfully added recipe:', newRecipe.id);
    }
  });

  // Update recipe mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewRecipe> }) => 
      recipeApi.updateRecipe(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: recipeQueryKeys.lists() });

      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list());

      // Optimistically update
      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) =>
          old.map(recipe =>
            recipe.id === id
              ? { ...recipe, ...data, updatedAt: new Date() }
              : recipe
          )
      );

      return { previousRecipes };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal memperbarui resep: ${errorMessage}`);
    },
    onSuccess: (updatedRecipe) => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success('Resep berhasil diperbarui!');
      logger.debug('RecipeContext: Successfully updated recipe:', updatedRecipe.id);
    }
  });

  // Delete recipe mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => recipeApi.deleteRecipe(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: recipeQueryKeys.lists() });

      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list()) as Recipe[];
      const recipeToDelete = previousRecipes?.find(r => r.id === id);

      // Optimistically update
      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) => old.filter(r => r.id !== id)
      );

      return { previousRecipes, recipeToDelete };
    },
    onError: (error: any, id, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menghapus resep: ${errorMessage}`);
    },
    onSuccess: (result, id, context) => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      if (context?.recipeToDelete) {
        toast.success(`Resep "${context.recipeToDelete.namaResep}" berhasil dihapus`);
      } else {
        toast.success('Resep berhasil dihapus');
      }
      
      logger.debug('RecipeContext: Successfully deleted recipe:', id);
    }
  });

  // Duplicate recipe mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      recipeApi.duplicateRecipe(id, newName),
    onSuccess: (duplicatedRecipe, { newName }) => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success(`Resep "${newName}" berhasil diduplikasi`);
      logger.debug('RecipeContext: Successfully duplicated recipe:', duplicatedRecipe.id);
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Gagal menduplikasi resep';
      toast.error(errorMessage);
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => recipeApi.bulkDeleteRecipes(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: recipeQueryKeys.lists() });

      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list()) as Recipe[];

      // Optimistically update
      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) => old.filter(r => !ids.includes(r.id))
      );

      return { previousRecipes };
    },
    onError: (error: any, ids, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }
      
      const errorMessage = error.message || 'Gagal menghapus resep';
      toast.error(errorMessage);
    },
    onSuccess: (result, ids) => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success(`${ids.length} resep berhasil dihapus`);
      logger.debug('RecipeContext: Successfully bulk deleted recipes:', ids.length);
    }
  });

  return {
    addMutation,
    updateMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation
  };
};

// ===========================================
// PROVIDER COMPONENT
// ===========================================

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch recipes using React Query
  const {
    data: recipes = [],
    isLoading,
    error,
    refetch
  } = useRecipesQuery(user?.id);

  // Get mutations
  const {
    addMutation,
    updateMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation
  } = useRecipeMutations();

  // ===========================================
  // REAL-TIME SUBSCRIPTION
  // ===========================================

  useEffect(() => {
    if (!user?.id) return;

    logger.debug('RecipeContext: Setting up real-time subscription for user:', user.id);
    
    const unsubscribe = recipeApi.setupRealtimeSubscription(
      // onInsert
      () => {
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
      },
      // onUpdate
      () => {
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
      },
      // onDelete
      () => {
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
      }
    );

    return () => {
      logger.debug('RecipeContext: Cleaning up real-time subscription');
      unsubscribe();
    };
  }, [user?.id, queryClient]);

  // ===========================================
  // CONTEXT FUNCTIONS
  // ===========================================

  const addRecipe = useCallback(async (recipeData: NewRecipe): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    // Validate recipe data
    const validation = validateRecipeData(recipeData);
    if (!validation.isValid) {
      const errorMessage = `Data resep tidak valid: ${validation.errors.join(', ')}`;
      toast.error(errorMessage);
      return false;
    }

    // Calculate HPP if not provided
    let finalRecipeData = { ...recipeData };
    if (!finalRecipeData.totalHpp || !finalRecipeData.hppPerPorsi) {
      // NOTE: This uses legacy HPP calculation for backward compatibility
      // Enhanced HPP calculation with operational costs integration
      // is available through RecipeHppIntegration component
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

    try {
      await addMutation.mutateAsync(finalRecipeData);
      return true;
    } catch (error) {
      return false;
    }
  }, [user?.id, addMutation]);

  const updateRecipe = useCallback(async (id: string, updates: Partial<NewRecipe>, skipAutoCalculation: boolean = false): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    // Recalculate HPP if relevant data changed and not skipping auto-calculation
    let finalUpdates = { ...updates };
    const existingRecipe = recipes.find(r => r.id === id);
    
    if (!skipAutoCalculation && existingRecipe && (
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

      // NOTE: This uses legacy HPP calculation for backward compatibility
      // Enhanced HPP calculation with operational costs integration
      // is available through RecipeHppIntegration component
      // Use skipAutoCalculation=true when updating with enhanced calculation results
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

    try {
      await updateMutation.mutateAsync({ id, data: finalUpdates });
      return true;
    } catch (error) {
      return false;
    }
  }, [user?.id, recipes, updateMutation]);

  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  }, [user?.id, deleteMutation]);

  const duplicateRecipe = useCallback(async (id: string, newName: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return false;
    }

    try {
      await duplicateMutation.mutateAsync({ id, newName });
      return true;
    } catch (error) {
      return false;
    }
  }, [user?.id, duplicateMutation]);

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
      await bulkDeleteMutation.mutateAsync(ids);
      return true;
    } catch (error) {
      return false;
    }
  }, [user?.id, bulkDeleteMutation]);

  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================

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
    return getAllAvailableCategories(recipes);
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

  // Refresh recipes
  const refreshRecipes = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Clear error
  const clearError = useCallback(() => {
    // Error handling is managed by React Query, but we keep this for interface compatibility
  }, []);

  // ===========================================
  // CONTEXT VALUE
  // ===========================================

  const value: RecipeContextType = {
    // State
    recipes,
    isLoading: isLoading || addMutation.isPending || updateMutation.isPending || 
               deleteMutation.isPending || duplicateMutation.isPending || bulkDeleteMutation.isPending,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,

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

// ===========================================
// HOOK
// ===========================================

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};

// ===========================================
// ADDITIONAL HOOKS FOR REACT QUERY UTILITIES
// ===========================================

/**
 * Hook for accessing React Query specific functions
 */
export const useRecipeQuery = () => {
  const queryClient = useQueryClient();

  const invalidateRecipes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
  }, [queryClient]);

  const prefetchRecipes = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: recipeQueryKeys.list(),
      queryFn: () => recipeApi.getRecipes(),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateRecipes,
    prefetchRecipes,
  };
};

export default RecipeContext;