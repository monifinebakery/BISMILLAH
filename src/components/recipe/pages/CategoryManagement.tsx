// src/components/recipe/pages/CategoryManagement.tsx
// Full page component for category management

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Tag, RefreshCcw } from 'lucide-react';

// Components
import { CategoryStatsCards, AddCategoryForm, CategoryTable } from '../components/category';
import { useCategoryManager } from '../hooks/useCategoryManager';

// Context
import { useRecipe } from '@/contexts/RecipeContext';

const CategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const { recipes, updateRecipe, refreshRecipes } = useRecipe();

  // Custom hook for category management
  const {
    // State
    isLoading,
    categoryToDelete,

    // Derived data
    categoryStats,
    recipeStats,

    // Handlers
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleRefresh,
    openDeleteConfirmation,
    closeDeleteConfirmation
  } = useCategoryManager({ recipes, updateRecipe, refreshRecipes });

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) {
      console.log('⚠️ No category to delete');
      return;
    }
    
    console.log('✅ Confirming delete for category:', categoryToDelete);
    try {
      await handleDeleteCategory(categoryToDelete);
      console.log('✅ Category deleted successfully:', categoryToDelete);
    } catch (error) {
      console.error('Delete confirmation failed:', error);
    }
  };

  const handleBack = () => {
    navigate('/resep');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-2"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600" />
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Kelola Kategori Resep
            </h1>
          </div>
        </div>

        {/* Statistics - responsive, simple */}
        <CategoryStatsCards
          totalRecipes={recipeStats.totalRecipes}
          categorizedRecipes={recipeStats.categorizedRecipes}
          totalCategories={categoryStats.length}
        />

        {/* Content */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Add New Category */}
          <Card className="border bg-white">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Tambah Kategori</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <AddCategoryForm
                isLoading={isLoading}
                onAddCategory={handleAddCategory}
              />
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card className="border bg-white">
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Daftar Kategori</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              <CategoryTable
                categories={categoryStats}
                isLoading={isLoading}
                onEditCategory={handleEditCategory}
                onDeleteCategory={openDeleteConfirmation}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog - responsive */}
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && closeDeleteConfirmation()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Apakah Anda yakin ingin menghapus kategori "{categoryToDelete}"? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeDeleteConfirmation}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;