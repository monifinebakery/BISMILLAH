// src/components/recipe/dialogs/CategoryManagerDialog.tsx
// NO DEFAULT CATEGORIES VERSION - User creates all categories

import React, { useState, useEffect, useCallback } from 'react';
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
  BarChart3,
  RefreshCcw,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAllAvailableCategories,
  getCustomCategories,
  saveCustomCategories,
  isValidCategoryName,
  categoryExists
} from '../types';
import type { Recipe } from '../types';

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<boolean>;
  refreshRecipes: () => Promise<void>;
}

interface CategoryStats {
  name: string;
  count: number;
  isCustom: boolean;
  canDelete: boolean;
  canEdit: boolean;
  recipes: Recipe[];
}

const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  isOpen,
  onOpenChange,
  recipes,
  updateRecipe,
  refreshRecipes,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Load custom categories from localStorage
  useEffect(() => {
    const loadCategories = () => {
      const categories = getCustomCategories();
      setCustomCategories(categories);
    };

    loadCategories();
  }, []);

  // Save custom categories to localStorage
  const saveCategories = useCallback((categories: string[]) => {
    saveCustomCategories(categories);
    setCustomCategories(categories);
  }, []);

  // Get all available categories (custom + used in recipes)
  const allAvailableCategories = React.useMemo(() => {
    return getAllAvailableCategories(recipes);
  }, [recipes, customCategories]);

  // Get category statistics
  const categoryStats: CategoryStats[] = React.useMemo(() => {
    const categoryGroups = new Map<string, Recipe[]>();
    
    // Group recipes by category
    recipes.forEach(recipe => {
      if (recipe.kategoriResep?.trim()) {
        const existing = categoryGroups.get(recipe.kategoriResep) || [];
        categoryGroups.set(recipe.kategoriResep, [...existing, recipe]);
      }
    });

    return allAvailableCategories.map(categoryName => {
      const recipesInCategory = categoryGroups.get(categoryName) || [];
      const isCustom = customCategories.includes(categoryName);
      
      return {
        name: categoryName,
        count: recipesInCategory.length,
        isCustom,
        canDelete: recipesInCategory.length === 0, // Can delete any unused category
        canEdit: true, // Can edit any category since no defaults
        recipes: recipesInCategory,
      };
    }).sort((a, b) => {
      // Sort by usage count first, then alphabetically
      if (a.count !== b.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [allAvailableCategories, recipes, customCategories]);

  // Add new category
  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    
    if (!isValidCategoryName(trimmedName)) {
      toast.error('Nama kategori harus antara 1-50 karakter');
      return;
    }

    if (categoryExists(trimmedName, allAvailableCategories)) {
      toast.error('Kategori sudah ada');
      return;
    }

    setIsLoading(true);
    try {
      // Add to custom categories
      const newCustomCategories = [...customCategories, trimmedName];
      saveCategories(newCustomCategories);
      
      toast.success(`Kategori "${trimmedName}" berhasil ditambahkan`);
      setNewCategoryName('');
      
      console.log('Added new category:', trimmedName);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Gagal menambahkan kategori');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit category name and update all recipes using it
  const handleEditCategory = async (oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();

    if (!isValidCategoryName(trimmedNewName)) {
      toast.error('Nama kategori harus antara 1-50 karakter');
      return;
    }

    if (oldName === trimmedNewName) {
      setEditingCategory(null);
      return;
    }

    if (categoryExists(trimmedNewName, allAvailableCategories.filter(cat => cat !== oldName))) {
      toast.error('Kategori sudah ada');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Editing category "${oldName}" to "${trimmedNewName}"`);
      
      // Find all recipes using this category
      const affectedRecipes = recipes.filter(recipe => recipe.kategoriResep === oldName);
      console.log(`Found ${affectedRecipes.length} recipes using category "${oldName}"`);

      // Update all affected recipes
      if (affectedRecipes.length > 0) {
        const updatePromises = affectedRecipes.map(recipe => {
          console.log(`Updating recipe "${recipe.namaResep}" category to "${trimmedNewName}"`);
          return updateRecipe(recipe.id, { kategoriResep: trimmedNewName });
        });

        const results = await Promise.all(updatePromises);
        const successCount = results.filter(success => success).length;
        
        if (successCount !== affectedRecipes.length) {
          toast.warning(`Berhasil mengubah ${successCount} dari ${affectedRecipes.length} resep`);
        } else {
          console.log(`Successfully updated ${successCount} recipes`);
        }
      }

      // Update custom categories list
      const newCustomCategories = customCategories.map(cat => 
        cat === oldName ? trimmedNewName : cat
      );
      
      // If the old category was not in custom categories but is used in recipes,
      // add the new name to custom categories
      if (!customCategories.includes(oldName) && affectedRecipes.length > 0) {
        newCustomCategories.push(trimmedNewName);
      }
      
      saveCategories(newCustomCategories);

      toast.success(`Kategori "${oldName}" berhasil diubah menjadi "${trimmedNewName}"`);
      setEditingCategory(null);
      setEditName('');

      // Refresh data to ensure UI is up to date
      setTimeout(() => refreshRecipes(), 500);
      
    } catch (error) {
      console.error('Error editing category:', error);
      toast.error('Gagal mengubah kategori');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryName: string) => {
    const categoryInUse = recipes.some(recipe => recipe.kategoriResep === categoryName);
    if (categoryInUse) {
      toast.error('Kategori tidak dapat dihapus karena masih digunakan oleh resep');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Deleting category "${categoryName}"`);
      
      // Remove from custom categories
      const newCustomCategories = customCategories.filter(cat => cat !== categoryName);
      saveCategories(newCustomCategories);

      toast.success(`Kategori "${categoryName}" berhasil dihapus`);
      setCategoryToDelete(null);
      
      console.log(`Successfully deleted category "${categoryName}"`);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Gagal menghapus kategori');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleForceRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshRecipes();
      // Reload custom categories too
      const categories = getCustomCategories();
      setCustomCategories(categories);
      toast.success('Data berhasil dimuat ulang');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Gagal memuat ulang data');
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingCategory) {
          cancelEdit();
        } else if (!categoryToDelete) {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, editingCategory, categoryToDelete, onOpenChange]);

  if (!isOpen) return null;

  const totalRecipes = recipes.length;
  const categorizedRecipes = recipes.filter(recipe => recipe.kategoriResep?.trim()).length;
  const uncategorizedRecipes = totalRecipes - categorizedRecipes;

  // Suggested categories for first-time users
  const suggestedCategories = [
    'Makanan Utama', 'Makanan Ringan', 'Minuman', 'Dessert', 
    'Kue', 'Roti', 'Sup', 'Salad'
  ];

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
                  onClick={handleForceRefresh}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-700 font-medium">Total Resep</p>
                        <p className="text-2xl font-semibold text-orange-900">{totalRecipes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Terkategorisasi</p>
                        <p className="text-2xl font-semibold text-blue-900">{categorizedRecipes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-medium">Total Kategori</p>
                        <p className="text-2xl font-semibold text-green-900">{categoryStats.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add New Category */}
              <Card className="border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-orange-600" />
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
                        placeholder="Contoh: Makanan Utama, Minuman, dll."
                        disabled={isLoading}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        maxLength={50}
                        className="border-gray-300"
                      />
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim() || isLoading}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {isLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Kategori yang Anda buat akan tersedia untuk semua resep
                  </p>
                </CardContent>
              </Card>

              {/* Suggested Categories for new users */}
              {categoryStats.length === 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">
                          Saran Kategori
                        </h4>
                        <p className="text-sm text-blue-800 mb-3">
                          Berikut beberapa kategori yang umum digunakan. Klik untuk menambahkan:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedCategories.map(category => (
                            <Button
                              key={category}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewCategoryName(category);
                                handleAddCategory();
                              }}
                              disabled={isLoading}
                              className="border-blue-200 text-blue-700 hover:bg-blue-100 text-xs"
                            >
                              + {category}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Categories List */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Daftar Kategori ({categoryStats.length})
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Kelola kategori yang sudah dibuat
                  </p>
                </CardHeader>
                <CardContent>
                  {categoryStats.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2 font-medium">Belum ada kategori</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Mulai dengan menambahkan kategori pertama Anda
                      </p>
                      <Button
                        onClick={() => setNewCategoryName('Makanan Utama')}
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Kategori Pertama
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="font-medium">Nama Kategori</TableHead>
                            <TableHead className="text-center font-medium">Jumlah Resep</TableHead>
                            <TableHead className="text-center font-medium">Status</TableHead>
                            <TableHead className="text-center font-medium">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryStats.map((category) => (
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
                                      className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600"
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
                                <Badge 
                                  variant={category.count > 0 ? "default" : "secondary"} 
                                  className={
                                    category.count > 0 
                                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200" 
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }
                                >
                                  {category.count} resep
                                </Badge>
                              </TableCell>

                              {/* Category Status */}
                              <TableCell className="text-center">
                                <Badge 
                                  variant="outline" 
                                  className="border-green-300 text-green-600 bg-green-50"
                                >
                                  User Created
                                </Badge>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-1">
                                  {/* Edit Button */}
                                  {editingCategory !== category.name && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEdit(category.name)}
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                                      title="Edit kategori"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {/* Delete Button */}
                                  {category.canDelete && editingCategory !== category.name && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setCategoryToDelete(category.name)}
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                      title="Hapus kategori"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {/* Cannot Delete Indicator */}
                                  {!category.canDelete && editingCategory !== category.name && (
                                    <div className="flex items-center gap-1 text-xs text-gray-400 px-2">
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
                <Card className="border-yellow-300 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">
                          Resep Tanpa Kategori
                        </h4>
                        <p className="text-sm text-yellow-800">
                          Ada <strong>{uncategorizedRecipes} resep</strong> yang belum dikategorikan. 
                          Buatlah kategori dan assign ke resep untuk organisasi yang lebih baik.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips for category management */}
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Tips Mengelola Kategori
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Buat kategori yang spesifik tapi tidak terlalu detail</li>
                        <li>• Gunakan nama yang mudah diingat dan konsisten</li>
                        <li>• Kategori yang tidak digunakan dapat dihapus kapan saja</li>
                        <li>• Edit kategori akan mengubah semua resep yang menggunakannya</li>
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
              {categoryToDelete && categoryStats.find(c => c.name === categoryToDelete)?.count === 0 && (
                <div className="mt-2 text-green-600 text-sm">
                  ✓ Kategori ini tidak digunakan oleh resep manapun, aman untuk dihapus.
                </div>
              )}
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