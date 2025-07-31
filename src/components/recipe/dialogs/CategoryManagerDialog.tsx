// src/components/recipe/dialogs/CategoryManagerDialog.tsx

import React, { useState } from 'react';
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
  ChefHat,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import type { Recipe } from '../types';

// Interface untuk statistik kategori, akan diterima dari props
export interface CategoryStats {
  name: string;
  count: number;
  isDefault: boolean;
  canDelete: boolean;
}

// Props telah diperbarui untuk menerima data dan fungsi dari luar
interface CategoryManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  categories: CategoryStats[]; // Data kategori sekarang dari props
  onAddCategory: (name: string) => Promise<void>; // Fungsi untuk menambah
  onEditCategory: (oldName: string, newName: string) => Promise<void>; // Fungsi untuk mengubah
  onDeleteCategory: (name: string) => Promise<void>; // Fungsi untuk menghapus
}

const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  isOpen,
  onOpenChange,
  recipes = [], // FIX: Default value to prevent error
  categories = [], // FIX: Default value to prevent error
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ❌ Logika untuk menghitung statistik kategori telah dihapus dari sini.
  // Komponen ini sekarang menerima 'categories' sebagai sumber data utama.

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error('Kategori sudah ada');
      return;
    }
    if (newCategoryName.trim().length > 50) {
      toast.error('Nama kategori maksimal 50 karakter');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Memanggil fungsi dari props untuk menyimpan data
      await onAddCategory(newCategoryName.trim());
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
    if (oldName.toLowerCase() === newName.trim().toLowerCase()) {
      setEditingCategory(null);
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error('Kategori sudah ada');
      return;
    }
    if (newName.trim().length > 50) {
      toast.error('Nama kategori maksimal 50 karakter');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Memanggil fungsi dari props untuk mengubah data
      await onEditCategory(oldName, newName.trim());
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
      // ✅ Memanggil fungsi dari props untuk menghapus data
      await onDeleteCategory(categoryName);
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Kelola Kategori Resep
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
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

          <div className="flex-grow overflow-y-auto">
            <CardContent className="p-6 space-y-6">

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Total Resep</p>
                        <p className="text-2xl font-semibold text-gray-900">{totalRecipes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Terkategorisasi</p>
                        <p className="text-2xl font-semibold text-gray-900">{categorizedRecipes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Total Kategori</p>
                        <p className="text-2xl font-semibold text-gray-900">{categories.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add New Category */}
              <Card className="border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-gray-600" />
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
                        className="border-gray-300"
                      />
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim() || isLoading}
                      className="bg-gray-900 hover:bg-gray-800"
                    >
                      {isLoading && newCategoryName ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Kategori baru akan tersedia untuk semua resep
                  </p>
                </CardContent>
              </Card>

              {/* Categories List */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Daftar Kategori</CardTitle>
                  <p className="text-sm text-gray-500">
                    Kelola kategori yang sudah ada
                  </p>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2 font-medium">Belum ada kategori</p>
                      <p className="text-sm text-gray-400">
                        Tambahkan kategori pertama menggunakan form di atas
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="font-medium">Nama Kategori</TableHead>
                            <TableHead className="text-center font-medium">Jumlah Resep</TableHead>
                            <TableHead className="text-center font-medium">Jenis</TableHead>
                            <TableHead className="text-center font-medium">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map((category) => (
                            <TableRow key={category.name} className="border-gray-100">
                              
                              {/* Category Name */}
                              <TableCell>
                                {editingCategory === category.name ? (
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="h-8 border-gray-300"
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
                                      className="h-8 w-8 p-0 bg-gray-900 hover:bg-gray-800"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEdit}
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0 border-gray-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">{category.name}</span>
                                  </div>
                                )}
                              </TableCell>

                              {/* Recipe Count */}
                              <TableCell className="text-center">
                                <Badge variant={category.count > 0 ? "default" : "secondary"} className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                                  {category.count} resep
                                </Badge>
                              </TableCell>

                              {/* Category Type */}
                              <TableCell className="text-center">
                                <Badge variant="outline" className="border-gray-300 text-gray-600">
                                  {category.isDefault ? 'Default' : 'Custom'}
                                </Badge>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-1">
                                  {editingCategory !== category.name && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEdit(category.name)}
                                      disabled={isLoading || category.isDefault}
                                      title={category.isDefault ? "Kategori default tidak bisa diubah" : "Ubah Kategori"}
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                      title="Hapus Kategori"
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {!category.canDelete && (
                                    <div 
                                      className="flex items-center gap-1 text-xs text-gray-400 px-2"
                                      title={category.isDefault ? "Kategori default tidak bisa dihapus" : "Kategori sedang digunakan oleh resep"}
                                    >
                                      <AlertTriangle className="h-3 w-3" />
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
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900 mb-1">
                          Resep Tanpa Kategori
                        </h4>
                        <p className="text-sm text-orange-800">
                          Ada <strong>{uncategorizedRecipes} resep</strong> yang belum dikategorikan. 
                          Pertimbangkan untuk menambahkan kategori agar lebih terorganisir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </div>
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
