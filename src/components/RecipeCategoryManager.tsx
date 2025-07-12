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
  const [isOpen, setIsOpen] = useState(false); // State untuk mengontrol buka/tutup dialog
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{
    oldName: string;
    newName: string;
  } | null>(null); // State untuk kategori yang sedang diedit

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
    toast.success('Kategori berhasil ditambahkan!');
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    // MODIFIED: Ganti confirm() dengan modal kustom jika ini untuk lingkungan iFrame
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete}"?`)) {
      const updatedCategories = settings.recipeCategories.filter(cat => cat !== categoryToDelete);
      saveSettings({ ...settings, recipeCategories: updatedCategories });
      toast.success('Kategori berhasil dihapus!');
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
    // Cek jika nama baru sama dengan nama lama, tidak perlu update
    if (editingCategory.oldName === editingCategory.newName.trim()) {
      setEditingCategory(null);
      return;
    }
    // Cek jika nama baru sudah ada di daftar kategori (selain nama lama itu sendiri)
    if (settings.recipeCategories.includes(editingCategory.newName.trim())) {
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
        <Button variant="outline" size="sm" className="rounded-md shadow-sm transition-colors duration-200 border-gray-300 text-gray-700 hover:bg-gray-100"> {/* MODIFIED: Styling */}
          <SettingsIcon className="h-4 w-4 mr-2" />
          Kelola Kategori Resep
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto font-inter"> {/* MODIFIED: Tambahkan font-inter */}
        <DialogHeader>
          <DialogTitle>Kelola Kategori Resep</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Category */}
          <Card className="border-0 shadow-sm rounded-lg"> {/* MODIFIED: Styling */}
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Tambah Kategori Baru</CardTitle> {/* MODIFIED: Styling */}
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
                  className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500" // MODIFIED: Styling
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-colors duration-200"> {/* MODIFIED: Styling */}
                <Plus className="h-4 w-4 mr-2" /> Tambah
              </Button>
            </CardContent>
          </Card>

          {/* List Existing Categories */}
          <Card className="border-0 shadow-sm rounded-lg"> {/* MODIFIED: Styling */}
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Daftar Kategori</CardTitle> {/* MODIFIED: Styling */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settings.recipeCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Belum ada kategori resep</p>
                ) : (
                  settings.recipeCategories.map((category) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded-md bg-gray-50 shadow-sm"> {/* MODIFIED: Styling */}
                      {editingCategory?.oldName === category ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <Input
                            value={editingCategory.newName}
                            onChange={(e) => setEditingCategory({
                              ...editingCategory,
                              newName: e.target.value
                            })}
                            className="flex-1 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500" // MODIFIED: Styling
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm"> {/* MODIFIED: Styling */}
                            Simpan
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md"> {/* MODIFIED: Styling */}
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium"> {/* MODIFIED: Styling */}
                            {category}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(category)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md" // MODIFIED: Styling
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md" // MODIFIED: Styling
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
