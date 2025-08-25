// src/components/recipe/hooks/useRecipeTable.ts

import { useState, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';
import type { Recipe } from '../types';
import type { RecipeBulkEditData } from './useRecipeBulk';

export interface RecipeTableState {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  showBulkOperationsDialog: boolean;
}

export const useRecipeTable = (recipes: Recipe[] = []) => {
  const [state, setState] = useState<RecipeTableState>({
    selectedIds: new Set(),
    isSelectionMode: false,
    showBulkOperationsDialog: false
  });

  // Computed values
  const selectedRecipes = useMemo(() => {
    return recipes.filter(recipe => state.selectedIds.has(recipe.id));
  }, [recipes, state.selectedIds]);

  const selectedCount = state.selectedIds.size;
  const totalCount = recipes.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const hasSelection = selectedCount > 0;

  // Selection handlers
  const toggleSelection = useCallback((recipeId: string) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      
      if (newSelectedIds.has(recipeId)) {
        newSelectedIds.delete(recipeId);
      } else {
        newSelectedIds.add(recipeId);
      }
      
      logger.component('RecipeTable', 'Toggle selection:', {
        recipeId,
        selected: newSelectedIds.has(recipeId),
        totalSelected: newSelectedIds.size
      });
      
      return {
        ...prev,
        selectedIds: newSelectedIds,
        isSelectionMode: newSelectedIds.size > 0
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => {
      const allIds = new Set(recipes.map(recipe => recipe.id));
      
      logger.component('RecipeTable', 'Select all:', {
        count: allIds.size
      });
      
      return {
        ...prev,
        selectedIds: allIds,
        isSelectionMode: true
      };
    });
  }, [recipes]);

  const clearSelection = useCallback(() => {
    logger.component('RecipeTable', 'Clear selection');
    
    setState(prev => ({
      ...prev,
      selectedIds: new Set(),
      isSelectionMode: false
    }));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  // Bulk operations handlers
  const enterSelectionMode = useCallback(() => {
    logger.component('RecipeTable', 'Enter selection mode');
    
    setState(prev => ({
      ...prev,
      isSelectionMode: true
    }));
  }, []);

  const exitSelectionMode = useCallback(() => {
    logger.component('RecipeTable', 'Exit selection mode');
    
    setState(prev => ({
      ...prev,
      selectedIds: new Set(),
      isSelectionMode: false,
      showBulkOperationsDialog: false
    }));
  }, []);

  const showBulkOperations = useCallback(() => {
    if (!hasSelection) {
      logger.warn('RecipeTable', 'No recipes selected for bulk operations');
      return;
    }
    
    logger.component('RecipeTable', 'Show bulk operations dialog:', {
      selectedCount
    });
    
    setState(prev => ({
      ...prev,
      showBulkOperationsDialog: true
    }));
  }, [hasSelection, selectedCount]);

  const hideBulkOperations = useCallback(() => {
    logger.component('RecipeTable', 'Hide bulk operations dialog');
    
    setState(prev => ({
      ...prev,
      showBulkOperationsDialog: false
    }));
  }, []);

  // Bulk action handlers
  const handleBulkEdit = useCallback((recipes: Recipe[]) => {
    logger.component('RecipeTable', 'Handle bulk edit:', {
      count: recipes.length
    });
    
    showBulkOperations();
  }, [showBulkOperations]);

  const handleBulkDelete = useCallback((recipes: Recipe[]) => {
    logger.component('RecipeTable', 'Handle bulk delete:', {
      count: recipes.length
    });
    
    showBulkOperations();
  }, [showBulkOperations]);

  // Utility functions
  const isSelected = useCallback((recipeId: string) => {
    return state.selectedIds.has(recipeId);
  }, [state.selectedIds]);

  const getSelectedRecipeIds = useCallback(() => {
    return Array.from(state.selectedIds);
  }, [state.selectedIds]);

  // Reset state when recipes change significantly
  const resetState = useCallback(() => {
    logger.component('RecipeTable', 'Reset state');
    
    setState({
      selectedIds: new Set(),
      isSelectionMode: false,
      showBulkOperationsDialog: false
    });
  }, []);

  return {
    // State
    selectedIds: state.selectedIds,
    selectedRecipes,
    selectedCount,
    totalCount,
    isSelectionMode: state.isSelectionMode,
    showBulkOperationsDialog: state.showBulkOperationsDialog,
    isAllSelected,
    hasSelection,
    
    // Selection handlers
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    isSelected,
    getSelectedRecipeIds,
    
    // Mode handlers
    enterSelectionMode,
    exitSelectionMode,
    
    // Bulk operations
    showBulkOperations,
    hideBulkOperations,
    handleBulkEdit,
    handleBulkDelete,
    
    // Utilities
    resetState
  };
};

export type RecipeTableHook = ReturnType<typeof useRecipeTable>;