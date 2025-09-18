import React, { createContext, useContext, type ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from './AuthContext';
import { calculateHPP, validateRecipeData } from '@/components/recipe/services/recipeUtils';
import {
  type Recipe,
  type NewRecipe,
  type HPPCalculationResult,
  type BahanResep,
} from '@/components/recipe/types';
import { recipeApi } from '@/components/recipe/services/recipeApi';

import { recipeQueryKeys } from './recipe/queryKeys';
import { useRecipesQuery } from './recipe/useRecipeQueries';
import { useRecipeMutations } from './recipe/useRecipeMutations';
import { useRecipeRealtimeSync } from './recipe/useRecipeRealtimeSync';
import { useRecipeActions } from './recipe/useRecipeActions';

interface RecipeContextType {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  addRecipe: (recipe: NewRecipe) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<NewRecipe>, skipAutoCalculation?: boolean) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  duplicateRecipe: (id: string, newName: string) => Promise<boolean>;
  bulkDeleteRecipes: (ids: string[]) => Promise<boolean>;
  calculateHPP: (
    bahanResep: BahanResep[],
    jumlahPorsi: number,
    biayaTenagaKerja: number,
    biayaOverhead: number,
    marginKeuntunganPersen: number,
    jumlahPcsPerPorsi?: number
  ) => HPPCalculationResult;
  validateRecipeData: (recipe: Partial<NewRecipe>) => { isValid: boolean; errors: string[] };
  searchRecipes: (query: string) => Recipe[];
  getRecipesByCategory: (category: string) => Recipe[];
  getUniqueCategories: () => string[];
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
  refreshRecipes: () => Promise<void>;
  clearError: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: recipes = [],
    isLoading: queryLoading,
    error,
    refetch,
  } = useRecipesQuery(user?.id);

  const mutations = useRecipeMutations();

  useRecipeRealtimeSync(user?.id, queryClient);

  const {
    addRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    bulkDeleteRecipes,
    searchRecipes,
    getRecipesByCategory,
    getUniqueCategories,
    getRecipeStats,
    refreshRecipes,
    clearError,
    isMutating,
  } = useRecipeActions({
    userId: user?.id,
    recipes,
    refetch: async () => {
      await refetch();
    },
    calculateHPP,
    validateRecipeData,
    mutations,
  });

  const contextValue = useMemo<RecipeContextType>(() => ({
    recipes,
    isLoading: queryLoading || isMutating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    bulkDeleteRecipes,
    calculateHPP,
    validateRecipeData,
    searchRecipes,
    getRecipesByCategory,
    getUniqueCategories,
    getRecipeStats,
    refreshRecipes,
    clearError,
  }), [
    recipes,
    queryLoading,
    isMutating,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    bulkDeleteRecipes,
    searchRecipes,
    getRecipesByCategory,
    getUniqueCategories,
    getRecipeStats,
    refreshRecipes,
    clearError,
  ]);

  return <RecipeContext.Provider value={contextValue}>{children}</RecipeContext.Provider>;
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};

export const useRecipeQuery = () => {
  const queryClient = useQueryClient();

  const invalidateRecipes = () => {
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
  };

  const prefetchRecipes = () => {
    queryClient.prefetchQuery({
      queryKey: recipeQueryKeys.list(),
      queryFn: () => recipeApi.getRecipes(),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    invalidateRecipes,
    prefetchRecipes,
  };
};

export { recipeQueryKeys };

export default RecipeContext;
