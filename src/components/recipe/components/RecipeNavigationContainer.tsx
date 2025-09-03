// src/components/recipe/components/RecipeNavigationContainer.tsx
// Container component that manages navigation states for recipe management

import React, { useState, Suspense, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Services and types
import { recipeApi } from '../services/recipeApi';
import type { Recipe, NewRecipe } from '../types';

// Hooks
import { useRecipeFiltering } from '../hooks/useRecipeFiltering';
import { useRecipeStats } from '../hooks/useRecipeStats';
import { useRecipeTable } from '../hooks/useRecipeTable';

// Components
import { EmptyState } from './shared/EmptyState';
import { LoadingState } from './shared/LoadingState';
import BulkActions from './BulkActions';
import RecipeFormPage from './RecipeFormPage';

// Breadcrumb and view mode types
import type { RecipeViewMode } from './RecipeBreadcrumb';

// Query Keys
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  categories: () => [...RECIPE_QUERY_KEYS.all, 'categories'] as const,
} as const;

// Lazy loaded components with better error handling
const DeleteRecipeDialog = React.lazy(() => 
  import('../dialogs/DeleteRecipeDialog')
    .catch(error => {
      logger.error('Failed to load DeleteRecipeDialog:', error);
      return { default: () => <div>Error loading dialog</div> };
    })
);

const DuplicateRecipeDialog = React.lazy(() => 
  import('../dialogs/DuplicateRecipeDialog')
    .catch(error => {
      logger.error('Failed to load DuplicateRecipeDialog:', error);
      return { default: () => <div>Error loading dialog</div> };
    })
);

const CategoryManagerDialog = React.lazy(() =>
  import('../dialogs/CategoryManagerDialog')
    .catch(error => {
      logger.error('Failed to load CategoryManagerDialog:', error);
      return { default: () => <div>Error loading dialog</div> };
    })
);

const RecipeTable = React.lazy(() =>
  import('./RecipeList/RecipeTable')
    .catch(error => {
      logger.error('Failed to load RecipeTable:', error);
      return { default: () => <div>Error loading table</div> };
    })
);

const RecipeFilters = React.lazy(() =>
  import('./RecipeList/RecipeFilters')
    .catch(error => {
      logger.error('Failed to load RecipeFilters:', error);
      return { default: () => <div>Error loading filters</div> };
    })
);

const RecipeStats = React.lazy(() =>
  import('./RecipeList/RecipeStats')
    .catch(error => {
      logger.error('Failed to load RecipeStats:', error);
      return { default: () => <div>Error loading stats</div> };
    })
);

// Navigation state interface
interface NavigationState {
  currentView: RecipeViewMode;
  selectedRecipe?: Recipe | null;
  dialogType?: 'none' | 'delete' | 'duplicate' | 'category';
}

const RecipeNavigationContainer: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentView: 'list',
    dialogType: 'none',
  });
  
  // Recipe table hook for bulk operations
  const recipeTable = useRecipeTable();

  // Recipe data query
  const recipesQuery = useQuery({
    queryKey: RECIPE_QUERY_KEYS.lists(),
    queryFn: async () => {
      try {
        logger.component('RecipeNav', 'Fetching recipes...');
        const result = await recipeApi.getRecipes();
        
        const recipes = Array.isArray(result) ? result : 
                       result?.data ? (Array.isArray(result.data) ? result.data : []) : 
                       [];
        
        logger.success('Recipes fetched:', { count: recipes.length });
        return recipes;
      } catch (error) {
        logger.error('Failed to fetch recipes:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to load recipes');
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Categories query
  const categoriesQuery = useQuery({
    queryKey: RECIPE_QUERY_KEYS.categories(),
    queryFn: async () => {
      try {
        logger.component('RecipeNav', 'Fetching categories...');
        const result = await recipeApi.getUniqueCategories();
        
        const categories = Array.isArray(result) ? result : 
                          result?.data ? (Array.isArray(result.data) ? result.data : []) :
                          [];
        
        logger.success('Categories fetched:', { count: categories.length });
        return categories;
      } catch (error) {
        logger.error('Failed to fetch categories:', error);
        return [];
      }
    },
    enabled: recipesQuery.isSuccess,
    staleTime: 10 * 60 * 1000,
  });

  // Delete mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.component('RecipeNav', 'Deleting recipe:', id);
      const result = await recipeApi.deleteRecipe(id);
      return { id, result };
    },
    onSuccess: ({ id }) => {
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.lists(),
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(recipe => recipe.id !== id);
        }
      );

      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
      
      const deletedRecipe = recipesQuery.data?.find(recipe => recipe.id === id);
      toast.success(`Resep "${deletedRecipe?.namaResep || 'Unknown'}" berhasil dihapus`);
      
      setNavigationState(prev => ({ ...prev, dialogType: 'none', selectedRecipe: null }));
    },
    onError: (error: Error) => {
      logger.error('Error deleting recipe:', error);
      toast.error(error.message || 'Gagal menghapus resep');
    },
  });

  // Duplicate mutation
  const duplicateRecipeMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      logger.component('RecipeNav', 'Duplicating recipe:', { id, newName });
      const result = await recipeApi.duplicateRecipe(id, newName);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from duplicate API');
      }
      
      return result;
    },
    onSuccess: (newRecipe) => {
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.lists(),
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return [newRecipe];
          return [newRecipe, ...oldData];
        }
      );

      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
      
      toast.success(`Resep "${newRecipe.namaResep}" berhasil diduplikasi`);
      
      setNavigationState(prev => ({ ...prev, dialogType: 'none', selectedRecipe: null }));
    },
    onError: (error: Error) => {
      logger.error('Error duplicating recipe:', error);
      toast.error(error.message || 'Gagal menduplikasi resep');
    },
  });

  // Get data with fallbacks
  const recipes = recipesQuery.data || [];
  const availableCategories = categoriesQuery.data || [];
  const isLoading = recipesQuery.isLoading;
  const error = recipesQuery.error?.message;

  // Hooks for filtering and stats
  const filtering = useRecipeFiltering({ recipes });
  const stats = useRecipeStats({ recipes: filtering.filteredAndSortedRecipes });

  // Check if any mutation is loading
  const isProcessing = deleteRecipeMutation.isPending || duplicateRecipeMutation.isPending;

  // Navigation handlers
  const handleNavigate = useCallback((view: RecipeViewMode, recipe?: Recipe) => {
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
    
    try {
      await deleteRecipeMutation.mutateAsync(navigationState.selectedRecipe.id);
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  }, [navigationState.selectedRecipe, deleteRecipeMutation]);

  const handleConfirmDuplicate = useCallback(async (newName: string): Promise<boolean> => {
    if (!navigationState.selectedRecipe) return false;
    
    try {
      await duplicateRecipeMutation.mutateAsync({
        id: navigationState.selectedRecipe.id,
        newName
      });
      return true;
    } catch (error) {
      return false;
    }
  }, [navigationState.selectedRecipe, duplicateRecipeMutation]);

  const handleRefresh = useCallback(() => {
    logger.component('RecipeNav', 'Refreshing all recipe data...');
    queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
  }, [queryClient]);

  const handleFormSuccess = useCallback((recipe: Recipe, isEdit: boolean) => {
    logger.success('Recipe form success:', { id: recipe.id, nama: recipe.namaResep, isEdit });
    
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

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Gagal Memuat Resep
            </h2>
            
            <p className="text-gray-600 mb-4">
              {error || 'Terjadi kesalahan yang tidak terduga'}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Coba Lagi
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Refresh Halaman
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render based on current view
  if (navigationState.currentView === 'add') {
    return (
      <RecipeFormPage
        mode="add"
        onNavigate={handleNavigate}
        onSuccess={handleFormSuccess}
        isLoading={isProcessing}
      />
    );
  }

  if (navigationState.currentView === 'edit' && navigationState.selectedRecipe) {
    return (
      <RecipeFormPage
        mode="edit"
        initialData={navigationState.selectedRecipe}
        onNavigate={handleNavigate}
        onSuccess={handleFormSuccess}
        isLoading={isProcessing}
      />
    );
  }

  // List view (default)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full p-4 sm:p-6 space-y-6">

        {/* Header with Add Recipe Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manajemen Resep
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola resep dan hitung HPP dengan mudah
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setNavigationState(prev => ({ ...prev, dialogType: 'category' }))}
              disabled={isProcessing}
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              Kelola Kategori
            </Button>
            <Button
              onClick={handleAddRecipe}
              disabled={isProcessing}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Tambah Resep
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <Suspense fallback={<div />}>
          <RecipeStats stats={stats} />
        </Suspense>

        {/* Main Content Card */}
        <Card className="border border-gray-200 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">

            {/* Filters */}
            <div className="p-6 pb-0">
              <Suspense fallback={<div />}>
                <RecipeFilters
                  searchTerm={filtering.searchTerm}
                  onSearchChange={filtering.setSearchTerm}
                  categoryFilter={filtering.categoryFilter}
                  onCategoryFilterChange={filtering.setCategoryFilter}
                  categories={availableCategories}
                  sortBy={filtering.sortBy}
                  onSortByChange={filtering.setSortBy}
                  sortOrder={filtering.sortOrder}
                  onSortOrderChange={filtering.setSortOrder}
                  hasActiveFilters={filtering.hasActiveFilters}
                  onClearFilters={filtering.clearFilters}
                  totalResults={filtering.filteredAndSortedRecipes.length}
                  onSort={filtering.handleSort}
                />
              </Suspense>
            </div>

            {/* Bulk Actions */}
            <BulkActions
              isVisible={recipeTable.isSelectionMode}
              selectedCount={recipeTable.selectedIds.size}
              totalFilteredCount={filtering.filteredAndSortedRecipes.length}
              onCancel={recipeTable.exitSelectionMode}
              onSelectAll={recipeTable.selectAll}
              onBulkEdit={recipeTable.showBulkOperations}
              onBulkDelete={recipeTable.showBulkOperations}
              recipes={filtering.filteredAndSortedRecipes.filter(recipe => recipeTable.selectedIds.has(recipe.id))}
            />

            {/* Content */}
            {filtering.filteredAndSortedRecipes.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={recipes.length === 0 ? "Belum ada resep" : "Tidak ada hasil"}
                  description={
                    recipes.length === 0
                      ? "Mulai dengan menambahkan resep pertama Anda"
                      : "Coba ubah filter pencarian atau tambah resep baru"
                  }
                  actionLabel={recipes.length === 0 ? "Tambah Resep Pertama" : "Bersihkan Filter"}
                  onAction={recipes.length === 0 ? handleAddRecipe : filtering.clearFilters}
                  type={recipes.length === 0 ? "no-data" : "no-results"}
                />
              </div>
            ) : (
              <Suspense fallback={<div />}>
                <RecipeTable
                  recipes={filtering.filteredAndSortedRecipes}
                  onSort={filtering.handleSort}
                  sortBy={filtering.sortBy}
                  sortOrder={filtering.sortOrder}
                  onEdit={handleEditRecipe}
                  onDuplicate={handleDuplicateRecipe}
                  onDelete={handleDeleteRecipe}
                  searchTerm={filtering.searchTerm}
                  isLoading={isProcessing}
                  selectedIds={recipeTable.selectedIds}
                  onSelectionChange={recipeTable.toggleSelection}
                  isSelectionMode={recipeTable.isSelectionMode}
                  onSelectAll={recipeTable.selectAll}
                  isAllSelected={recipeTable.isAllSelected}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>

        {/* Status Bar */}
        {isProcessing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <p className="text-blue-800 font-medium">
                  Memproses operasi...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Footer Stats */}
        {recipes.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            <p>
              Menampilkan {filtering.filteredAndSortedRecipes.length} dari {recipes.length} resep
              {availableCategories.length > 0 && ` • ${availableCategories.length} kategori`}
            </p>
          </div>
        )}
      </div>

      {/* Dialogs with improved Suspense and error handling */}
      <Suspense fallback={<div />}>
        {navigationState.dialogType === 'delete' && (
          <DeleteRecipeDialog
            isOpen={true}
            onOpenChange={closeDialog}
            recipe={navigationState.selectedRecipe}
            onConfirm={handleConfirmDelete}
            isLoading={deleteRecipeMutation.isPending}
          />
        )}

        {navigationState.dialogType === 'duplicate' && (
          <DuplicateRecipeDialog
            isOpen={true}
            onOpenChange={closeDialog}
            recipe={navigationState.selectedRecipe}
            onConfirm={handleConfirmDuplicate}
            isLoading={duplicateRecipeMutation.isPending}
          />
        )}

        {navigationState.dialogType === 'category' && (
          <CategoryManagerDialog
            isOpen={true}
            onOpenChange={closeDialog}
            recipes={recipes}
            updateRecipe={async (id: string, data: Partial<NewRecipe>) => {
              // Implementation would go here
              return true;
            }}
            refreshRecipes={handleRefresh}
          />
        )}
      </Suspense>
    </div>
  );
};

export default RecipeNavigationContainer;
