import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ChefHat, Clock, Users, DollarSign, Search, Plus } from 'lucide-react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeForm from '@/components/RecipeForm';
import { Recipe } from '@/types/recipe';
import MenuExportButton from '@/components/MenuExportButton';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';

// BARIS INI DITAMBAHKAN UNTUK IMPORT UTILS
import { formatDateForDisplay } from '@/utils/dateUtils'; // Import fungsi formatDateForDisplay (meskipun tidak langsung digunakan di sini)

const RecipesPage = () => {
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { settings } = useUserSettings();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    // MODIFIED: Ganti confirm() dengan modal kustom jika ini untuk lingkungan iFrame
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

  // FUNGSI formatCurrency LOKAL DITAMBAHKAN KEMBALI DI SINI
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // MODIFIED: Logika pemfilteran resep menggunakan useMemo
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Pastikan recipe.deskripsi ada sebelum memanggil toLowerCase
      const deskripsiText = recipe.deskripsi || ''; // Fallback ke string kosong
      const matchesSearch = recipe.namaResep.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            deskripsiText.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, categoryFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center font-inter">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat resep...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6 font-inter">
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
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-md shadow-md transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Resep
              </Button>
            </div>
          </div>
        </div>

        {/* Recipe Form */}
        {showForm && (
          <div className="mb-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
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

        {/* Filter Section */}
        <div className="mb-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Filter Resep</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan nama resep atau deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* MODIFIED: Select Filter Kategori */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {settings.recipeCategories && settings.recipeCategories.length > 0 && ( // Hanya render jika ada kategori
                      settings.recipeCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    )}
                    {/* Baris yang dihapus:
                    {settings.recipeCategories.length === 0 ? (
                      <SelectItem value="" disabled>
                        Belum ada kategori. Tambahkan di Pengaturan.
                      </SelectItem>
                    ) : null}
                    */}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipes List */}
        <div className="space-y-4">
          {filteredRecipes.length === 0 ? (
            <Card className="text-center p-8 bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter !== 'all' ? 'Tidak ada resep yang cocok dengan filter' : 'Belum ada resep yang dibuat'}
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-md shadow-md transition-colors duration-200"
                >
                  Buat Resep Pertama
                </Button>
              )}
            </Card>
          ) : (
            filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg hover:shadow-xl transition-all duration-300">
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
                        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(recipe.id, recipe.namaResep)}
                        className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
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