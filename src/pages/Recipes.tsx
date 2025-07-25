// src/pages/RecipesPage.tsx
// 🧮 UPDATED WITH HPP PER PCS CALCULATION SUPPORT

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, Settings, ChevronLeft, ChevronRight, BookOpen, Calculator, Copy, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useRecipe } from '@/contexts/RecipeContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Recipe, NewRecipe } from '@/types/recipe';
import { formatCurrency, formatPercentage } from '@/utils/formatUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RecipeForm from '@/components/RecipeForm';

const RecipesPage = () => {
  // --- State Utama Halaman ---
  const { 
    recipes, 
    isLoading, 
    addRecipe, 
    updateRecipe, 
    deleteRecipe,
    duplicateRecipe,
    searchRecipes,
    getRecipesByCategory,
    calculateHPP
  } = useRecipe();
  const { settings, saveSettings } = useUserSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, hpp, profit, created
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // --- State untuk Dialog ---
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [duplicatingRecipe, setDuplicatingRecipe] = useState<Recipe | null>(null);
  
  // --- State untuk Form ---
  const [newCategory, setNewCategory] = useState('');
  const [duplicateRecipeName, setDuplicateRecipeName] = useState('');

  // --- Logika Filtering, Sorting & Pagination ---
  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = recipes.filter(recipe => {
      const matchesSearch = recipe.namaResep.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.kategoriResep?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || recipe.kategoriResep === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.namaResep.toLowerCase();
          bValue = b.namaResep.toLowerCase();
          break;
        case 'hpp':
          aValue = a.hppPerPorsi;
          bValue = b.hppPerPorsi;
          break;
        case 'profit':
          aValue = a.hargaJualPorsi - a.hppPerPorsi;
          bValue = b.hargaJualPorsi - b.hppPerPorsi;
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          aValue = a.namaResep.toLowerCase();
          bValue = b.namaResep.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [recipes, searchTerm, categoryFilter, sortBy, sortOrder]);

  const currentRecipes = useMemo(() => {
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedRecipes.slice(firstItemIndex, firstItemIndex + itemsPerPage);
  }, [filteredAndSortedRecipes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedRecipes.length / itemsPerPage);
  const recipeCategories = useMemo(() => settings?.recipeCategories || [], [settings]);

  // --- Statistics ---
  const recipeStats = useMemo(() => {
    const totalRecipes = recipes.length;
    const totalHPP = recipes.reduce((sum, recipe) => sum + (recipe.totalHpp || 0), 0);
    const avgHppPerPorsi = totalRecipes > 0 ? recipes.reduce((sum, recipe) => sum + (recipe.hppPerPorsi || 0), 0) / totalRecipes : 0;
    const avgProfit = totalRecipes > 0 ? recipes.reduce((sum, recipe) => sum + ((recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0)), 0) / totalRecipes : 0;
    
    return {
      totalRecipes,
      totalHPP,
      avgHppPerPorsi,
      avgProfit
    };
  }, [recipes]);

  // --- Handlers ---
  const handleSaveRecipe = async (recipeData: NewRecipe) => {
    const success = editingRecipe 
      ? await updateRecipe(editingRecipe.id, recipeData)
      : await addRecipe(recipeData);
      
    if (success) {
      setIsFormOpen(false);
      setEditingRecipe(null);
    }
  };

  const openRecipeForm = (recipe: Recipe | null) => {
    setEditingRecipe(recipe);
    setIsFormOpen(true);
  };

  const handleDuplicateRecipe = async () => {
    if (!duplicatingRecipe || !duplicateRecipeName.trim()) {
      toast.error('Nama resep duplikat harus diisi');
      return;
    }

    const success = await duplicateRecipe(duplicatingRecipe.id, duplicateRecipeName.trim());
    if (success) {
      setIsDuplicateDialogOpen(false);
      setDuplicatingRecipe(null);
      setDuplicateRecipeName('');
    }
  };

  const openDuplicateDialog = (recipe: Recipe) => {
    setDuplicatingRecipe(recipe);
    setDuplicateRecipeName(`${recipe.namaResep} (Copy)`);
    setIsDuplicateDialogOpen(true);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) { 
      toast.error('Nama kategori tidak boleh kosong'); 
      return; 
    }
    if (recipeCategories.map(c => c.toLowerCase()).includes(newCategory.trim().toLowerCase())) { 
      toast.error('Kategori ini sudah ada'); 
      return; 
    }
    
    const updatedCategories = [...recipeCategories, newCategory.trim()];
    saveSettings({ recipeCategories: updatedCategories });
    setNewCategory('');
    toast.success(`Kategori "${newCategory.trim()}" berhasil ditambahkan!`);
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const updatedCategories = recipeCategories.filter(cat => cat !== categoryToDelete);
    saveSettings({ recipeCategories: updatedCategories });
    toast.success(`Kategori "${categoryToDelete}" berhasil dihapus!`);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat data resep...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Manajemen Resep
              </h1>
              <p className="text-gray-600">Buat, kelola, dan analisis resep produk dengan kalkulasi HPP per porsi & per pcs</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)} className="shadow-md">
              <Settings className="h-4 w-4 mr-2" /> Kelola Kategori
            </Button>
            <Button onClick={() => openRecipeForm(null)} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md">
              <Plus className="h-4 w-4 mr-2" /> Tambah Resep
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Resep</p>
                  <p className="text-2xl font-bold text-blue-600">{recipeStats.totalRecipes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Calculator className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rata-rata HPP/Porsi</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(recipeStats.avgHppPerPorsi)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rata-rata Profit</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(recipeStats.avgProfit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total HPP</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(recipeStats.totalHPP)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Daftar Resep ({filteredAndSortedRecipes.length})</CardTitle>
                <CardDescription>Kelola dan analisis resep dengan kalkulasi HPP otomatis</CardDescription>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Cari nama resep..." 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    className="pl-10 shadow-sm" 
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={(value) => {setCategoryFilter(value); setCurrentPage(1);}}>
                  <SelectTrigger className="w-full sm:w-48 shadow-sm">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {recipeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48 shadow-sm">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nama Resep</SelectItem>
                    <SelectItem value="hpp">HPP per Porsi</SelectItem>
                    <SelectItem value="profit">Keuntungan</SelectItem>
                    <SelectItem value="created">Tanggal Dibuat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">
                      <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Nama Resep {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Button>
                    </TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Porsi</TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort('hpp')} className="h-auto p-0 font-semibold hover:bg-transparent">
                        HPP/Porsi {sortBy === 'hpp' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">HPP/Pcs</TableHead>
                    <TableHead className="text-right">Harga Jual/Porsi</TableHead>
                    <TableHead className="text-right">Harga Jual/Pcs</TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort('profit')} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecipes.length > 0 ? currentRecipes.map(recipe => {
                    const profitPerPorsi = (recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0);
                    const profitPerPcs = (recipe.hargaJualPerPcs || 0) - (recipe.hppPerPcs || 0);
                    const marginPercent = (recipe.hargaJualPorsi || 0) > 0 ? (profitPerPorsi / (recipe.hargaJualPorsi || 1)) * 100 : 0;
                    
                    return (
                      <TableRow key={recipe.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{recipe.namaResep}</div>
                            {recipe.deskripsi && (
                              <div className="text-sm text-gray-500 truncate max-w-48">{recipe.deskripsi}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {recipe.kategoriResep ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {recipe.kategoriResep}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{recipe.jumlahPorsi}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(recipe.hppPerPorsi || 0)}</TableCell>
                        <TableCell className="text-right text-sm text-gray-600">
                          {recipe.hppPerPcs ? formatCurrency(recipe.hppPerPcs) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(recipe.hargaJualPorsi || 0)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-green-600">
                          {recipe.hargaJualPerPcs ? formatCurrency(recipe.hargaJualPerPcs) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{formatCurrency(profitPerPorsi || 0)}</div>
                            <div className="text-xs text-gray-500">{formatPercentage((marginPercent || 0) / 100)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openDuplicateDialog(recipe)} className="h-8 w-8">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Duplikasi Resep</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openRecipeForm(recipe)} className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Resep</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Resep "{recipe.namaResep}" akan dihapus permanen dan tidak dapat dikembalikan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteRecipe(recipe.id)} 
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Ya, Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center h-24 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <BookOpen className="h-12 w-12 text-gray-300" />
                          <p>Belum ada resep yang dibuat</p>
                          <Button onClick={() => openRecipeForm(null)} size="sm" className="mt-2">
                            <Plus className="h-4 w-4 mr-2" /> Buat Resep Pertama
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between p-4 border-t bg-gray-50/30">
              <div className="text-sm text-gray-600">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedRecipes.length)} dari {filteredAndSortedRecipes.length} resep
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  disabled={currentPage === 1}
                  className="shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3 py-1 bg-white rounded border shadow-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  disabled={currentPage === totalPages}
                  className="shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Category Management Dialog */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Kelola Kategori Resep</DialogTitle>
              <DialogDescription>Tambah atau hapus kategori untuk mengorganisir resep Anda</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tambah Kategori Baru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Contoh: Minuman Dingin" 
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()} 
                    />
                    <Button onClick={handleAddCategory}>
                      <Plus className="h-4 w-4 mr-2" />Tambah
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daftar Kategori ({recipeCategories.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recipeCategories.length > 0 ? (
                      recipeCategories.map(cat => (
                        <div key={cat} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <span className="font-medium">{cat}</span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Kategori "{cat}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Menghapus kategori tidak akan menghapus resep yang sudah ada, hanya menghilangkan kategori dari daftar.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteCategory(cat)} 
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ya, Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Belum ada kategori</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Duplicate Recipe Dialog */}
        <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Duplikasi Resep</DialogTitle>
              <DialogDescription>
                Buat salinan dari resep "{duplicatingRecipe?.namaResep}" dengan nama baru
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="duplicate-name">Nama Resep Baru</Label>
                <Input
                  id="duplicate-name"
                  value={duplicateRecipeName}
                  onChange={(e) => setDuplicateRecipeName(e.target.value)}
                  placeholder="Masukkan nama resep baru..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleDuplicateRecipe} disabled={!duplicateRecipeName.trim()}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplikasi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Recipe Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingRecipe ? `Edit Resep: ${editingRecipe.namaResep}` : 'Tambah Resep Baru'}
              </DialogTitle>
              <DialogDescription>
                Isi detail resep dan kalkulasi HPP per porsi & per pcs akan otomatis diperbarui
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 -mr-6">
              <RecipeForm 
                initialData={editingRecipe}
                onSave={handleSaveRecipe}
                onCancel={() => { setIsFormOpen(false); setEditingRecipe(null); }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RecipesPage;