// src/pages/Recipes.tsx - Fixed and Simplified

import React, { useState, Suspense, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ChefHat, Plus, List } from 'lucide-react';

// API and services
import { recipeApi } from '@/components/recipe/services/recipeApi';

// Hooks
import { useRecipeFiltering } from '@/components/recipe/hooks/useRecipeFiltering';
import { useRecipeStats } from '@/components/recipe/hooks/useRecipeStats';
import { useRecipeTable } from '@/components/recipe/hooks/useRecipeTable';

// Components
import { EmptyState } from '@/components/recipe/components/shared/EmptyState';
import { LoadingState } from '@/components/recipe/components/shared/LoadingState';
import BulkActions from '@/components/recipe/components/BulkActions';


// Types
import type { Recipe, NewRecipe } from '@/components/recipe/types';

// ✅ Simplified Query Keys
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  categories: () => [...RECIPE_QUERY_KEYS.all, 'categories'] as const,
} as const;

// ✅ Lazy loaded components with better error handling
const RecipeForm = React.lazy(() => 
  import('@/components/recipe/components/RecipeForm')
    .catch(error => {
      logger.error('Failed to load RecipeForm:', error);
      return { default: () => <div>Error loading form</div> };
    })
);

const DeleteRecipeDialog = React.lazy(() => 
  import('@/components/recipe/dialogs/DeleteRecipeDialog')
    .catch(error => {
      logger.error('Failed to load DeleteRecipeDialog:', error);
      return { default: () => <div>Error loading dialog</div> };
    })
);

const DuplicateRecipeDialog = React.lazy(() => 
  import('@/components/recipe/dialogs/DuplicateRecipeDialog')
    .catch(error => {
      logger.error('Failed to load DuplicateRecipeDialog:', error);
      return { default: () => <div>Error loading dialog</div> };
    })
);

const CategoryManagerDialog = React.lazy(() =>
  import('@/components/recipe/dialogs/CategoryManagerDialog')
    .catch(error => {
      logger.error('Failed to load CategoryManagerDialog:', error);
      return { default: () => <div>Error loading dialog</div> };
    })
);

const RecipeTable = React.lazy(() =>
  import('@/components/recipe/components/RecipeList/RecipeTable')
    .catch(error => {
      logger.error('Failed to load RecipeTable:', error);
      return { default: () => <div>Error loading table</div> };
    })
);

const RecipeFilters = React.lazy(() =>
  import('@/components/recipe/components/RecipeList/RecipeFilters')
    .catch(error => {
      logger.error('Failed to load RecipeFilters:', error);
      return { default: () => <div>Error loading filters</div> };
    })
);

const RecipeStats = React.lazy(() =>
  import('@/components/recipe/components/RecipeList/RecipeStats')
    .catch(error => {
      logger.error('Failed to load RecipeStats:', error);
      return { default: () => <div>Error loading stats</div> };
    })
);

// ✅ Better Loading Fallback
const RecipeLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
    <div className="w-full p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg border p-6">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <LoadingState />
      </div>
    </div>
  </div>
);

// ✅ Improved Error Fallback
const RecipeErrorFallback: React.FC<{ error?: string; onRetry?: () => void }> = ({ 
  error, 
  onRetry 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
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
          {onRetry && (
            <Button
              onClick={onRetry}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Coba Lagi
            </Button>
          )}
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Refresh Halaman
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ✅ Main Recipes Component - Simplified
const Recipes: React.FC = () => {
  const queryClient = useQueryClient();
  
  // ✅ SIMPLIFIED: Single dialog state management
  const [dialogState, setDialogState] = useState<{
    type: 'none' | 'form' | 'delete' | 'duplicate' | 'category';
    recipe?: Recipe | null;
    isEdit?: boolean;
  }>({ type: 'none' });

  // ✅ Recipe table hook for bulk operations
  const recipeTable = useRecipeTable();

  // ✅ ROBUST: useQuery for Recipes with better error handling
  const recipesQuery = useQuery({
    queryKey: RECIPE_QUERY_KEYS.lists(),
    queryFn: async () => {
      try {
        logger.component('Recipes', 'Fetching recipes...');
        const result = await recipeApi.getRecipes();
        
        // ✅ DEFENSIVE: Ensure we always get an array
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

  // ✅ ROBUST: useQuery for Categories
  const categoriesQuery = useQuery({
    queryKey: RECIPE_QUERY_KEYS.categories(),
    queryFn: async () => {
      try {
        logger.component('Recipes', 'Fetching categories...');
        const result = await recipeApi.getUniqueCategories();
        
        // ✅ DEFENSIVE: Ensure we always get an array
        const categories = Array.isArray(result) ? result : 
                          result?.data ? (Array.isArray(result.data) ? result.data : []) :
                          [];
        
        logger.success('Categories fetched:', { count: categories.length });
        return categories;
      } catch (error) {
        logger.error('Failed to fetch categories:', error);
        // ✅ Don't throw for categories - just return empty array
        return [];
      }
    },
    enabled: recipesQuery.isSuccess,
    staleTime: 10 * 60 * 1000,
  });

  // ✅ IMPROVED: Delete mutation with optimistic updates
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.component('Recipes', 'Deleting recipe:', id);
      const result = await recipeApi.deleteRecipe(id);
      return { id, result };
    },
    onSuccess: ({ id }) => {
      // ✅ Optimistic update
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
      
      // ✅ Close dialog
      setDialogState({ type: 'none' });
    },
    onError: (error: Error) => {
      logger.error('Error deleting recipe:', error);
      toast.error(error.message || 'Gagal menghapus resep');
    },
  });

  // ✅ IMPROVED: Duplicate mutation
  const duplicateRecipeMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      logger.component('Recipes', 'Duplicating recipe:', { id, newName });
      const result = await recipeApi.duplicateRecipe(id, newName);
      
      // ✅ DEFENSIVE: Ensure we get a recipe object
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from duplicate API');
      }
      
      return result;
    },
    onSuccess: (newRecipe) => {
      // ✅ Optimistic update
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.lists(),
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return [newRecipe];
          return [newRecipe, ...oldData];
        }
      );

      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
      
      toast.success(`Resep "${newRecipe.namaResep}" berhasil diduplikasi`);
      
      // ✅ Close dialog
      setDialogState({ type: 'none' });
    },
    onError: (error: Error) => {
      logger.error('Error duplicating recipe:', error);
      toast.error(error.message || 'Gagal menduplikasi resep');
    },
  });

  // ✅ Get data with fallbacks
  const recipes = recipesQuery.data || [];
  const availableCategories = categoriesQuery.data || [];
  const isLoading = recipesQuery.isLoading;
  const error = recipesQuery.error?.message;

  // ✅ Hooks for filtering and stats
  const filtering = useRecipeFiltering({ recipes });
  const stats = useRecipeStats({ recipes: filtering.filteredAndSortedRecipes });

  // ✅ Check if any mutation is loading
  const isProcessing = deleteRecipeMutation.isPending || duplicateRecipeMutation.isPending;

  // ✅ HANDLERS - Simplified with single state management
  const handleAddRecipe = useCallback(() => {
    logger.component('Recipes', 'Add recipe clicked');
    setDialogState({ type: 'form', isEdit: false });
  }, []);

  const handleEditRecipe = useCallback((recipe: Recipe) => {
    logger.component('Recipes', 'Edit recipe clicked:', recipe.id);
    setDialogState({ type: 'form', recipe, isEdit: true });
  }, []);

  const handleDeleteRecipe = useCallback((recipe: Recipe) => {
    logger.component('Recipes', 'Delete recipe clicked:', recipe.id);
    setDialogState({ type: 'delete', recipe });
  }, []);

  const handleDuplicateRecipe = useCallback((recipe: Recipe) => {
    logger.component('Recipes', 'Duplicate recipe clicked:', recipe.id);
    setDialogState({ type: 'duplicate', recipe });
  }, []);

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!dialogState.recipe) return;
    
    try {
      await deleteRecipeMutation.mutateAsync(dialogState.recipe.id);
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  }, [dialogState.recipe, deleteRecipeMutation]);

  const handleConfirmDuplicate = useCallback(async (newName: string): Promise<boolean> => {
    if (!dialogState.recipe) return false;
    
    try {
      await duplicateRecipeMutation.mutateAsync({
        id: dialogState.recipe.id,
        newName
      });
      return true;
    } catch (error) {
      return false;
    }
  }, [dialogState.recipe, duplicateRecipeMutation]);

  const handleRefresh = useCallback(() => {
    logger.component('Recipes', 'Refreshing all recipe data...');
    queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
  }, [queryClient]);

  const handleFormSuccess = useCallback((recipe: Recipe, isEdit: boolean) => {
    logger.success('Recipe form success:', { id: recipe.id, nama: recipe.namaResep, isEdit });
    setDialogState({ type: 'none' });
    
    if (!isEdit) {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
    }
  }, [queryClient]);

  const closeDialog = useCallback(() => {
    setDialogState({ type: 'none' });
  }, []);

  // ✅ RENDER: Loading state
  if (isLoading) {
    return <RecipeLoadingFallback />;
  }

  // ✅ RENDER: Error state
  if (error) {
    return <RecipeErrorFallback error={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="w-full p-4 sm:p-6 space-y-6">
        
        {/* ✅ Header - Matching Warehouse Design */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Manajemen Resep</h1>
                <p className="text-white opacity-90">
                  Kelola resep dan hitung HPP dengan mudah
                </p>
              </div>
            </div>

            <div className="hidden md:flex gap-3">
              <Button
                onClick={() => setDialogState({ type: 'category' })}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
              >
                <List className="h-4 w-4" />
                Kelola Kategori
              </Button>
              <Button
                onClick={handleAddRecipe}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-white text-orange-600 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Tambah Resep
              </Button>
            </div>
          </div>

          <div className="flex md:hidden flex-col gap-3 mt-6">
            <Button
              onClick={() => setDialogState({ type: 'category' })}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
            >
              <List className="h-4 w-4" />
              Kelola Kategori
            </Button>
            <Button
              onClick={handleAddRecipe}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-gray-100 font-medium px-4 py-3 rounded-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Tambah Resep
            </Button>
          </div>
        </div>

        {/* ✅ Statistics Cards */}
        <Suspense fallback={<div />}>
          <RecipeStats stats={stats} />
        </Suspense>

        {/* ✅ Main Content Card */}
        <Card className="border border-gray-200 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            
            {/* ✅ Filters */}
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

            {/* ✅ Bulk Actions */}
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

            {/* ✅ Content */}
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

        {/* ✅ Status Bar */}
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
        
        {/* ✅ Footer Stats */}
        {recipes.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            <p>
              Menampilkan {filtering.filteredAndSortedRecipes.length} dari {recipes.length} resep
              {availableCategories.length > 0 && ` • ${availableCategories.length} kategori`}
            </p>
          </div>
        )}
      </div>

      {/* ✅ Dialogs with improved Suspense and error handling */}
      <Suspense fallback={<div />}>
        {dialogState.type === 'form' && (
          <RecipeForm
            isOpen={true}
            onOpenChange={closeDialog}
            initialData={dialogState.recipe}
            onSuccess={handleFormSuccess}
          />
        )}

        {dialogState.type === 'delete' && (
          <DeleteRecipeDialog
            isOpen={true}
            onOpenChange={closeDialog}
            recipe={dialogState.recipe}
            onConfirm={handleConfirmDelete}
            isLoading={deleteRecipeMutation.isPending}
          />
        )}

        {dialogState.type === 'duplicate' && (
          <DuplicateRecipeDialog
            isOpen={true}
            onOpenChange={closeDialog}
            recipe={dialogState.recipe}
            onConfirm={handleConfirmDuplicate}
            isLoading={duplicateRecipeMutation.isPending}
          />
        )}

        {dialogState.type === 'category' && (
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

export default Recipes;