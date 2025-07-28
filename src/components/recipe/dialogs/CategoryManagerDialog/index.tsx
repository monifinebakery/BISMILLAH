import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from 'lucide-react';
import { ButtonLoadingState } from '../../shared/components/LoadingStates';

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  onAddCategory: (name: string) => Promise<boolean>;
  onDeleteCategory: (name: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  isOpen,
  onOpenChange,
  categories,
  onAddCategory,
  onDeleteCategory,
  isLoading = false
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    const success = await onAddCategory(newCategory.trim());
    if (success) {
      setNewCategory('');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    setDeletingCategory(categoryName);
    try {
      await onDeleteCategory(categoryName);
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && newCategory.trim()) {
      handleAddCategory(e as any);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kelola Kategori Resep</DialogTitle>
          <DialogDescription>
            Tambah atau hapus kategori untuk mengorganisir resep Anda
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tambah Kategori Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <Input
                  placeholder="Contoh: Minuman Dingin"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  type="submit"
                  disabled={!newCategory.trim() || isLoading}
                >
                  {isLoading ? (
                    <ButtonLoadingState>
                      <Plus className="h-4 w-4" />
                    </ButtonLoadingState>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Daftar Kategori ({categories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.length > 0 ? (
                  categories.map(category => (
                    <div 
                      key={category} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium">{category}</span>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            disabled={deletingCategory === category}
                          >
                            {deletingCategory === category ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Kategori "{category}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Menghapus kategori tidak akan menghapus resep yang sudah ada, 
                              hanya menghilangkan kategori dari daftar.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteCategory(category)}
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
                  <div className="text-center text-gray-500 py-8">
                    <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p>Belum ada kategori</p>
                    <p className="text-sm mt-1">Tambahkan kategori pertama di atas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};