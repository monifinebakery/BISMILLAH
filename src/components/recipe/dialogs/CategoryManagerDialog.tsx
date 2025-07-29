// src/components/recipe/dialogs/CategoryManagerDialog.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Plus,
  Trash2,
  Edit,
  Check,
  AlertTriangle,
  Info,
  ChefHat,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { RECIPE_CATEGORIES } from '../types';
import type { Recipe } from '../types';

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
}

interface CategoryStats {
  name: string;
  count: number;
  isDefault: boolean;
  canDelete: boolean;
}

const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  isOpen,
  onOpenChange,
  recipes,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get category statistics
  const categoryStats: CategoryStats[] = React.useMemo(() => {
    // Get all categories from recipes
    const usedCategories = new Set(
      recipes
        .map(recipe => recipe.kategoriResep)
        .filter((category): category is string => Boolean(category))
    );

    // Count recipes per category
    const categoryCounts = new Map<string, number>();
    recipes.forEach(recipe => {
      if (recipe.kategoriResep) {
        const count = categoryCounts.get(recipe.kategoriResep) || 0;
        categoryCounts.set(recipe.kategoriResep, count + 1);
      }
    });

    // Combine default and custom categories
    const allCategories = new Set([
      ...RECIPE_CATEGORIES,
      ...usedCategories
    ]);

    return Array.from(allCategories).map(category => ({
      name: category,
      count: categoryCounts.get(category) || 0,
      isDefault: RECIPE_CATEGORIES.includes(category as any),
      canDelete: !RECIPE_CATEGORIES.includes(category as any) && (categoryCounts.get(category) || 0) === 0,
    })).sort((a, b) => {
      // Sort: default categories first, then by usage count, then alphabetically
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      if (a.count !== b.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [recipes]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    if (categoryStats.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error('Kategori sudah ada');
      return;
    }

    if (newCategoryName.trim().length > 50) {
      toast.error('Nama kategori maksimal 50 karakter');
      return;
    }

    setIsLoading(true);
    try {
      // In real implementation, you would save to database
      // For now, we'll just show success and clear the input
      toast.success(`Kategori "${newCategoryName.trim()}" berhasil ditambahkan`);
      setNewCategoryName('');
    } catch (error) {
      toast.error('Gagal menambahkan kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    if (oldName === newName.trim()) {
      setEditingCategory(null);
      return;
    }

    if (categoryStats.some(cat => cat.name !== oldName && cat.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error('Kategori sudah ada');
      return;
    }

    if (newName.trim().length > 50) {
      toast.error('Nama kategori maksimal 50 karakter');
      return;
    }

    setIsLoading(true);
    try {
      // In real implementation, you would update all recipes with this category
      toast.success(`Kategori "${oldName}" berhasil diubah menjadi "${newName.trim()}"`);
      setEditingCategory(null);
      setEditName('');
    } catch (error) {
      toast.error('Gagal mengubah kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    setIsLoading(true);
    try {
      // In real implementation, you would remove category from database
      toast.success(`Kategori "${categoryName}" berhasil dihapus`);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error('Gagal menghapus kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditName(categoryName);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  if (!isOpen) return null;

  const totalRecipes = recipes.length;
  const categorizedRecipes = recipes.filter(recipe => recipe.kategoriResep).length;
  const uncategorizedRecipes = totalRecipes - categorizedRecipes;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white">
          
          {/* Header */}
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Kelola Kategori Resep
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Atur kategori untuk mengorganisir resep Anda
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Resep</p>
                        <p className="text-xl font-bold text-blue-900">{totalRecipes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Terkategorisasi</p>
                        <p className="text-xl font-bold text-green-900">{categorizedRecipes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Total Kategori</p>
                        <p className="text-xl font-bold text-orange-900">{categoryStats.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add New Category */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    Tambah Kategori Baru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="newCategory" className="sr-only">
                        Nama kategori baru
                      </Label>
                      <Input
                        id="newCategory"
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Masukkan nama kategori baru"
                        disabled={isLoading}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        maxLength={50}
                      />
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim() || isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    Kategori baru akan tersedia untuk semua resep
                  </p>
                </CardContent>
              </Card>

              {/* Categories List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daftar Kategori</CardTitle>
                  <p className="text-sm text-gray-600">
                    Kelola kategori yang sudah ada
                  </p>
                </CardHeader>
                <CardContent>
                  {categoryStats.length === 0 ? (
                    <div className="text-center py-8">
                      <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Belum ada kategori</p>
                      <p className="text-sm text-gray-400">
                        Tambahkan kategori pertama menggunakan form di atas
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Kategori</TableHead>
                            <TableHead className="text-center">Jumlah Resep</TableHead>
                            <TableHead className="text-center">Jenis</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryStats.map((category) => (
                            <TableRow key={category.name}>
                              
                              {/* Category Name */}
                              <TableCell>
                                {editingCategory === category.name ? (
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="h-8"
                                      maxLength={50}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditCategory(category.name, editName);
                                        } else if (e.key === 'Escape') {
                                          cancelEdit();
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditCategory(category.name, editName)}
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEdit}
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{category.name}</span>
                                  </div>
                                )}
                              </TableCell>

                              {/* Recipe Count */}
                              <TableCell className="text-center">
                                <Badge variant={category.count > 0 ? "default" : "secondary"}>
                                  {category.count} resep
                                </Badge>
                              </TableCell>

                              {/* Category Type */}
                              <TableCell className="text-center">
                                <Badge variant={category.isDefault ? "outline" : "secondary"}>
                                  {category.isDefault ? 'Default' : 'Custom'}
                                </Badge>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-1">
                                  {!category.isDefault && editingCategory !== category.name && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEdit(category.name)}
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {category.canDelete && editingCategory !== category.name && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setCategoryToDelete(category.name)}
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {!category.canDelete && !category.isDefault && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>Digunakan</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Uncategorized Warning */}
              {uncategorizedRecipes > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">
                          Resep Tanpa Kategori
                        </h4>
                        <p className="text-sm text-yellow-800">
                          Ada <strong>{uncategorizedRecipes} resep</strong> yang belum dikategorikan. 
                          Pertimbangkan untuk menambahkan kategori agar lebih terorganisir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">
                        Tips Mengelola Kategori
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Kategori default tidak dapat dihapus atau diubah</li>
                        <li>• Kategori custom hanya bisa dihapus jika tidak digunakan</li>
                        <li>• Gunakan nama kategori yang deskriptif dan mudah dipahami</li>
                        <li>• Maksimal 50 karakter untuk nama kategori</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Hapus Kategori
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus kategori "<strong>{categoryToDelete}</strong>"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoryManagerDialog;