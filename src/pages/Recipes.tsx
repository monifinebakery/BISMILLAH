import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ChefHat, Clock, Users, DollarSign } from 'lucide-react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeForm from '@/components/RecipeForm';
import { Recipe } from '@/types/recipe';
import MenuExportButton from '@/components/MenuExportButton';

const RecipesPage = () => {
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus resep "${name}"?`)) {
      await deleteRecipe(id);
    }
  };

  const handleSave = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, recipeData);
    } else {
      await addRecipe(recipeData);
    }
    setShowForm(false);
    setEditingRecipe(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat resep...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
                <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Manajemen Resep
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Kelola dan hitung HPP resep masakan
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <MenuExportButton
                data={recipes}
                filename="resep"
                menuType="Resep"
              />
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Tambah Resep
              </Button>
            </div>
          </div>
        </div>

        {/* Recipe Form */}
        {showForm && (
          <div className="mb-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {editingRecipe ? 'Edit Resep' : 'Tambah Resep Baru'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecipeForm
                  initialData={editingRecipe}
                  onSave={handleSave}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingRecipe(null);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recipes List */}
        <div className="space-y-4">
          {recipes.length === 0 ? (
            <Card className="text-center p-8 bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Belum ada resep yang dibuat</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Buat Resep Pertama
              </Button>
            </Card>
          ) : (
            recipes.map((recipe) => (
              <Card key={recipe.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-800">{recipe.namaResep}</h3>
                        <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200">
                          {recipe.porsi} porsi
                        </Badge>
                        {/* MODIFIED: Tampilkan Kategori Resep */}
                        {recipe.category && (
                          <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                            {recipe.category}
                          </Badge>
                        )}
                      </div>
                      
                      {recipe.deskripsi && (
                        <p className="text-gray-600 mb-4">{recipe.deskripsi}</p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-500">HPP per Porsi</p>
                            <p className="font-semibold text-green-600">{formatCurrency(recipe.hppPerPorsi)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-500">Harga Jual</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(recipe.hargaJualPerPorsi)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-500">Margin</p>
                            <p className="font-semibold text-purple-600">{recipe.marginKeuntungan}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(recipe)}
                        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(recipe.id, recipe.namaResep)}
                        className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;
