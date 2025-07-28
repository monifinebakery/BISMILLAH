// src/components/recipe/RecipesPage/index.tsx

import React, { useState, useMemo, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRecipe } from '@/contexts/RecipeContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Recipe, NewRecipe } from '@/types/recipe';

// Hooks
import { useRecipeFiltering } from './hooks/useRecipeFiltering';
import { useRecipePagination } from './hooks/useRecipePagination';
import { useRecipeStats } from './hooks/useRecipeStats';

// Components
import { RecipeHeader } from './components/RecipeHeader';
import { RecipeStatsCards } from './components/RecipeStatsCards';
import { RecipeControls } from './components/RecipeControls';
import { RecipeTable } from './components/RecipeTable';
import { RecipePagination } from './components/RecipePagination';

// Shared components
import { RecipePageLoadingState } from '../shared/components/LoadingStates';
import { useRecipeCategories } from '../shared/hooks/useRecipeCategories';

// Lazy loaded components
const RecipeForm = React.lazy(() => import('../RecipeForm'));
const DuplicateRecipeDialog = React.lazy(() => 
  import('../dialogs/DuplicateRecipeDialog').then(m => ({ default: m.DuplicateRecipeDialog }))
);
const CategoryManagerDialog = React.lazy(() => 
  import('../dialogs/CategoryManagerDialog').then(m => ({ default: m.CategoryManagerDialog }))
);

const RecipesPage: React.FC = () => {
  // Context hooks
  const { 
    recipes, 
    isLoading: recipesLoading, 
    addRecipe, 
    updateRecipe, 
    deleteRecipe,
    duplicateRecipe
  } = useRecipe();
  
  const { settings } = useUserSettings();
  const { categories, addCategory, deleteCategory } = useRecipeCategories();

  // Filtering and sorting
  const {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    sortOrder,
    filteredAndSortedRecipes,
    handleSort,
    clearFilters,
    hasActiveFilters
  } = useRecipeFiltering({ recipes });

  // Pagination
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    canGoNext,
    canGoPrevious,
    goToPage,
    changeItemsPerPage,
    resetPagination,
    paginationOptions,
    paginationInfo
  } = useRecipePagination({ 
    totalItems: filteredAndSortedRecipes.length 
  });

  // Stats
  const stats = useRecipeStats({ recipes: filteredAndSortedRecipes });

  // Current page recipes
  const currentRecipes = useMemo(() => {
    return filteredAndSortedRecipes.slice(startIndex, endIndex);
  }, [filteredAndSortedRecipes, startIndex, endIndex]);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [duplicatingRecipe, setDuplicatingRecipe] = useState<Recipe | null>(null);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Reset pagination when filters change
  React.useEffect(() => {
    resetPagination();
  }, [searchTerm, categoryFilter, resetPagination]);

  // Handlers
  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setIsFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsFormOpen(true);
  };

  const handleSaveRecipe = async (recipeData: NewRecipe) => {
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      const success = await deleteRecipe(recipe.id);
      if (success) {
        toast.success(`Resep "${recipe.namaResep}" berhasil dihapus`);
      }
    } catch (error) {
      toast.error('Gagal menghapus resep');
    }
  };

  const handleOpenDuplicateDialog = (recipe: Recipe) => {
    setDuplicatingRecipe(recipe);
    setIsDuplicateDialogOpen(true);
  };

  const handleDuplicateRecipe = async (newName: string): Promise<boolean> => {
    if (!duplicatingRecipe) return false;

    setIsDuplicating(true);
    try {
      const success = await duplicateRecipe(duplicatingRecipe.id, newName);
      if (success) {
        setIsDuplicateDialogOpen(false);
        setDuplicatingRecipe(null);
        toast.success(`Resep "${newName}" berhasil diduplikasi`);
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Gagal menduplikasi resep');
      return false;
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleClearSearch = () => {
    clearFilters();
  };

  // Loading state
  if (recipesLoading || !settings) {
    return <RecipePageLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <RecipeHeader
          onAddRecipe={handleAddRecipe}
          onManageCategories={() => setIsCategoryDialogOpen(true)}
        />

        {/* Statistics Cards */}
        <RecipeStatsCards stats={stats} />

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Controls */}
            <div className="p-6 pb-0">
              <RecipeControls
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                categories={categories}
                sortBy={sortBy}
                onSortByChange={(value) => handleSort(value)}
                sortOrder={sortOrder}
                onSortOrderToggle={() => handleSort(sortBy)}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearSearch}
                totalResults={filteredAndSortedRecipes.length}
              />
            </div>

            {/* Table */}
            <RecipeTable
              recipes={currentRecipes}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onEdit={handleEditRecipe}
              onDuplicate={handleOpenDuplicateDialog}
              onDelete={handleDeleteRecipe}
              searchTerm={searchTerm}
              onClearSearch={handleClearSearch}
              onCreateFirst={handleAddRecipe}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <RecipePagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={goToPage}
                onItemsPerPageChange={changeItemsPerPage}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                paginationInfo={paginationInfo}
                paginationOptions={paginationOptions}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialogs with Suspense */}
        <Suspense fallback={<div>Loading...</div>}>
          {/* Recipe Form Dialog */}
          {isFormOpen && (
            <RecipeForm
              isOpen={isFormOpen}
              onOpenChange={setIsFormOpen}
              initialData={editingRecipe}
              onSave={handleSaveRecipe}
              isLoading={isSaving}
            />
          )}

          {/* Duplicate Recipe Dialog */}
          {isDuplicateDialogOpen && (
            <DuplicateRecipeDialog
              isOpen={isDuplicateDialogOpen}
              onOpenChange={(open) => {
                setIsDuplicateDialogOpen(open);
                if (!open) {
                  setDuplicatingRecipe(null);
                }
              }}
              recipe={duplicatingRecipe}
              onConfirm={handleDuplicateRecipe}
              isLoading={isDuplicating}
            />
          )}

          {/* Category Manager Dialog */}
          {isCategoryDialogOpen && (
            <CategoryManagerDialog
              isOpen={isCategoryDialogOpen}
              onOpenChange={setIsCategoryDialogOpen}
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default RecipesPage;