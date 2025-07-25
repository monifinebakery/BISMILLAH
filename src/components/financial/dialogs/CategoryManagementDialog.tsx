// src/components/financial/dialogs/CategoryManagementDialog.tsx
// Separated Category Management Dialog for Code Splitting

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  saveSettings: (settings: any) => Promise<boolean>;
}

const CategoryManagementDialog: React.FC<CategoryManagementDialogProps> = ({
  isOpen,
  onClose,
  settings,
  saveSettings
}) => {
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');

  const handleAddCategory = async (type: 'income' | 'expense') => {
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const newCategory = type === 'income' ? newIncomeCategory : newExpenseCategory;
    const currentList = categories[type] || [];

    if (!newCategory.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    if (currentList.map(c => c.toLowerCase()).includes(newCategory.trim().toLowerCase())) {
      toast.error('Kategori ini sudah ada');
      return;
    }

    const updatedList = [...currentList, newCategory.trim()];
    const success = await saveSettings({
      financialCategories: { ...categories, [type]: updatedList }
    });

    if (success) {
      if (type === 'income') {
        setNewIncomeCategory('');
      } else {
        setNewExpenseCategory('');
      }
      toast.success('Kategori berhasil ditambahkan!');
    }
  };

  const handleDeleteCategory = async (type: 'income' | 'expense', categoryToDelete: string) => {
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const updatedList = (categories[type] || []).filter(cat => cat !== categoryToDelete);
    
    const success = await saveSettings({
      financialCategories: { ...categories, [type]: updatedList }
    });

    if (success) {
      toast.success('Kategori berhasil dihapus!');
    }
  };

  const CategorySection: React.FC<{
    title: string;
    type: 'income' | 'expense';
    categories: string[];
    newCategory: string;
    setNewCategory: (value: string) => void;
  }> = ({ title, type, categories, newCategory, setNewCategory }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Kategori baru..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory(type)}
          />
          <Button size="sm" onClick={() => handleAddCategory(type)}>
            <Plus size={16} />
          </Button>
        </div>
        <div className="space-y-1 pt-2 max-h-48 overflow-y-auto">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-100"
            >
              <p>{cat}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Kategori "{cat}"?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteCategory(type, cat)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kelola Kategori Keuangan</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
          <CategorySection
            title="Kategori Pemasukan"
            type="income"
            categories={settings?.financialCategories?.income || []}
            newCategory={newIncomeCategory}
            setNewCategory={setNewIncomeCategory}
          />
          <CategorySection
            title="Kategori Pengeluaran"
            type="expense"
            categories={settings?.financialCategories?.expense || []}
            newCategory={newExpenseCategory}
            setNewCategory={setNewExpenseCategory}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementDialog;