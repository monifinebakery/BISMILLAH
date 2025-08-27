// src/components/financial/dialogs/CategoryManagementDialog.tsx
// Optimized to prevent lag when typing in category inputs

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  saveSettings: (settings: any) => Promise<boolean>;
  refreshSettings?: () => void;
}

// Color palette for categories
const CATEGORY_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => (
  <div className="flex flex-wrap gap-1 mt-2">
    {CATEGORY_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        className={`w-5 h-5 rounded-full border ${
          selectedColor === color ? 'border-gray-600 scale-110' : 'border-gray-300'
        } transition-transform`}
        style={{ backgroundColor: color }}
        onClick={() => onColorChange(color)}
      />
    ))}
  </div>
);

interface CategorySectionProps {
  title: string;
  categories: any[];
  newCategory: string;
  setNewCategory: (value: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (category: any) => void;
}

const CategorySection: React.FC<CategorySectionProps> = React.memo(({
  title,
  categories,
  newCategory,
  setNewCategory,
  selectedColor,
  setSelectedColor,
  onAddCategory,
  onDeleteCategory
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {/* Add Category Form */}
      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
        <Input
          placeholder="Kategori baru..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAddCategory()}
        />
        <ColorPicker selectedColor={selectedColor} onColorChange={setSelectedColor} />
        <Button size="sm" onClick={onAddCategory} className="w-full">
          <Plus size={16} className="mr-1" />
          Tambah
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {categories.map((cat: any) => {
          const categoryName = typeof cat === 'string' ? cat : cat.name;
          const categoryColor = typeof cat === 'object' ? cat.color : CATEGORY_COLORS[0];
          const isDefault = typeof cat === 'object' ? cat.isDefault : false;

          return (
            <div
              key={typeof cat === 'string' ? cat : cat.id}
              className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: categoryColor }}
                ></div>
                <span>{categoryName}</span>
                {isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isDefault}
                  >
                    <Trash2 size={14} className={isDefault ? 'text-gray-400' : 'text-red-500'} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Kategori "{categoryName}"?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteCategory(cat)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">Belum ada kategori</p>
        )}
      </div>
    </CardContent>
  </Card>
));
CategorySection.displayName = 'CategorySection';

const CategoryManagementDialog: React.FC<CategoryManagementDialogProps> = ({
  isOpen,
  onClose,
  settings,
  saveSettings,
  refreshSettings
}) => {
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [incomeColor, setIncomeColor] = useState(CATEGORY_COLORS[2]);
  const [expenseColor, setExpenseColor] = useState(CATEGORY_COLORS[0]);

  // Reset form when dialog opens or settings change
  useEffect(() => {
    if (isOpen) {
      setNewIncomeCategory('');
      setNewExpenseCategory('');
      setIncomeColor(CATEGORY_COLORS[2]);
      setExpenseColor(CATEGORY_COLORS[0]);
    }
  }, [isOpen, settings]);

  const generateCategoryId = (name: string, type: string) => {
    const timestamp = Date.now();
    const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `${type}_${cleanName}_${timestamp}`;
  };

  const addCategory = useCallback(
    async (
      type: 'income' | 'expense',
      name: string,
      color: string,
      reset: () => void
    ) => {
      const categories = settings?.financialCategories || { income: [], expense: [] };
      const currentList = categories[type] || [];

      if (!name.trim()) {
        toast.error('Nama kategori tidak boleh kosong');
        return;
      }

      if (
        currentList.find((cat: any) => {
          const catName = typeof cat === 'string' ? cat : cat.name;
          return catName.toLowerCase() === name.trim().toLowerCase();
        })
      ) {
        toast.error('Kategori ini sudah ada');
        return;
      }

      const newCategoryObject = {
        id: generateCategoryId(name.trim(), type),
        name: name.trim(),
        type,
        color,
        isDefault: false
      };

      const updatedList = [...currentList, newCategoryObject];
      const success = await saveSettings({
        financialCategories: { ...categories, [type]: updatedList }
      });

      if (success) {
        reset();
        toast.success('Kategori berhasil ditambahkan!');
        // Refresh settings to ensure UI updates
        if (refreshSettings) {
          refreshSettings();
        }
      }
    },
    [settings, saveSettings, refreshSettings]
  );

  const deleteCategory = useCallback(
    async (type: 'income' | 'expense', categoryToDelete: any) => {
      const categories = settings?.financialCategories || { income: [], expense: [] };

      const updatedList = (categories[type] || []).filter((cat: any) => {
        const catId = typeof cat === 'string' ? cat : cat.id;
        const deleteId = typeof categoryToDelete === 'string' ? categoryToDelete : categoryToDelete.id;
        return catId !== deleteId;
      });

      const success = await saveSettings({
        financialCategories: { ...categories, [type]: updatedList }
      });

      if (success) {
        toast.success('Kategori berhasil dihapus!');
        // Refresh settings to ensure UI updates
        if (refreshSettings) {
          refreshSettings();
        }
      }
    },
    [settings, saveSettings, refreshSettings]
  );

  const handleAddIncomeCategory = useCallback(() => {
    addCategory('income', newIncomeCategory, incomeColor, () => {
      setNewIncomeCategory('');
      setIncomeColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    });
  }, [addCategory, newIncomeCategory, incomeColor]);

  const handleAddExpenseCategory = useCallback(() => {
    addCategory('expense', newExpenseCategory, expenseColor, () => {
      setNewExpenseCategory('');
      setExpenseColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    });
  }, [addCategory, newExpenseCategory, expenseColor]);

  const handleDeleteIncomeCategory = useCallback(
    (cat: any) => deleteCategory('income', cat),
    [deleteCategory]
  );

  const handleDeleteExpenseCategory = useCallback(
    (cat: any) => deleteCategory('expense', cat),
    [deleteCategory]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Reset form when closing
        setNewIncomeCategory('');
        setNewExpenseCategory('');
        setIncomeColor(CATEGORY_COLORS[2]);
        setExpenseColor(CATEGORY_COLORS[0]);
      }
      onClose();
    }}>
      <DialogContent centerMode="overlay" className="dialog-overlay-center">
        <div className="dialog-panel max-w-4xl max-h-[90vh]">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Kelola Kategori Keuangan
            </DialogTitle>
          </DialogHeader>
          <div className="dialog-body overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          <CategorySection
            title="Kategori Pemasukan"
            categories={settings?.financialCategories?.income || []}
            newCategory={newIncomeCategory}
            setNewCategory={setNewIncomeCategory}
            selectedColor={incomeColor}
            setSelectedColor={setIncomeColor}
            onAddCategory={handleAddIncomeCategory}
            onDeleteCategory={handleDeleteIncomeCategory}
          />
          <CategorySection
            title="Kategori Pengeluaran"
            categories={settings?.financialCategories?.expense || []}
            newCategory={newExpenseCategory}
            setNewCategory={setNewExpenseCategory}
            selectedColor={expenseColor}
            setSelectedColor={setExpenseColor}
            onAddCategory={handleAddExpenseCategory}
            onDeleteCategory={handleDeleteExpenseCategory}
          />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementDialog;

