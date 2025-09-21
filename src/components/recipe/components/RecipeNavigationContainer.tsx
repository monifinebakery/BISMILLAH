// src/components/recipe/components/RecipeNavigationContainer.tsx
// Simplified container component that orchestrates smaller parts

import React from 'react';
import { RecipeErrorBoundary } from './shared/RecipeErrorBoundary';
import { LoadingStates } from '@/components/ui/loading-spinner';

// Hooks
import { useRecipeQueries } from '../hooks/useRecipeQueries';
import { useRecipeMutations } from '../hooks/useRecipeMutations';
import { useRecipeNavigation } from '../hooks/useRecipeNavigation';

// Components
import RecipeFormPage from './RecipeFormPage';
import RecipeHeader from './RecipeHeader';
import RecipeContent from './RecipeContent';
import RecipeDialogs from './RecipeDialogs';

// Query Keys - Keep for backward compatibility
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...RECIPE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...RECIPE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_QUERY_KEYS.details(), id] as const,
  categories: () => [...RECIPE_QUERY_KEYS.all, 'categories'] as const,
} as const;

const RecipeNavigationContainer: React.FC = () => {
  // Use extracted hooks
  const { recipes, categories, isLoading, error } = useRecipeQueries();
  const { deleteRecipeMutation, duplicateRecipeMutation, isProcessing } = useRecipeMutations();
  const { navigationState, handlers } = useRecipeNavigation();

  // Enhanced mutation handlers with proper async handling
  const enhancedHandlers = {
    ...handlers,
    handleConfirmDelete: async (): Promise<void> => {
      if (!navigationState.selectedRecipe) return;
      await deleteRecipeMutation.mutateAsync(navigationState.selectedRecipe.id);
    },
    handleConfirmDuplicate: async (newName: string): Promise<boolean> => {
      if (!navigationState.selectedRecipe) return false;
      const result = await duplicateRecipeMutation.mutateAsync({
        id: navigationState.selectedRecipe.id,
        newName
      });
      return !!result;
    },
  };

  // Loading state
  if (isLoading) {
    return <LoadingStates.Page />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Resep</h2>
          <p className="text-gray-600 mb-4">{error || 'Terjadi kesalahan yang tidak terduga'}</p>
          <div className="space-y-3">
            <button
              onClick={handlers.handleRefresh}
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
        </div>
      </div>
    );
  }

  // Render based on current view
  if (navigationState.currentView === 'add') {
    return (
      <RecipeFormPage
        mode="add"
        onNavigate={handlers.handleNavigate}
        onSuccess={handlers.handleFormSuccess}
        isLoading={isProcessing}
      />
    );
  }

  if (navigationState.currentView === 'edit' && navigationState.selectedRecipe) {
    return (
      <RecipeFormPage
        mode="edit"
        initialData={navigationState.selectedRecipe}
        onNavigate={handlers.handleNavigate}
        onSuccess={handlers.handleFormSuccess}
        isLoading={isProcessing}
      />
    );
  }

  // List view (default)
  return (
    <RecipeErrorBoundary>
      <RecipeHeader
        onAddRecipe={handlers.handleAddRecipe}
        isProcessing={isProcessing}
      />

      <RecipeContent
        recipes={recipes}
        availableCategories={categories}
        onEdit={handlers.handleEditRecipe}
        onDuplicate={handlers.handleDuplicateRecipe}
        onDelete={handlers.handleDeleteRecipe}
        isProcessing={isProcessing}
      />

      <RecipeDialogs
        navigationState={navigationState}
        handlers={enhancedHandlers}
        mutations={{
          deleteRecipeMutation,
          duplicateRecipeMutation,
        }}
        recipes={recipes}
        refreshRecipes={handlers.handleRefresh}
      />
    </RecipeErrorBoundary>
  );
};

export default RecipeNavigationContainer;
