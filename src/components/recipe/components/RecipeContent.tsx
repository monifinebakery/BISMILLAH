import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRecipeFiltering } from '../hooks/useRecipeFiltering';
import { useRecipeStats } from '../hooks/useRecipeStats';
import { useRecipeTable } from '../hooks/useRecipeTable';
import { EmptyState } from './shared/EmptyState';
import { LoadingStates } from '@/components/ui/loading-spinner';
import BulkActions from './BulkActions';
import {
  RecipeStats as RecipeStatsComponent,
  RecipeFilters as RecipeFiltersComponent,
  RecipeTable as RecipeTableComponent,
  LazyComponentWrapper
} from './RecipeLazyComponents';
import type { Recipe } from '../types';

interface RecipeContentProps {
  recipes: Recipe[];
  availableCategories: string[];
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  isProcessing: boolean;
}

const RecipeContent: React.FC<RecipeContentProps> = ({
  recipes,
  availableCategories,
  onEdit,
  onDuplicate,
  onDelete,
  isProcessing,
}) => {
  // Filtering and stats logic
  const filtering = useRecipeFiltering({ recipes });
  const stats = useRecipeStats({ recipes: filtering.filteredAndSortedRecipes });
  const recipeTable = useRecipeTable();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">

        {/* Statistics Cards */}
        <LazyComponentWrapper>
          <RecipeStatsComponent stats={stats} />
        </LazyComponentWrapper>

        {/* Main Content Card */}
        <Card className="border border-gray-200 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">

            {/* Filters */}
            <div className="p-6 pb-0">
              <LazyComponentWrapper>
                <RecipeFiltersComponent
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
                  onAction={recipes.length === 0 ? () => {} : filtering.clearFilters}
                  type={recipes.length === 0 ? "no-data" : "no-results"}
                />
              </div>
            ) : (
              <LazyComponentWrapper>
                <RecipeTableComponent
                  recipes={filtering.filteredAndSortedRecipes}
                  onSort={filtering.handleSort}
                  sortBy={filtering.sortBy}
                  sortOrder={filtering.sortOrder}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
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
    </div>
  );
};

export default RecipeContent;
