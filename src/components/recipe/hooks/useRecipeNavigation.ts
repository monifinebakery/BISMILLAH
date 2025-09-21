import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { RECIPE_QUERY_KEYS } from './RecipeNavigationContainer';
import type { Recipe } from '../types';

interface NavigationState {
  currentView: 'list' | 'add' | 'edit';
  selectedRecipe?: Recipe | null;
  dialogType?: 'none' | 'delete' | 'duplicate' | 'category';
}

const initialNavigationState: NavigationState = {
  currentView: 'list',
  dialogType: 'none',
};

export const useRecipeNavigation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [navigationState, setNavigationState] = useState<NavigationState>(initialNavigationState);

  const handleNavigate = useCallback((view: NavigationState['currentView'], recipe?: Recipe) => {
    setNavigationState(prev => ({
      ...prev,
      currentView: view,
      selectedRecipe: recipe || null,
      dialogType: 'none',
    }));
  }, []);

  const handleAddRecipe = useCallback(() => {
    logger.component('RecipeNav', 'Add recipe clicked');
    handleNavigate('add');
  }, [handleNavigate]);

  const handleEditRecipe = useCallback((recipe: Recipe) => {
    logger.component('RecipeNav', 'Edit recipe clicked:', recipe.id);
    handleNavigate('edit', recipe);
  }, [handleNavigate]);

  const handleDeleteRecipe = useCallback((recipe: Recipe) => {
    logger.component('RecipeNav', 'Delete recipe clicked:', recipe.id);
    setNavigationState(prev => ({
      ...prev,
      dialogType: 'delete',
      selectedRecipe: recipe,
    }));
  }, []);

  const handleDuplicateRecipe = useCallback((recipe: Recipe) => {
    logger.component('RecipeNav', 'Duplicate recipe clicked:', recipe.id);
    setNavigationState(prev => ({
      ...prev,
      dialogType: 'duplicate',
      selectedRecipe: recipe,
    }));
  }, []);

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!navigationState.selectedRecipe) return;
    // This will be called from mutations
  }, [navigationState.selectedRecipe]);

  const handleConfirmDuplicate = useCallback(async (newName: string): Promise<boolean> => {
    if (!navigationState.selectedRecipe) return false;
    // This will be called from mutations
    return true;
  }, [navigationState.selectedRecipe]);

  const handleRefresh = useCallback(() => {
    logger.component('RecipeNav', 'Refreshing all recipe data...');
    queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
  }, [queryClient]);

  const handleFormSuccess = useCallback((recipe: Recipe, isEdit: boolean) => {
    const anyRec: any = recipe as any;
    logger.success('Recipe form success:', { id: recipe.id, nama: anyRec.nama_resep ?? anyRec.namaResep, isEdit });

    if (!isEdit) {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
    }
  }, [queryClient]);

  const closeDialog = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      dialogType: 'none',
      selectedRecipe: null
    }));
  }, []);

  return {
    navigationState,
    setNavigationState,
    handlers: {
      handleNavigate,
      handleAddRecipe,
      handleEditRecipe,
      handleDeleteRecipe,
      handleDuplicateRecipe,
      handleConfirmDelete,
      handleConfirmDuplicate,
      handleRefresh,
      handleFormSuccess,
      closeDialog,
    },
  };
};
