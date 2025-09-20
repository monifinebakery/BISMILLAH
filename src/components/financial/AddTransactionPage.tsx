// src/components/financial/AddTransactionPage.tsx
// Full-page add transaction interface with form validation and breadcrumbs

import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Settings, RefreshCw, AlertCircle, Save, DollarSign, Home, ArrowLeft, Receipt, Calendar, FileText } from 'lucide-react';
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

// Date input will use HTML5 date input

// Loading components
import { LoadingSpinner } from '@/components/ui/loading-spinner';
const QuickSpinner = ({ className = "" }: { className?: string }) => (
  <div className={cn("bg-gray-200 rounded", className)} />
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
                  Silakan login untuk menambah transaksi keuangan.
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

// Transaction Form Component
interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: Date;
}

const TransactionForm: React.FC<{
  onSubmit: (data: TransactionFormData) => void;
  isLoading?: boolean;
}> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get categories based on transaction type
  const availableCategories = formData.type === 'income' 
    ? DEFAULT_FINANCIAL_CATEGORIES.income 
    : DEFAULT_FINANCIAL_CATEGORIES.expense;

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Jumlah harus diisi';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Jumlah harus berupa angka positif';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Kategori harus dipilih';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    if (!formData.date) {
      newErrors.date = 'Tanggal harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, amount: value }));
      // Clear error when user starts typing
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '' // Reset category when type changes
    }));
    // Clear category error
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transaction Type */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Jenis Transaksi</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={cn(
              "p-4 border-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
              formData.type === 'expense'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="font-medium">Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={cn(
              "p-4 border-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
              formData.type === 'income'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="font-medium">Pemasukan</span>
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base font-medium">
          Jumlah <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">Rp</span>
          </div>
          <Input
            id="amount"
            type="text"
            value={formData.amount}
            onChange={handleAmountChange}
            placeholder="0"
            className={cn(
              "pl-12 text-lg",
              errors.amount && "border-red-500 focus:ring-red-500"
            )}
            disabled={isLoading}
          />
        </div>
        {errors.amount && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.amount}
          </p>
        )}
        {formData.amount && !isNaN(Number(formData.amount)) && Number(formData.amount) > 0 && (
          <p className="text-sm text-gray-600">
            {new Intl.NumberFormat('id-ID', { 
              style: 'currency', 
              currency: 'IDR' 
            }).format(Number(formData.amount))}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-base font-medium">
          Kategori <span className="text-red-500">*</span>
        </Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, category: e.target.value }));
            if (errors.category) {
              setErrors(prev => ({ ...prev, category: '' }));
            }
          }}
          className={cn(
            "w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-base",
            errors.category && "border-red-500 focus:ring-red-500"
          )}
          disabled={isLoading}
        >
          <option value="">Pilih kategori...</option>
          {availableCategories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.category}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Deskripsi <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, description: e.target.value }));
            if (errors.description) {
              setErrors(prev => ({ ...prev, description: '' }));
            }
          }}
          placeholder="Jelaskan detail transaksi..."
          rows={3}
          className={cn(
            "resize-none text-base",
            errors.description && "border-red-500 focus:ring-red-500"
          )}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-base font-medium">
          Tanggal <span className="text-red-500">*</span>
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date.toISOString().split('T')[0]}
          onChange={(e) => {
            const date = new Date(e.target.value);
            setFormData(prev => ({ ...prev, date }));
            if (errors.date) {
              setErrors(prev => ({ ...prev, date: '' }));
            }
          }}
          className={cn(
            "text-base",
            errors.date && "border-red-500 focus:ring-red-500"
          )}
          disabled={isLoading}
        />
        {errors.date && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.date}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Menyimpan...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Simpan Transaksi
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

// ✅ MAIN COMPONENT - Full page add transaction
const AddTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);

  // Navigation handlers
  const handleBack = () => {
    navigate('/laporan');
  };

  // Transaction submit handler
  const handleSubmitTransaction = async (data: TransactionFormData) => {
    setIsLoading(true);
    
    try {
      // Get the authenticated user
      const { useAuth } = await import('@/contexts/AuthContext');
      const { user } = useAuth();
      if (!user) {
        toast.error('Anda harus login terlebih dahulu');
        setIsLoading(false);
        return;
      }
      
      // Transform form data to API format
      const transactionData = {
        type: data.type,
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
        date: data.date.toISOString(),
      };
      
      // Call the financial API
      const financialApi = await import('../services/financialApi');
      await financialApi.addFinancialTransaction(transactionData, user.id);
      
      toast.success('Transaksi berhasil ditambahkan');
      navigate('/laporan');
    } catch (error: any) {
      logger.error('Failed to add transaction', error);
      toast.error('Gagal menambah transaksi: ' + (error.message || 'Silakan coba lagi'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
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
                    <Plus className="h-4 w-4 text-orange-600" />
                    Tambah Transaksi
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
                      <Plus className="w-4 h-4 text-orange-600" />
                    </div>
                    Tambah Transaksi Baru
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Catat pemasukan atau pengeluaran bisnis Anda
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Detail Transaksi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionForm 
                    onSubmit={handleSubmitTransaction} 
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              {/* Tips Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Pastikan jumlah yang dimasukkan sudah benar</p>
                    <p>• Pilih kategori yang sesuai untuk memudahkan pelaporan</p>
                    <p>• Berikan deskripsi yang jelas dan detail</p>
                    <p>• Periksa tanggal sebelum menyimpan</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏷️ Kategori Populer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">Pemasukan</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {DEFAULT_FINANCIAL_CATEGORIES.income.slice(0, 3).map((category, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            {category}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2">Pengeluaran</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {DEFAULT_FINANCIAL_CATEGORIES.expense.slice(0, 3).map((category, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            {category}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Transaksi Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Transaksi terbaru akan muncul di sini setelah Anda menyimpan transaksi
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AddTransactionPage;