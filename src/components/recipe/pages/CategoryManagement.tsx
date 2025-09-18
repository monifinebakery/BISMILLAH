// src/components/recipe/pages/CategoryManagement.tsx
// Full page component for category management

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-orange-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Kelola Kategori Resep
                </h1>
              </div>
              <p className="text-gray-600 mt-1 ml-11">
                Buat dan atur kategori sesuai kebutuhan Anda
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Muat Ulang</span>
          </Button>
        </div>

        {/* Statistics */}
        <CategoryStatsCards
          totalRecipes={recipeStats.totalRecipes}
          categorizedRecipes={recipeStats.categorizedRecipes}
          totalCategories={categoryStats.length}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Add New Category */}
          <Card className="border bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tambah Kategori Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <AddCategoryForm
                isLoading={isLoading}
                onAddCategory={handleAddCategory}
              />
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card className="border bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Kategori</CardTitle>
            </CardHeader>
            <CardContent>
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

      {/* Delete Confirmation Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Konfirmasi Hapus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Apakah Anda yakin ingin menghapus kategori "{categoryToDelete}"? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-end">
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
                  className="bg-red-600 hover:bg-red-700"
                >
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;