// src/components/recipe/components/BulkActions.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  X,
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  ChefHat
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Recipe } from '../types';

export interface BulkActionsProps {
  isVisible: boolean;
  selectedCount: number;
  totalFilteredCount: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onBulkDelete: (recipes: Recipe[]) => void;
  onBulkEdit: (recipes: Recipe[]) => void;
  recipes: Recipe[];
}

const BulkActions: React.FC<BulkActionsProps> = ({
  isVisible,
  selectedCount,
  totalFilteredCount,
  onCancel,
  onSelectAll,
  onBulkDelete,
  onBulkEdit,
  recipes
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const isMobile = useIsMobile();

  if (!isVisible) return null;

  const isAllSelected = selectedCount === totalFilteredCount && totalFilteredCount > 0;
  const hasSelection = selectedCount > 0;

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleBulkEdit = () => {
    setShowEditDialog(true);
  };

  const confirmDelete = () => {
    onBulkDelete(recipes);
    setShowDeleteDialog(false);
  };

  const confirmEdit = () => {
    onBulkEdit(recipes);
    setShowEditDialog(false);
  };

  return (
    <>
      {/* Bulk Actions Toolbar - Mobile Optimized */}
      <Card className={`border-orange-200 bg-orange-50 shadow-sm ${isMobile ? 'mx-4' : ''}`}>
        <CardContent className={`${isMobile ? 'p-4' : 'p-4'}`}>
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
            {/* Selection Info */}
            <div className={`flex items-center gap-3 ${isMobile ? 'justify-center' : ''}`}>
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">
                  {selectedCount} resep dipilih
                </span>
              </div>
              
              {/* Select All Button - Touch Friendly */}
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAll}
                className={`flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100 active:bg-orange-200 transition-colors ${isMobile ? 'h-9 px-3' : ''}`}
                aria-label={isAllSelected ? 'Deselect all recipes' : 'Select all recipes'}
              >
                {isAllSelected ? (
                  <>
                    <Square className="h-4 w-4" />
                    <span className={isMobile ? 'hidden' : ''}>Batalkan Semua</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    <span className={isMobile ? 'hidden' : ''}>Pilih Semua</span>
                  </>
                )}
              </Button>
            </div>
            
            {/* Action Buttons - Mobile Optimized */}
            <div className={`flex ${isMobile ? 'flex-col space-y-2 w-full' : 'gap-2'}`}>
              <Button
                onClick={handleBulkEdit}
                disabled={!hasSelection}
                className={`bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors ${isMobile ? 'flex-1 h-11' : 'h-9'}`}
                aria-label="Edit selected recipes"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                <span>Edit ({selectedCount})</span>
              </Button>
              
              <Button
                onClick={handleBulkDelete}
                disabled={!hasSelection}
                variant="destructive"
                className={`bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors ${isMobile ? 'flex-1 h-11' : 'h-9'}`}
                aria-label="Delete selected recipes"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Hapus ({selectedCount})</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className={`border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors ${isMobile ? 'h-11 px-4' : 'h-9'}`}
                aria-label="Cancel bulk selection"
              >
                <X className="h-4 w-4 mr-2" />
                <span className={isMobile ? 'hidden' : ''}>Batal</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Konfirmasi Hapus Massal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Anda akan menghapus <strong>{selectedCount} resep</strong> secara permanen.
                Tindakan ini tidak dapat dibatalkan.
              </p>
              
              {recipes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Pratinjau resep yang akan dihapus:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {recipes.slice(0, 5).map((recipe) => (
                      <div key={recipe.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <ChefHat className="h-3 w-3" />
                        <span className="truncate">{recipe.namaResep}</span>
                        {recipe.kategoriResep && (
                          <span className="text-xs bg-gray-200 px-1 rounded">
                            {recipe.kategoriResep}
                          </span>
                        )}
                      </div>
                    ))}
                    {recipes.length > 5 && (
                      <p className="text-xs text-gray-500 italic">
                        ... dan {recipes.length - 5} resep lainnya
                      </p>
                    )}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Hapus {selectedCount} Resep
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Konfirmasi Edit Massal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Anda akan membuka dialog edit massal untuk <strong>{selectedCount} resep</strong>.
                Perubahan akan diterapkan ke semua resep yang dipilih.
              </p>
              
              {recipes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Pratinjau resep yang akan diedit:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {recipes.slice(0, 5).map((recipe) => (
                      <div key={recipe.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <ChefHat className="h-3 w-3" />
                        <span className="truncate">{recipe.namaResep}</span>
                        {recipe.kategoriResep && (
                          <span className="text-xs bg-gray-200 px-1 rounded">
                            {recipe.kategoriResep}
                          </span>
                        )}
                      </div>
                    ))}
                    {recipes.length > 5 && (
                      <p className="text-xs text-gray-500 italic">
                        ... dan {recipes.length - 5} resep lainnya
                      </p>
                    )}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEdit}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              Lanjutkan Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActions;