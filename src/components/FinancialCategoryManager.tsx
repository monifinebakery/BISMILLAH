import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSettings } from '@/Contexts/UserSettingsContext';
import { toast } from 'sonner'; // ✅ PERBAIKAN: Menambahkan import toast
import { Settings, Trash2, Edit } from 'lucide-react';

const FinancialCategoryManager: React.FC = () => {
  const { settings, updateSettings } = useUserSettings(); // ✅ PERBAIKAN: Menggunakan `updateSettings`
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Nama kategori tidak boleh kosong.");
      return;
    }

    const categoryList = settings.financialCategories[activeTab];

    if (categoryList.find(cat => cat.toLowerCase() === newCategory.trim().toLowerCase())) {
      toast.error(`Kategori "${newCategory.trim()}" sudah ada.`);
      return;
    }
    
    // ✅ PERBAIKAN: Menggunakan struktur data yang benar
    const updatedFinancialCategories = {
      ...settings.financialCategories,
      [activeTab]: [...categoryList, newCategory.trim()],
    };
    
    const success = await updateSettings({ financialCategories: updatedFinancialCategories });
    if (success) {
      setNewCategory('');
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string, type: 'income' | 'expense') => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete}"?`)) return;
    
    const updatedFinancialCategories = {
      ...settings.financialCategories,
      [type]: settings.financialCategories[type].filter(cat => cat !== categoryToDelete),
    };

    await updateSettings({ financialCategories: updatedFinancialCategories });
  };
  
  const CategoryList = ({ type }: { type: 'income' | 'expense' }) => {
    const list = settings.financialCategories?.[type] || [];
    return (
        <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2">
            {list.length > 0 ? list.map(cat => (
                <div key={cat} className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <span className="text-sm">{cat}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(cat, type)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">Belum ada kategori.</p>}
        </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Kelola Kategori</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Kelola Kategori Keuangan</DialogTitle></DialogHeader>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
            <TabsTrigger value="income">Pemasukan</TabsTrigger>
          </TabsList>
          <TabsContent value="expense"><CategoryList type="expense" /></TabsContent>
          <TabsContent value="income"><CategoryList type="income" /></TabsContent>
        </Tabs>
        <div className="mt-4 space-y-2">
            <Label htmlFor="newCategory">Tambah Kategori Baru</Label>
            <div className="flex gap-2">
                <Input
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder={`Kategori ${activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru`}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory}>Tambah</Button>
            </div>
        </div>
        <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialCategoryManager;