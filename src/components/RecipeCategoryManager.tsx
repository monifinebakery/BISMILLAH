import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const RecipeCategoryManager = () => {
  const { settings, saveSettings } = useUserSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string; } | null>(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    const existingCategories = settings.recipeCategories || [];
    if (existingCategories.includes(newCategory.trim())) {
      toast.error('Kategori ini sudah ada');
      return;
    }

    const updatedCategories = [...existingCategories, newCategory.trim()];
    saveSettings({ ...settings, recipeCategories: updatedCategories });
    setNewCategory('');
    toast.success('Kategori berhasil ditambahkan!');
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const existingCategories = settings.recipeCategories || [];
    const updatedCategories = existingCategories.filter(cat => cat !== categoryToDelete);
    saveSettings({ ...settings, recipeCategories: updatedCategories });
    toast.success('Kategori berhasil dihapus!');
  };

  const handleStartEdit = (categoryToEdit: string) => {
    setEditingCategory({ oldName: categoryToEdit, newName: categoryToEdit });
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editingCategory.newName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (editingCategory.oldName === editingCategory.newName.trim()) {
      setEditingCategory(null);
      return;
    }
    const existingCategories = settings.recipeCategories || [];
    if (existingCategories.includes(editingCategory.newName.trim())) {
      toast.error('Kategori ini sudah ada');
      return;
    }

    const updatedCategories = existingCategories.map(cat =>
      cat === editingCategory.oldName ? editingCategory.newName.trim() : cat
    );
    saveSettings({ ...settings, recipeCategories: updatedCategories });
    setEditingCategory(null);
    toast.success('Kategori berhasil diupdate');
  };

  // Pastikan settings.recipeCategories selalu array
  const recipeCategories = settings?.recipeCategories || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SettingsIcon className="h-4 w-4 mr-2" />
          Kelola Kategori Resep
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kelola Kategori Resep</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Add New Category */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Tambah Kategori Baru</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="newCategory">Nama Kategori</Label>
              <div className="flex gap-2">
                <Input
                  id="newCategory" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Contoh: Makanan Utama"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4 mr-2" /> Tambah
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List Existing Categories */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Daftar Kategori</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recipeCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Belum ada kategori</p>
                ) : (
                  recipeCategories.map((category) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                      {editingCategory?.oldName === category ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingCategory.newName}
                            onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">Simpan</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>Batal</Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{category}</span>
                          <div className="flex items-center">
                            <Button size="icon" variant="ghost" onClick={() => handleStartEdit(category)} className="h-8 w-8">
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            
                            {/* ✨ PERBAIKAN UTAMA: Menggunakan AlertDialog untuk konfirmasi hapus */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                  <AlertDialogDescription>Tindakan ini akan menghapus kategori "{category}". Anda tidak bisa mengembalikannya.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(category)} className="bg-red-600 hover:bg-red-700">
                                    Ya, Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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