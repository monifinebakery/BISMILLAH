import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { Settings, Trash2, Edit, Palette } from 'lucide-react';

// ✅ UPDATED: Color palette for categories
const CATEGORY_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const FinancialCategoryManager: React.FC = () => {
  const { settings, updateSettings } = useUserSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  // ✅ UPDATED: Generate unique ID for new categories
  const generateCategoryId = (name: string, type: string) => {
    const timestamp = Date.now();
    const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `${type}_${cleanName}_${timestamp}`;
  };

  // ✅ UPDATED: Handle add category with object structure
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Nama kategori tidak boleh kosong.");
      return;
    }

    const categories = settings?.financialCategories || { income: [], expense: [] };
    const categoryList = categories[activeTab] || [];

    // Check if category name already exists
    if (categoryList.find(cat => cat.name?.toLowerCase() === newCategory.trim().toLowerCase())) {
      toast.error(`Kategori "${newCategory.trim()}" sudah ada.`);
      return;
    }
    
    // ✅ UPDATED: Create category object instead of string
    const newCategoryObject = {
      id: generateCategoryId(newCategory.trim(), activeTab),
      name: newCategory.trim(),
      type: activeTab,
      color: selectedColor,
      isDefault: false
    };
    
    const updatedFinancialCategories = {
      ...categories,
      [activeTab]: [...categoryList, newCategoryObject],
    };
    
    const success = await updateSettings({ financialCategories: updatedFinancialCategories });
    if (success) {
      setNewCategory('');
      setSelectedColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
      toast.success('Kategori berhasil ditambahkan!');
    }
  };

  // ✅ UPDATED: Handle delete category with object structure
  const handleDeleteCategory = async (categoryToDelete: any, type: 'income' | 'expense') => {
    const categoryName = typeof categoryToDelete === 'string' ? categoryToDelete : categoryToDelete.name;
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryName}"?`)) return;
    
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const updatedFinancialCategories = {
      ...categories,
      [type]: categories[type]?.filter(cat => {
        const catId = typeof cat === 'string' ? cat : cat.id;
        const deleteId = typeof categoryToDelete === 'string' ? categoryToDelete : categoryToDelete.id;
        return catId !== deleteId;
      }) || [],
    };

    const success = await updateSettings({ financialCategories: updatedFinancialCategories });
    if (success) {
      toast.success('Kategori berhasil dihapus!');
    }
  };
  
  // ✅ UPDATED: CategoryList component with object support
  const CategoryList = ({ type }: { type: 'income' | 'expense' }) => {
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const list = categories[type] || [];
    
    return (
      <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2">
        {list.length > 0 ? list.map((cat: any) => {
          // Support both string (legacy) and object formats
          const categoryName = typeof cat === 'string' ? cat : cat.name;
          const categoryColor = typeof cat === 'object' ? cat.color : CATEGORY_COLORS[0];
          const isDefault = typeof cat === 'object' ? cat.isDefault : false;
          
          return (
            <div key={typeof cat === 'string' ? cat : cat.id} 
                 className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: categoryColor }}
                ></div>
                <span className="text-sm">{categoryName}</span>
                {isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => handleDeleteCategory(cat, type)}
                  disabled={isDefault}
                >
                  <Trash2 className={`h-4 w-4 ${isDefault ? 'text-gray-400' : 'text-destructive'}`} />
                </Button>
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada kategori.
          </p>
        )}
      </div>
    );
  };

  // ✅ NEW: Color Picker Component
  const ColorPicker = () => (
    <div className="space-y-2">
      <Label>Pilih Warna Kategori</Label>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-6 h-6 rounded-full border-2 ${
              selectedColor === color ? 'border-gray-600 scale-110' : 'border-gray-300'
            } transition-transform`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Kelola Kategori
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kelola Kategori Keuangan</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Kategori Pengeluaran</TabsTrigger>
            <TabsTrigger value="income">Kategori Pemasukan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="expense" className="space-y-4">
            <CategoryList type="expense" />
          </TabsContent>
          
          <TabsContent value="income" className="space-y-4">
            <CategoryList type="income" />
          </TabsContent>
        </Tabs>

        {/* ✅ UPDATED: Add Category Form with Color Picker */}
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 space-y-4">
          <h4 className="font-medium text-sm">
            Tambah Kategori {activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru
          </h4>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="newCategory">Nama Kategori</Label>
              <Input
                id="newCategory"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={`Contoh: ${activeTab === 'income' ? 'Komisi Penjualan' : 'Biaya Transportasi'}`}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            
            <ColorPicker />
            
            <Button 
              onClick={handleAddCategory} 
              className="w-full"
              disabled={!newCategory.trim()}
            >
              <Settings className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialCategoryManager;