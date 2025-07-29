// src/pages/Recipes.tsx
// Simplified version to avoid MIME type and import issues

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Context and hooks
import { useRecipe } from '@/contexts/RecipeContext';
import { useRecipeFiltering } from '@/components/recipe/hooks/useRecipeFiltering';
import { useRecipeStats } from '@/components/recipe/hooks/useRecipeStats';

// Types
import type { Recipe, NewRecipe } from '@/components/recipe/types';

// Simple components to avoid import issues
const SimpleLoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <p className="text-sm text-gray-600">Memuat resep...</p>
    </div>
  </div>
);

const SimpleEmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="text-center py-12 px-6">
    <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
      <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {title}
    </h3>
    
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      {description}
    </p>

    {actionLabel && onAction && (
      <Button onClick={onAction} className="bg-orange-500 hover:bg-orange-600 text-white">
        {actionLabel}
      </Button>
    )}
  </div>
);

// Temporary simple table until we can fix import issues
const SimpleRecipeTable = ({ recipes, onEdit, onDelete }) => {
  if (recipes.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Nama Resep</th>
            <th className="text-left p-4">Kategori</th>
            <th className="text-right p-4">HPP/Porsi</th>
            <th className="text-right p-4">Harga Jual</th>
            <th className="text-center p-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe) => (
            <tr key={recipe.id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <div className="font-medium">{recipe.namaResep}</div>
                <div className="text-sm text-gray-500">{recipe.jumlahPorsi} porsi</div>
              </td>
              <td className="p-4">
                {recipe.kategoriResep && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {recipe.kategoriResep}
                  </span>
                )}
              </td>
              <td className="p-4 text-right font-medium">
                Rp {recipe.hppPerPorsi?.toLocaleString() || 0}
              </td>
              <td className="p-4 text-right font-medium text-green-600">
                Rp {recipe.hargaJualPorsi?.toLocaleString() || 0}
              </td>
              <td className="p-4 text-center">
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(recipe)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(recipe)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Hapus
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Simple stats component
const SimpleStats = ({ recipes }) => {
  const totalRecipes = recipes.length;
  const averageHpp = recipes.length > 0 
    ? recipes.reduce((sum, r) => sum + (r.hppPerPorsi || 0), 0) / recipes.length 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Resep</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecipes}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Rata-rata HPP</p>
              <p className="text-2xl font-bold text-gray-900">Rp {averageHpp.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalRecipes > 0 ? 'Aktif' : 'Kosong'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Recipes component
const Recipes: React.FC = () => {
  // Context
  const {
    recipes,
    isLoading,
    error,
    deleteRecipe,
    getUniqueCategories,
    clearError,
  } = useRecipe();

  // Local state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Hooks for filtering (simplified)
  const filtering = useRecipeFiltering({ recipes });

  // Error handling
  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handlers
  const handleAddRecipe = () => {
    toast.info('Fitur tambah resep sedang dalam pengembangan');
  };

  const handleEditRecipe = (recipe: Recipe) => {
    toast.info('Fitur edit resep sedang dalam pengembangan');
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRecipe) return;
    
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
    }
  };

  // Show loading state
  if (isLoading) {
    return <SimpleLoadingState />;
  }

  // Show error state
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
                onClick={() => window.location.reload()}
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
              onClick={handleAddRecipe}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Tambah Resep
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <SimpleStats recipes={recipes} />

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            {filtering.filteredAndSortedRecipes.length === 0 ? (
              <SimpleEmptyState
                title={recipes.length === 0 ? "Belum ada resep" : "Tidak ada hasil"}
                description={
                  recipes.length === 0
                    ? "Mulai dengan menambahkan resep pertama Anda"
                    : "Coba ubah filter pencarian atau tambah resep baru"
                }
                actionLabel={recipes.length === 0 ? "Tambah Resep Pertama" : "Bersihkan Filter"}
                onAction={recipes.length === 0 ? handleAddRecipe : filtering.clearFilters}
              />
            ) : (
              <SimpleRecipeTable
                recipes={filtering.filteredAndSortedRecipes}
                onEdit={handleEditRecipe}
                onDelete={handleDeleteRecipe}
              />
            )}
          </CardContent>
        </Card>

        {/* Simple Delete Confirmation Dialog */}
        {isDeleteDialogOpen && selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hapus Resep
                </h3>
                <p className="text-gray-600 mb-4">
                  Yakin ingin menghapus resep "{selectedRecipe.namaResep}"?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        {recipes.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            <p>
              Menampilkan {filtering.filteredAndSortedRecipes.length} dari {recipes.length} resep
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;