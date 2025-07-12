// src/components/RecipeCategoryManager.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUserSettings } from '@/hooks/useUserSettings';

const RecipeCategoryManager = () => {
  const { settings, saveSettings } = useUserSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{
    oldName: string;
    newName: string;
  } | null>(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (settings.recipeCategories.includes(newCategory.trim())) {
      toast.error('Kategori ini sudah ada');
      return;
    }

    const updatedCategories = [...settings.recipeCategories, newCategory.trim()];
    saveSettings({ ...settings, recipeCategories: updatedCategories });
    setNewCategory('');
    toast.success('Kategori berhasil ditambahkan');
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete}"?`)) {
      const updatedCategories = settings.recipeCategories.filter(cat => cat !== categoryToDelete);
      saveSettings({ ...settings, recipeCategories: updatedCategories });
      toast.success('Kategori berhasil dihapus');
    }
  };

  const handleStartEdit = (categoryToEdit: string) => {
    setEditingCategory({ oldName: categoryToEdit, newName: categoryToEdit });
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editingCategory.newName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (editingCategory.oldName !== editingCategory.newName.trim() && settings.recipeCategories.includes(editingCategory.newName.trim())) {
      toast.error('Kategori ini sudah ada');
      return;
    }

    const updatedCategories = settings.recipeCategories.map(cat =>
      cat === editingCategory.oldName ? editingCategory.newName.trim() : cat
    );
    saveSettings({ ...settings, recipeCategories: updatedCategories });
    setEditingCategory(null);
    toast.success('Kategori berhasil diupdate');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SettingsIcon className="h-4 w-4 mr-2" />
          Kelola Kategori Resep
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kelola Kategori Resep</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tambah Kategori Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newCategory">Nama Kategori</Label>
                <Input
                  id="newCategory"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Masukkan nama kategori baru"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </CardContent>
          </Card>

          {/* List Existing Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settings.recipeCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Belum ada kategori resep</p>
                ) : (
                  settings.recipeCategories.map((category) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded">
                      {editingCategory?.oldName === category ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <Input
                            value={editingCategory.newName}
                            onChange={(e) => setEditingCategory({
                              ...editingCategory,
                              newName: e.target.value
                            })}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <Button size="sm" onClick={handleSaveEdit}>
                            Simpan
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {category}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(category)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeCategoryManager;
