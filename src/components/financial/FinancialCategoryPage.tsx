// src/components/financial/FinancialCategoryPage.tsx
// Full-page financial category management with breadcrumbs and CRUD operations

import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, RefreshCw, AlertCircle, Edit2, Trash2, DollarSign, Home, ArrowLeft, Tags, Receipt } from 'lucide-react';
import { toast } from 'sonner';

// Import Breadcrumb components
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// UI utilities
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';

// Auth Context
import { useAuth } from '@/contexts/AuthContext';

// Financial categories
import { DEFAULT_FINANCIAL_CATEGORIES } from './types/financial';

// Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Loading components
const QuickSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={cn("bg-gray-200 rounded animate-pulse", className)} />
);

// ✅ SIMPLIFIED Auth Guard Component
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-yellow-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-medium">Login Diperlukan</h3>
                <p className="text-sm text-yellow-500 mt-1">
                  Silakan login untuk mengakses kategori keuangan Anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

// Category Item Component
interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    description?: string;
    isDefault?: boolean;
  };
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onEdit, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete(category.id);
    setShowDeleteDialog(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-3 h-3 rounded-full",
          category.type === 'income' ? 'bg-green-500' : 'bg-red-500'
        )} />
        <div>
          <h3 className="font-medium text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-gray-500">{category.description}</p>
          )}
          {category.isDefault && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
              Default
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(category)}
          disabled={category.isDefault}
          className="flex items-center gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
        
        {!category.isDefault && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus kategori "{category.name}"? 
                    Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
};

// Add Category Dialog Component
interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (category: { name: string; type: 'income' | 'expense'; description: string }) => void;
  editingCategory?: any;
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({ 
  open, 
  onOpenChange, 
  onAdd,
  editingCategory 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    description: ''
  });

  React.useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        type: editingCategory.type,
        description: editingCategory.description || ''
      });
    } else {
      setFormData({ name: '', type: 'expense', description: '' });
    }
  }, [editingCategory, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama kategori harus diisi');
      return;
    }
    onAdd(formData);
    onOpenChange(false);
    setFormData({ name: '', type: 'expense', description: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </DialogTitle>
          <DialogDescription>
            {editingCategory ? 'Ubah informasi kategori' : 'Buat kategori baru untuk mengorganisir transaksi Anda'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kategori</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Masukkan nama kategori..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsi kategori..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ✅ MAIN COMPONENT - Full page financial category management
const FinancialCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State management
  const [categories, setCategories] = useState(() => {
    // Initialize with default categories
    const incomeCategories = DEFAULT_FINANCIAL_CATEGORIES.income.map((name, index) => ({
      id: `income-${index}`,
      name,
      type: 'income' as const,
      isDefault: true
    }));
    
    const expenseCategories = DEFAULT_FINANCIAL_CATEGORIES.expense.map((name, index) => ({
      id: `expense-${index}`,
      name,
      type: 'expense' as const,
      isDefault: true
    }));
    
    return [...incomeCategories, ...expenseCategories];
  });

  const [activeTab, setActiveTab] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Navigation handlers
  const handleBack = () => {
    navigate('/laporan');
  };

  // Category management handlers
  const handleAddCategory = (categoryData: any) => {
    const newCategory = {
      id: `custom-${Date.now()}`,
      ...categoryData,
      isDefault: false
    };
    setCategories(prev => [...prev, newCategory]);
    toast.success('Kategori berhasil ditambahkan');
  };

  const handleEditCategory = (category: any) => {
    if (category.isDefault) {
      toast.error('Kategori default tidak dapat diedit');
      return;
    }
    setEditingCategory(category);
    setShowAddDialog(true);
  };

  const handleUpdateCategory = (categoryData: any) => {
    if (!editingCategory) return;
    
    setCategories(prev => 
      prev.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...categoryData }
          : cat
      )
    );
    setEditingCategory(null);
    toast.success('Kategori berhasil diperbarui');
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (category?.isDefault) {
      toast.error('Kategori default tidak dapat dihapus');
      return;
    }
    
    setCategories(prev => prev.filter(cat => cat.id !== id));
    toast.success('Kategori berhasil dihapus');
  };

  // Filter categories based on active tab
  const filteredCategories = categories.filter(category => {
    if (activeTab === 'all') return true;
    if (activeTab === 'income') return category.type === 'income';
    if (activeTab === 'expense') return category.type === 'expense';
    if (activeTab === 'custom') return !category.isDefault;
    return true;
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header with Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                      <Home className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Dashboard</span>
                    </Button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Keuangan</span>
                    </Button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-orange-600" />
                    Kategori
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Title */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Kembali</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Tags className="w-4 h-4 text-orange-600" />
                    </div>
                    Manajemen Kategori Keuangan
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Kelola kategori pemasukan dan pengeluaran untuk mengorganisir transaksi
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowAddDialog(true);
                  }}
                  size="sm"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tambah Kategori</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-orange-600" />
                  Daftar Kategori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Semua</span>
                    </TabsTrigger>
                    <TabsTrigger value="income" className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="hidden sm:inline">Pemasukan</span>
                    </TabsTrigger>
                    <TabsTrigger value="expense" className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="hidden sm:inline">Pengeluaran</span>
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Custom</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    {filteredCategories.length > 0 ? (
                      <div className="space-y-3">
                        {filteredCategories.map(category => (
                          <CategoryItem
                            key={category.id}
                            category={category}
                            onEdit={handleEditCategory}
                            onDelete={handleDeleteCategory}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Tidak ada kategori
                        </h3>
                        <p className="text-gray-500">
                          {activeTab === 'custom' 
                            ? 'Belum ada kategori custom yang dibuat'
                            : 'Tidak ada kategori yang sesuai dengan filter'
                          }
                        </p>
                        {activeTab === 'custom' && (
                          <Button
                            onClick={() => {
                              setEditingCategory(null);
                              setShowAddDialog(true);
                            }}
                            className="mt-4"
                          >
                            Buat Kategori Pertama
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Tags className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Kategori</p>
                      <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 bg-green-500 rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pemasukan</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {categories.filter(c => c.type === 'income').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 bg-red-500 rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pengeluaran</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {categories.filter(c => c.type === 'expense').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Custom</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {categories.filter(c => !c.isDefault).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Add/Edit Category Dialog */}
        <AddCategoryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={editingCategory ? handleUpdateCategory : handleAddCategory}
          editingCategory={editingCategory}
        />
      </div>
    </AuthGuard>
  );
};

export default FinancialCategoryPage;