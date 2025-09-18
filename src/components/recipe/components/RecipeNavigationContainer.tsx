// src/components/recipe/components/RecipeNavigationContainer.tsx
// Container component that manages navigation states for recipe management

import React, { useState, Suspense, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';

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
import { LoadingSkeleton, Skeleton } from '@/components/ui/skeleton';


// Breadcrumb and view mode types
import type { RecipeViewMode } from './RecipeBreadcrumb';

// Query Keys - Menggunakan struktur yang sama dengan RecipeFormPage
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...RECIPE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...RECIPE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_QUERY_KEYS.details(), id] as const,
  categories: () => [...RECIPE_QUERY_KEYS.all, 'categories'] as const,
} as const;

// Safe lazy component wrapper using skeleton
const LazyComponentWrapper: React.FC<{ children: React.ReactNode; loadingMessage?: string }> = ({ children, loadingMessage }) => {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-6 w-32" />
      </div>
    }>
      {children}
    </Suspense>
  );
};

// Lazy loaded components with better error handling and consistent fallbacks
const DeleteRecipeDialog = React.lazy(() => 
  import('../dialogs/DeleteRecipeDialog')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load DeleteRecipeDialog:', error);
      return { default: () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-red-600">Error loading dialog</p>
          </div>
        </div>
      )};
    })
);

const DuplicateRecipeDialog = React.lazy(() => 
  import('../dialogs/DuplicateRecipeDialog')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load DuplicateRecipeDialog:', error);
      return { default: () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-red-600">Error loading dialog</p>
          </div>
        </div>
      )};
    })
);

const CategoryManagerDialog = React.lazy(() =>
  import('../dialogs/CategoryManagerDialog')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load CategoryManagerDialog:', error);
      return { default: () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-red-600">Error loading dialog</p>
          </div>
        </div>
      )};
    })
);

const RecipeTable = React.lazy(() =>
  import('./RecipeList/RecipeTable')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load RecipeTable:', error);
      return { default: () => (
        <div className="p-6 text-center">
          <p className="text-red-600">Error loading table</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Reload Page
          </button>
        </div>
      )};
    })
);

const RecipeFilters = React.lazy(() =>
  import('./RecipeList/RecipeFilters')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load RecipeFilters:', error);
      return { default: () => (
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-red-600">Error loading filters</p>
        </div>
      )};
    })
);

const RecipeStats = React.lazy(() =>
  import('./RecipeList/RecipeStats')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load RecipeStats:', error);
      return { default: () => (
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-red-600">Error loading stats</p>
        </div>
      )};
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
      // Update query data optimistically
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.lists(),
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(recipe => recipe.id !== id);
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
      
      const deletedRecipe = recipesQuery.data?.find(recipe => recipe.id === id) as any;
      const nama = deletedRecipe ? (deletedRecipe.nama_resep ?? deletedRecipe.namaResep ?? 'Unknown') : 'Unknown';
      toast.success(`Resep "${nama}" berhasil dihapus`);
      
      // Reset dialog state
      setNavigationState(prev => ({ ...prev, dialogType: 'none', selectedRecipe: null }));
    },
    onError: (error: Error) => {
      logger.error('Error deleting recipe:', error);
      toast.error(error.message || 'Gagal menghapus resep');
      // Reset dialog state on error too
      setNavigationState(prev => ({ ...prev, dialogType: 'none', selectedRecipe: null }));
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
      // Update query data optimistically
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.lists(),
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return [newRecipe];
          return [newRecipe, ...oldData];
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
      
      const anyRec: any = newRecipe as any;
      const namaBaru = anyRec.nama_resep ?? anyRec.namaResep ?? 'Berhasil';
      toast.success(`Resep "${namaBaru}" berhasil diduplikasi`);
      
      // Reset dialog state
      setNavigationState(prev => ({ ...prev, dialogType: 'none', selectedRecipe: null }));
    },
    onError: (error: Error) => {
      logger.error('Error duplicating recipe:', error);
      toast.error(error.message || 'Gagal menduplikasi resep');
      // Reset dialog state on error too
      setNavigationState(prev => ({ ...prev, dialogType: 'none', selectedRecipe: null }));
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
  // Align container and background with RecipeFormPage/RecipeList for consistent margins
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">

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
          <div className="flex gap-3 flex-wrap">
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
        <LazyComponentWrapper>
          <RecipeStats stats={stats} />
        </LazyComponentWrapper>


        {/* Main Content Card */}
        <Card className="border border-gray-200 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">

            {/* Filters */}
            <div className="p-6 pb-0">
              <LazyComponentWrapper>
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
              </LazyComponentWrapper>
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
              <LazyComponentWrapper>
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
              </LazyComponentWrapper>
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

      {/* Dialogs with safe error handling */}
      {navigationState.dialogType === 'delete' && (
        <LazyComponentWrapper>
          <DeleteRecipeDialog
            isOpen={true}
            onOpenChange={closeDialog}
            recipe={navigationState.selectedRecipe}
            onConfirm={handleConfirmDelete}
            isLoading={deleteRecipeMutation.isPending}
          />
        </LazyComponentWrapper>
      )}

      {navigationState.dialogType === 'duplicate' && (
        <LazyComponentWrapper>
          <DuplicateRecipeDialog
            isOpen={true}
            onOpenChange={closeDialog}
            recipe={navigationState.selectedRecipe}
            onConfirm={handleConfirmDuplicate}
            isLoading={duplicateRecipeMutation.isPending}
          />
        </LazyComponentWrapper>
      )}

      {navigationState.dialogType === 'category' && (
        <LazyComponentWrapper>
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
        </LazyComponentWrapper>
      )}
    </div>
  );
};

export default RecipeNavigationContainer;
