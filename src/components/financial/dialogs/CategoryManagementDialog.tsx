// src/components/financial/dialogs/CategoryManagementDialog.tsx
// Updated for JSONB object structure

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  saveSettings: (settings: any) => Promise<boolean>;
}

// ✅ UPDATED: Color palette for categories
const CATEGORY_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const CategoryManagementDialog: React.FC<CategoryManagementDialogProps> = ({
  isOpen,
  onClose,
  settings,
  saveSettings
}) => {
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [incomeColor, setIncomeColor] = useState(CATEGORY_COLORS[2]); // Green for income
  const [expenseColor, setExpenseColor] = useState(CATEGORY_COLORS[0]); // Red for expense

  // ✅ UPDATED: Generate unique ID for new categories
  const generateCategoryId = (name: string, type: string) => {
    const timestamp = Date.now();
    const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `${type}_${cleanName}_${timestamp}`;
  };

  // ✅ UPDATED: Handle add category with object structure
  const handleAddCategory = async (type: 'income' | 'expense') => {
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const newCategoryName = type === 'income' ? newIncomeCategory : newExpenseCategory;
    const selectedColor = type === 'income' ? incomeColor : expenseColor;
    const currentList = categories[type] || [];

    if (!newCategoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    // Check if category name already exists
    if (currentList.find((cat: any) => {
      const catName = typeof cat === 'string' ? cat : cat.name;
      return catName.toLowerCase() === newCategoryName.trim().toLowerCase();
    })) {
      toast.error('Kategori ini sudah ada');
      return;
    }

    // ✅ UPDATED: Create category object instead of string
    const newCategoryObject = {
      id: generateCategoryId(newCategoryName.trim(), type),
      name: newCategoryName.trim(),
      type: type,
      color: selectedColor,
      isDefault: false
    };

    const updatedList = [...currentList, newCategoryObject];
    const success = await saveSettings({
      financialCategories: { ...categories, [type]: updatedList }
    });

    if (success) {
      if (type === 'income') {
        setNewIncomeCategory('');
        setIncomeColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
      } else {
        setNewExpenseCategory('');
        setExpenseColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
      }
      toast.success('Kategori berhasil ditambahkan!');
    }
  };

  // ✅ UPDATED: Handle delete category with object structure
  const handleDeleteCategory = async (type: 'income' | 'expense', categoryToDelete: any) => {
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
    }
  };

  // ✅ UPDATED: Color Picker Component
  const ColorPicker: React.FC<{
    selectedColor: string;
    onColorChange: (color: string) => void;
  }> = ({ selectedColor, onColorChange }) => (
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

  // ✅ UPDATED: CategorySection with object support
  const CategorySection: React.FC<{
    title: string;
    type: 'income' | 'expense';
    categories: any[];
    newCategory: string;
    setNewCategory: (value: string) => void;
    selectedColor: string;
    setSelectedColor: (color: string) => void;
  }> = ({ title, type, categories, newCategory, setNewCategory, selectedColor, setSelectedColor }) => (
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
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory(type)}
          />
          <ColorPicker selectedColor={selectedColor} onColorChange={setSelectedColor} />
          <Button size="sm" onClick={() => handleAddCategory(type)} className="w-full">
            <Plus size={16} className="mr-1" />
            Tambah
          </Button>
        </div>

        {/* Categories List */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {categories.map((cat: any) => {
            // Support both string (legacy) and object formats
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
                      <Trash2 size={14} className={isDefault ? "text-gray-400" : "text-red-500"} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Kategori "{categoryName}"?</AlertDialogTitle>
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
            );
          })}
          {categories.length === 0 && (
            <p className="text-center text-gray-500 py-4 text-sm">Belum ada kategori</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Kelola Kategori Keuangan
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          <CategorySection
            title="Kategori Pemasukan"
            type="income"
            categories={settings?.financialCategories?.income || []}
            newCategory={newIncomeCategory}
            setNewCategory={setNewIncomeCategory}
            selectedColor={incomeColor}
            setSelectedColor={setIncomeColor}
          />
          <CategorySection
            title="Kategori Pengeluaran"
            type="expense"
            categories={settings?.financialCategories?.expense || []}
            newCategory={newExpenseCategory}
            setNewCategory={setNewExpenseCategory}
            selectedColor={expenseColor}
            setSelectedColor={setExpenseColor}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementDialog;