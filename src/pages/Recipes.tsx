// src/pages/Recipes.tsx - Fixed API Response Format

import React, { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// API and services
import { recipeApi } from '@/components/recipe/services/recipeApi';

// Hooks
import { useRecipeFiltering } from '@/components/recipe/hooks/useRecipeFiltering';
import { useRecipeStats } from '@/components/recipe/hooks/useRecipeStats';

// Components
import RecipeTable from '@/components/recipe/components/RecipeList/RecipeTable';
import RecipeFilters from '@/components/recipe/components/RecipeList/RecipeFilters';
import RecipeStats from '@/components/recipe/components/RecipeList/RecipeStats';
import { EmptyState } from '@/components/recipe/components/shared/EmptyState';
import { LoadingState } from '@/components/recipe/components/shared/LoadingState';

// Types
import type { Recipe, NewRecipe } from '@/components/recipe/types';

// ✅ Simplified Query Keys
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  categories: () => [...RECIPE_QUERY_KEYS.all, 'categories'] as const,
} as const;

// Lazy loaded dialogs and forms
const RecipeForm = React.lazy(() => import('@/components/recipe/components/RecipeForm'));
const DeleteRecipeDialog = React.lazy(() => import('@/components/recipe/dialogs/DeleteRecipeDialog'));
const DuplicateRecipeDialog = React.lazy(() => import('@/components/recipe/dialogs/DuplicateRecipeDialog'));
const CategoryManagerDialog = React.lazy(() => import('@/components/recipe/dialogs/CategoryManagerDialog'));

// Custom Error Boundary component
class RecipeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetError: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Recipe page error:', error, errorInfo);
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default Error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
    <Card className="max-w-md w-full border-1 border-gray-200">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Oops! Terjadi Kesalahan
        </h2>
        
        <p className="text-gray-600 mb-4">
          {error.message || 'Terjadi kesalahan yang tidak terduga'}
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={resetError}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            Coba Lagi
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Refresh Halaman
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Debug Info (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  </div>
);

// Loading fallback
const RecipeLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
    <div className="container mx-auto p-4 sm:p-6">
      <LoadingState />
    </div>
  </div>
);

// Main Recipes component
const Recipes: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Local state for dialogs
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // ✅ FIXED: useQuery for Recipes - Direct API response
  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const recipes = await recipeApi.getRecipes(); // ✅ Direct return
      return recipes || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ FIXED: useQuery for Categories - Direct API response
  const categoriesQuery = useQuery({
    queryKey: ['recipes', 'categories'],
    queryFn: async () => {
      const categories = await recipeApi.getUniqueCategories(); // ✅ Direct return
      return categories || [];
    },
    enabled: recipesQuery.isSuccess, // Only run after recipes are loaded
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // ✅ FIXED: useMutation for Delete Recipe - Direct API call
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Deleting recipe:', id);
      await recipeApi.deleteRecipe(id); // ✅ Direct call, throws on error
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache optimistically
      queryClient.setQueryData(
        ['recipes'],
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(recipe => recipe.id !== deletedId);
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['recipes', 'categories'] });
      
      const deletedRecipe = recipesQuery.data?.find(recipe => recipe.id === deletedId);
      if (deletedRecipe) {
        toast.success(`Resep "${deletedRecipe.namaResep}" berhasil dihapus`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus resep');
      console.error('Error deleting recipe:', error);
    },
  });

  // ✅ FIXED: useMutation for Duplicate Recipe - Direct API call
  const duplicateRecipeMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      console.log('📋 Duplicating recipe:', id, 'with name:', newName);
      const newRecipe = await recipeApi.duplicateRecipe(id, newName); // ✅ Direct return
      return newRecipe;
    },
    onSuccess: (newRecipe) => {
      // Add to cache optimistically
      queryClient.setQueryData(
        ['recipes'],
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return [newRecipe];
          return [newRecipe, ...oldData];
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['recipes', 'categories'] });
      
      toast.success(`Resep "${newRecipe.namaResep}" berhasil diduplikasi`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menduplikasi resep');
      console.error('Error duplicating recipe:', error);
    },
  });

  // ✅ FIXED: useMutation for Bulk Update Recipes - Direct API calls
  const bulkUpdateRecipesMutation = useMutation({
    mutationFn: async (updates: { id: string; data: Partial<NewRecipe> }[]) => {
      console.log('📦 Bulk updating recipes:', updates.length);
      const updatedRecipes = await Promise.all(
        updates.map(({ id, data }) => recipeApi.updateRecipe(id, data)) // ✅ Direct calls
      );
      return updatedRecipes;
    },
    onSuccess: (updatedRecipes) => {
      // Update cache optimistically
      queryClient.setQueryData(
        ['recipes'],
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return updatedRecipes;
          
          const updatedMap = new Map(updatedRecipes.map(recipe => [recipe.id, recipe]));
          return oldData.map(recipe => updatedMap.get(recipe.id) || recipe);
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['recipes', 'categories'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate kategori resep');
      console.error('Error bulk updating recipes:', error);
    },
  });

  // Get data from queries
  const recipes = recipesQuery.data || [];
  const availableCategories = categoriesQuery.data || [];
  const isLoading = recipesQuery.isLoading;
  const error = recipesQuery.error?.message || categoriesQuery.error?.message;

  // Hooks for filtering and stats
  const filtering = useRecipeFiltering({ recipes });
  const stats = useRecipeStats({ recipes: filtering.filteredAndSortedRecipes });

  // Check if any mutation is loading
  const isProcessing = deleteRecipeMutation.isPending || 
                      duplicateRecipeMutation.isPending || 
                      bulkUpdateRecipesMutation.isPending;

  // ✅ Debug logging
  console.log('📊 Recipes Query State:', {
    data: recipes?.length || 0,
    isLoading,
    error,
    categories: availableCategories?.length || 0
  });

  // Handlers
  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setIsFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsFormOpen(true);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDeleteDialogOpen(true);
  };

  const handleDuplicateRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDuplicateDialogOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedRecipe) return;
    
    try {
      await deleteRecipeMutation.mutateAsync(selectedRecipe.id);
      setIsDeleteDialogOpen(false);
      setSelectedRecipe(null);
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleConfirmDuplicate = async (newName: string): Promise<boolean> => {
    if (!selectedRecipe) return false;
    
    try {
      await duplicateRecipeMutation.mutateAsync({
        id: selectedRecipe.id,
        newName
      });
      setIsDuplicateDialogOpen(false);
      setSelectedRecipe(null);
      return true;
    } catch (error) {
      // Error handling is done in mutation callbacks
      return false;
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing all recipe data...');
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  const handleFormSuccess = (recipe: Recipe, isEdit: boolean) => {
    // Form handles its own cache updates, we just need to close dialogs
    setIsFormOpen(false);
    setEditingRecipe(null);
    
    // Optionally refresh categories if new recipe added
    if (!isEdit) {
      queryClient.invalidateQueries({ queryKey: ['recipes', 'categories'] });
    }
  };

  // Show loading state while initial data is being fetched
  if (isLoading) {
    return <RecipeLoadingFallback />;
  }

  // Show error state if there's a query-level error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-1 border-gray-200">
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
              {error}
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Coba Lagi
              </Button>
              
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
  }

  return (
    <RecipeErrorBoundary fallback={DefaultErrorFallback}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
          
          {/* Header */}
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
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(true)}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                disabled={isProcessing}
              >
                Kelola Kategori
              </Button>
              <Button
                onClick={handleAddRecipe}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isProcessing}
              >
                + Tambah Resep
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <RecipeStats stats={stats} />

          {/* Main Content Card */}
          <Card className="border-1 border-gray-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-0">
              
              {/* Filters */}
              <div className="p-6 pb-0">
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
              </div>

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
                />
              )}
            </CardContent>
          </Card>

          {/* Dialogs with Suspense */}
          <Suspense fallback={<div className="opacity-0">Loading dialog...</div>}>
            {/* Recipe Form Dialog */}
            {isFormOpen && (
              <RecipeForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                initialData={editingRecipe}
                onSuccess={handleFormSuccess}
              />
            )}

            {/* Delete Recipe Dialog */}
            {isDeleteDialogOpen && (
              <DeleteRecipeDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                recipe={selectedRecipe}
                onConfirm={handleConfirmDelete}
                isLoading={deleteRecipeMutation.isPending}
              />
            )}

            {/* Duplicate Recipe Dialog */}
            {isDuplicateDialogOpen && (
              <DuplicateRecipeDialog
                isOpen={isDuplicateDialogOpen}
                onOpenChange={setIsDuplicateDialogOpen}
                recipe={selectedRecipe}
                onConfirm={handleConfirmDuplicate}
                isLoading={duplicateRecipeMutation.isPending}
              />
            )}

            {/* Category Manager Dialog */}
            {isCategoryDialogOpen && (
              <CategoryManagerDialog
                isOpen={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
                recipes={recipes}
                updateRecipe={async (id: string, data: Partial<NewRecipe>) => {
                  await bulkUpdateRecipesMutation.mutateAsync([{ id, data }]);
                  return true;
                }}
                refreshRecipes={handleRefresh}
              />
            )}
          </Suspense>

          {/* Status Bar - Shows current operation status */}
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
          
          {/* Quick Stats Footer */}
          {recipes.length > 0 && (
            <div className="text-center text-sm text-gray-500">
              <p>
                Menampilkan {filtering.filteredAndSortedRecipes.length} dari {recipes.length} resep
                {availableCategories.length > 0 && ` • ${availableCategories.length} kategori`}
              </p>
            </div>
          )}
        </div>
      </div>
    </RecipeErrorBoundary>
  );
};

export default Recipes;