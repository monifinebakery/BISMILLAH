import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, Settings, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useRecipe } from '@/contexts/RecipeContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Recipe, NewRecipe } from '@/types/recipe';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecipeForm from '@/components/RecipeForm';

const RecipesPage = () => {
  // --- State Utama Halaman ---
  const { recipes, isLoading, deleteRecipe, addRecipe, updateRecipe } = useRecipe();
  const { settings, saveSettings } = useUserSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // --- State untuk Dialog ---
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  
  // --- State untuk Form Kategori ---
  const [newCategory, setNewCategory] = useState('');

  // --- Logika Filtering & Pagination ---
  const filteredRecipes = useMemo(() => 
    recipes.filter(recipe => {
      const matchesSearch = recipe.namaResep.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || recipe.kategoriResep === categoryFilter;
      return matchesSearch && matchesCategory;
    }), [recipes, searchTerm, categoryFilter]
  );

  const currentRecipes = useMemo(() => {
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecipes.slice(firstItemIndex, firstItemIndex + itemsPerPage);
  }, [filteredRecipes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);

  const recipeCategories = useMemo(() => settings?.recipeCategories || [], [settings]);

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

  const handleAddCategory = () => {
    if (!newCategory.trim()) { toast.error('Nama kategori tidak boleh kosong'); return; }
    if (recipeCategories.map(c => c.toLowerCase()).includes(newCategory.trim().toLowerCase())) { toast.error('Kategori ini sudah ada'); return; }
    
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
  
  if (isLoading || !settings) {
    return <div className="p-6 text-center text-muted-foreground">Memuat data...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Resep</h1>
            <p className="text-muted-foreground">Buat, kelola, dan analisis semua resep produk Anda.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Kelola Kategori
          </Button>
          <Button onClick={() => openRecipeForm(null)}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Resep
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Daftar Resep ({filteredRecipes.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Cari nama resep..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
              </div>
              <Select value={categoryFilter} onValueChange={(value) => {setCategoryFilter(value); setCurrentPage(1);}}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {recipeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Resep</TableHead><TableHead>Kategori</TableHead>
                  <TableHead>HPP/Porsi</TableHead><TableHead>Harga Jual</TableHead>
                  <TableHead>Margin</TableHead><TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecipes.length > 0 ? currentRecipes.map(recipe => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.namaResep}</TableCell>
                    <TableCell>{recipe.kategoriResep || '-'}</TableCell>
                    <TableCell>{formatCurrency(recipe.hppPerPorsi)}</TableCell>
                    <TableCell className="font-semibold text-green-600">{formatCurrency(recipe.hargaJualPorsi)}</TableCell>
                    <TableCell className="font-semibold">{formatPercentage((recipe.hargaJualPorsi - recipe.hppPerPorsi) / (recipe.hargaJualPorsi || 1))}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openRecipeForm(recipe)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Anda Yakin?</AlertDialogTitle><AlertDialogDescription>Resep "{recipe.namaResep}" akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRecipe(recipe.id)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Belum ada resep yang dibuat.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Dialog untuk Kelola Kategori Resep */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Kelola Kategori Resep</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Tambah Kategori Baru</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Contoh: Minuman Dingin" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()} />
                  <Button onClick={handleAddCategory}><Plus className="h-4 w-4 mr-2" />Tambah</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Daftar Kategori</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recipeCategories.length > 0 ? (
                    recipeCategories.map(cat => (
                      <div key={cat} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="font-medium">{cat}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Hapus Kategori "{cat}"?</AlertDialogTitle><AlertDialogDescription>Menghapus kategori tidak akan menghapus resep yang sudah ada.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(cat)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  ) : (<p className="text-center text-muted-foreground py-4">Belum ada kategori.</p>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog untuk Form Tambah/Edit Resep */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? 'Edit Resep' : 'Tambah Resep Baru'}</DialogTitle>
            <DialogDescription>Isi detail resep dan kalkulasi HPP akan otomatis diperbarui.</DialogDescription>
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
  );
};

export default RecipesPage;