// src/components/recipe/dialogs/CategoryManagerDialog.tsx
// Simplified version using extracted components and hooks

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Tag, 
  X, 
  RefreshCcw
} from 'lucide-react';

// Components
import { CategoryStatsCards, AddCategoryForm, CategoryTable } from '../components/category';
import { useCategoryManager } from '../hooks/useCategoryManager';

// Types
import type { Recipe } from '../types';

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<boolean>;
  refreshRecipes: () => Promise<void>;
}

const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  isOpen,
  onOpenChange,
  recipes,
  updateRecipe,
  refreshRecipes,
}) => {
  // Custom hook for category management
  const {
    // State
    isLoading,
    categoryToDelete,
    setCategoryToDelete,

    // Derived data
    categoryStats,
    recipeStats,

    // Handlers
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleRefresh,
    closeDeleteConfirmation
  } = useCategoryManager({ recipes, updateRecipe, refreshRecipes });

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      await handleDeleteCategory(categoryToDelete);
    } catch (error) {
      console.error('Delete confirmation failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Kelola Kategori Resep
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Buat dan atur kategori sesuai kebutuhan Anda
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                  title="Muat ulang data"
                >
                  <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              {/* Statistics */}
              <CategoryStatsCards
                totalRecipes={recipeStats.totalRecipes}
                categorizedRecipes={recipeStats.categorizedRecipes}
                totalCategories={categoryStats.length}
              />

              {/* Add New Category */}
              <AddCategoryForm
                isLoading={isLoading}
                onAddCategory={handleAddCategory}
              />

              {/* Categories Table */}
              <CategoryTable
                categories={categoryStats}
                isLoading={isLoading}
                onEditCategory={handleEditCategory}
                onDeleteCategory={setCategoryToDelete}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && closeDeleteConfirmation()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori "{categoryToDelete}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteConfirmation}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoryManagerDialog;