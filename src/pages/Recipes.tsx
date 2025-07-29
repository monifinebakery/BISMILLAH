// src/pages/RecipePage.tsx

import React, { useState, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Context and hooks
import { useRecipe } from '@/contexts/RecipeContext';
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
    
    // You can integrate with error monitoring services here
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
    <Card className="max-w-md w-full shadow-xl">
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

// Main RecipePage component
const RecipePage: React.FC = () => {
  // Context
  const {
    recipes,
    isLoading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    getUniqueCategories,
    clearError,
  } = useRecipe();

  // Local state for dialogs
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hooks for filtering and stats
  const filtering = useRecipeFiltering({ recipes });
  const stats = useRecipeStats({ recipes: filtering.filteredAndSortedRecipes });

  // Get available categories
  const availableCategories = getUniqueCategories();

  // Error handling
  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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

  const handleSaveRecipe = async (recipeData: NewRecipe): Promise<void> => {
    setIsProcessing(true);
    try {
      const success = editingRecipe
        ? await updateRecipe(editingRecipe.id, recipeData)
        : await addRecipe(recipeData);

      if (success) {
        setIsFormOpen(false);
        setEditingRecipe(null);
        toast.success(
          editingRecipe 
            ? 'Resep berhasil diperbarui!' 
            : 'Resep baru berhasil ditambahkan!'
        );
      }
    } catch (error) {
      toast.error('Gagal menyimpan resep');
      console.error('Error saving recipe:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedRecipe) return;
    
    setIsProcessing(true);
    try {
      const success = await deleteRecipe(selectedRecipe.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedRecipe(null);
        toast.success(`Resep "${selectedRecipe.namaResep}" berhasil dihapus`);
      }
    } catch (error) {
      toast.error('Gagal menghapus resep');
      console.error('Error deleting recipe:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDuplicate = async (newName: string): Promise<boolean> => {
    if (!selectedRecipe) return false;
    
    setIsProcessing(true);
    try {
      const success = await duplicateRecipe(selectedRecipe.id, newName);
      if (success) {
        setIsDuplicateDialogOpen(false);
        setSelectedRecipe(null);
        toast.success(`Resep "${newName}" berhasil diduplikasi`);
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Gagal menduplikasi resep');
      console.error('Error duplicating recipe:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    clearError();
    window.location.reload();
  };

  // Show loading state while initial data is being fetched
  if (isLoading) {
    return <RecipeLoadingFallback />;
  }

  // Show error state if there's a context-level error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
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
                onClick={clearError}
                variant="outline"
                className="w-full"
              >
                Dismiss Error
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to monitoring service in production
        console.error('Recipe page error:', error, errorInfo);
        
        // You can integrate with error monitoring services here
        // e.g., Sentry, LogRocket, etc.
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error);
        }
      }}
      onReset={() => {
        // Clear any error state and refetch data
        clearError();
        setSelectedRecipe(null);
        setEditingRecipe(null);
        setIsFormOpen(false);
        setIsDeleteDialogOpen(false);
        setIsDuplicateDialogOpen(false);
        setIsCategoryDialogOpen(false);
      }}
    >
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
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
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
                onSave={handleSaveRecipe}
                isLoading={isProcessing}
              />
            )}

            {/* Delete Recipe Dialog */}
            {isDeleteDialogOpen && (
              <DeleteRecipeDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                recipe={selectedRecipe}
                onConfirm={handleConfirmDelete}
                isLoading={isProcessing}
              />
            )}

            {/* Duplicate Recipe Dialog */}
            {isDuplicateDialogOpen && (
              <DuplicateRecipeDialog
                isOpen={isDuplicateDialogOpen}
                onOpenChange={setIsDuplicateDialogOpen}
                recipe={selectedRecipe}
                onConfirm={handleConfirmDuplicate}
                isLoading={isProcessing}
              />
            )}

            {/* Category Manager Dialog */}
            {isCategoryDialogOpen && (
              <CategoryManagerDialog
                isOpen={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
                recipes={recipes}
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
    </ErrorBoundary>
  );
};

export default RecipePage;