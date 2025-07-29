// src/components/recipe/components/RecipeList/index.tsx

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

// Recipe hooks and services
import { useRecipeOperations } from '../../hooks/useRecipeOperations';
import { useRecipeFiltering } from '../../hooks/useRecipeFiltering';
import { useRecipeStats } from '../../hooks/useRecipeStats';
import { recipeApi } from '../../services/recipeApi';
import type { Recipe, NewRecipe } from '../../types';

// Components
import RecipeTable from './RecipeTable';
import RecipeFilters from './RecipeFilters';
import RecipeStats from './RecipeStats';
import { LoadingState } from '../shared/LoadingState';
import { EmptyState } from '../shared/EmptyState';

// Lazy loaded dialogs
const RecipeForm = React.lazy(() => import('../RecipeForm'));
const DeleteRecipeDialog = React.lazy(() => import('../../dialogs/DeleteRecipeDialog'));
const DuplicateRecipeDialog = React.lazy(() => import('../../dialogs/DuplicateRecipeDialog'));
const CategoryManagerDialog = React.lazy(() => import('../../dialogs/CategoryManagerDialog'));

const RecipeList: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Recipe operations
  const recipeOperations = useRecipeOperations({
    userId: user?.id || '',
    onRecipeAdded: (recipe) => {
      setRecipes(prev => [recipe, ...prev].sort((a, b) => a.namaResep.localeCompare(b.namaResep)));
    },
    onRecipeUpdated: (recipe) => {
      setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
    },
    onRecipeDeleted: (id) => {
      setRecipes(prev => prev.filter(r => r.id !== id));
    },
  });

  // Filtering and sorting
  const filtering = useRecipeFiltering({ recipes });
  
  // Statistics
  const stats = useRecipeStats({ recipes: filtering.filteredAndSortedRecipes });

  // Load recipes on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadRecipes = async () => {
      setIsLoading(true);
      try {
        logger.debug('RecipeList: Loading recipes for user:', user.id);
        const result = await recipeApi.fetchRecipes(user.id);
        
        if (result.error) {
          toast.error(`Gagal memuat resep: ${result.error}`);
        } else {
          setRecipes(result.data);
          logger.debug(`RecipeList: Loaded ${result.data.length} recipes`);
        }
      } catch (error) {
        logger.error('RecipeList: Error loading recipes:', error);
        toast.error('Terjadi kesalahan saat memuat resep');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipes();

    // Setup real-time subscription
    const unsubscribe = recipeApi.setupRealtimeSubscription(
      user.id,
      (newRecipe) => {
        setRecipes(prev => {
          const exists = prev.find(r => r.id === newRecipe.id);
          if (exists) return prev;
          return [newRecipe, ...prev].sort((a, b) => a.namaResep.localeCompare(b.namaResep));
        });
      },
      (updatedRecipe) => {
        setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
      },
      (deletedId) => {
        setRecipes(prev => prev.filter(r => r.id !== deletedId));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

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
    const success = editingRecipe
      ? await recipeOperations.updateRecipe(editingRecipe.id, recipeData)
      : await recipeOperations.addRecipe(recipeData);

    if (success) {
      setIsFormOpen(false);
      setEditingRecipe(null);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedRecipe) return;
    
    const success = await recipeOperations.deleteRecipe(selectedRecipe.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedRecipe(null);
    }
  };

  const handleConfirmDuplicate = async (newName: string): Promise<boolean> => {
    if (!selectedRecipe) return false;
    
    const success = await recipeOperations.duplicateRecipe(selectedRecipe, newName);
    if (success) {
      setIsDuplicateDialogOpen(false);
      setSelectedRecipe(null);
    }
    return success;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Akses Terbatas</h2>
          <p className="text-gray-600">Silakan login untuk mengelola resep Anda.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
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
            >
              Kelola Kategori
            </Button>
            <Button
              onClick={handleAddRecipe}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Tambah Resep
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <RecipeStats stats={stats} />

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            
            {/* Filters */}
            <div className="p-6 pb-0">
              <RecipeFilters
                searchTerm={filtering.searchTerm}
                onSearchChange={filtering.setSearchTerm}
                categoryFilter={filtering.categoryFilter}
                onCategoryFilterChange={filtering.setCategoryFilter}
                categories={filtering.availableCategories}
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

            {/* Results */}
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
                isLoading={recipeOperations.isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialogs with Suspense for lazy loading */}
        <Suspense fallback={<div>Loading...</div>}>
          {/* Recipe Form Dialog */}
          {isFormOpen && (
            <RecipeForm
              isOpen={isFormOpen}
              onOpenChange={setIsFormOpen}
              initialData={editingRecipe}
              onSave={handleSaveRecipe}
              isLoading={recipeOperations.isLoading}
            />
          )}

          {/* Delete Recipe Dialog */}
          {isDeleteDialogOpen && (
            <DeleteRecipeDialog
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              recipe={selectedRecipe}
              onConfirm={handleConfirmDelete}
              isLoading={recipeOperations.isLoading}
            />
          )}

          {/* Duplicate Recipe Dialog */}
          {isDuplicateDialogOpen && (
            <DuplicateRecipeDialog
              isOpen={isDuplicateDialogOpen}
              onOpenChange={setIsDuplicateDialogOpen}
              recipe={selectedRecipe}
              onConfirm={handleConfirmDuplicate}
              isLoading={recipeOperations.isLoading}
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
      </div>
    </div>
  );
};

export default RecipeList;