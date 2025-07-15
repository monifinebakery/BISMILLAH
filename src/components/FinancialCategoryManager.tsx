import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';
// MODIFIED: Impor useUserSettings
import { useUserSettings } from '@/hooks/useUserSettings';

// MODIFIED: Hapus interface FinancialCategoryManagerProps
// interface FinancialCategoryManagerProps {
//   categories: { income: string[]; expense: string[] };
//   onUpdateCategories: (categories: { income: string[]; expense: string[] }) => void;
// }

// MODIFIED: Hapus props 'categories' dan 'onUpdateCategories'
const FinancialCategoryManager: React.FC = () => {
  // MODIFIED: Panggil useUserSettings hook
  const { settings, saveSettings } = useUserSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('income');
  const [editingCategory, setEditingCategory] = useState<{
    type: 'income' | 'expense';
    oldName: string;
    newName: string;
  } | null>(null);

  const addCategory = async () => { // MODIFIED: Make async
    if (!newCategory.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    // MODIFIED: Gunakan settings.financialCategories
    const updatedCategories = {
      ...settings.financialCategories,
      [categoryType]: [...settings.financialCategories[categoryType], newCategory.trim()],
    };

    // MODIFIED: Panggil saveSettings
    const success = await saveSettings({ ...settings, financialCategories: updatedCategories });
    if (success) {
      setNewCategory('');
      toast.success('Kategori berhasil ditambahkan');
    } else {
      toast.error('Gagal menambahkan kategori');
    }
  };

  const deleteCategory = async (type: 'income' | 'expense', categoryName: string) => { // MODIFIED: Make async
    // MODIFIED: Gunakan settings.financialCategories
    const updatedCategories = {
      ...settings.financialCategories,
      [type]: settings.financialCategories[type].filter(cat => cat !== categoryName),
    };

    // MODIFIED: Panggil saveSettings
    const success = await saveSettings({ ...settings, financialCategories: updatedCategories });
    if (success) {
      toast.success('Kategori berhasil dihapus');
    } else {
      toast.error('Gagal menghapus kategori');
    }
  };

  const startEditCategory = (type: 'income' | 'expense', categoryName: string) => {
    setEditingCategory({
      type,
      oldName: categoryName,
      newName: categoryName,
    });
  };

  const saveEditCategory = async () => { // MODIFIED: Make async
    if (!editingCategory || !editingCategory.newName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    // MODIFIED: Gunakan settings.financialCategories
    const updatedCategories = {
      ...settings.financialCategories,
      [editingCategory.type]: settings.financialCategories[editingCategory.type].map(cat =>
        cat === editingCategory.oldName ? editingCategory.newName.trim() : cat
      ),
    };

    // MODIFIED: Panggil saveSettings
    const success = await saveSettings({ ...settings, financialCategories: updatedCategories });
    if (success) {
      setEditingCategory(null);
      toast.success('Kategori berhasil diupdate');
    } else {
      toast.error('Gagal mengupdate kategori');
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Kelola Kategori
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kelola Kategori Keuangan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tambah Kategori Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryType">Jenis Kategori</Label>
                  <Select value={categoryType} onValueChange={(value: 'income' | 'expense') => setCategoryType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Pemasukan</SelectItem>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="newCategory">Nama Kategori</Label>
                  <Input
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Masukkan nama kategori"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                </div>
              </div>
              <Button onClick={addCategory} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </CardContent>
          </Card>

          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">Kategori Pemasukan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* MODIFIED: Gunakan settings.financialCategories.income */}
                {settings.financialCategories.income.map((category) => (
                  <div key={category} className="flex items-center justify-between p-2 border rounded">
                    {editingCategory?.type === 'income' && editingCategory.oldName === category ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          value={editingCategory.newName}
                          onChange={(e) => setEditingCategory({
                            ...editingCategory,
                            newName: e.target.value
                          })}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                        />
                        <Button size="sm" onClick={saveEditCategory}>
                          Simpan
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {category}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditCategory('income', category)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCategory('income', category)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {/* MODIFIED: Gunakan settings.financialCategories.income */}
                {settings.financialCategories.income.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Belum ada kategori pemasukan</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Kategori Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* MODIFIED: Gunakan settings.financialCategories.expense */}
                {settings.financialCategories.expense.map((category) => (
                  <div key={category} className="flex items-center justify-between p-2 border rounded">
                    {editingCategory?.type === 'expense' && editingCategory.oldName === category ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          value={editingCategory.newName}
                          onChange={(e) => setEditingCategory({
                            ...editingCategory,
                            newName: e.target.value
                          })}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                        />
                        <Button size="sm" onClick={saveEditCategory}>
                          Simpan
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {category}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditCategory('expense', category)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCategory('expense', category)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {/* MODIFIED: Gunakan settings.financialCategories.expense */}
                {settings.financialCategories.expense.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Belum ada kategori pengeluaran</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialCategoryManager;