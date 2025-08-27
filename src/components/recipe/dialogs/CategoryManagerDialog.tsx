// src/components/recipe/dialogs/CategoryManagerDialog.tsx
// Simplified version using extracted components and hooks

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent centerMode="overlay" size="lg">
          <div className="dialog-panel dialog-panel-lg dialog-no-overflow">
            <DialogHeader className="dialog-header">
              <div className="flex items-center gap-3 pr-12"> {/* Add right padding to avoid close button */}
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-xl text-gray-900 text-overflow-safe">
                    Kelola Kategori Resep
                  </DialogTitle>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 text-overflow-safe">
                    Buat dan atur kategori sesuai kebutuhan Anda
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 input-mobile-safe flex-shrink-0"
                  title="Muat ulang data"
                >
                  <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="dialog-body">
              <div className="space-y-4 sm:space-y-6 dialog-no-overflow">
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
                  onDeleteCategory={openDeleteConfirmation}
                />
              </div>
            </div>

            <DialogFooter className="dialog-footer">
              <div className="dialog-responsive-buttons">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="input-mobile-safe">
                  <span className="text-overflow-safe">Tutup</span>
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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