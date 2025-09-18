// src/components/financial/FinancialManagementPage.tsx
// Full-page financial management with breadcrumbs and modern tabbed interface

import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, RefreshCw, AlertCircle, TrendingUp, DollarSign, Receipt, Home, ArrowLeft } from 'lucide-react';
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

// ✅ CLEAN IMPORTS - Using consolidated hooks
import { useFinancialCore } from './hooks/useFinancialCore';
import { useFinancialPage } from './hooks/useFinancialPages';
import { useFinancialChartDataProcessing } from './hooks/useFinancialData';
import { DEFAULT_FINANCIAL_CATEGORIES } from './types/financial';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useTransactionTable } from './hooks/useTransactionTable';

// LAZY LOADED COMPONENTS - Consistent approach with proper error handling
const TransactionTable = React.lazy(() => 
  import('./components/TransactionTable').catch((error) => {
    logger.error('Failed to load TransactionTable', error);
    return {
      default: () => (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-medium text-red-700 mb-1">Gagal Memuat Tabel</h3>
            <p className="text-sm text-red-500">Terjadi kesalahan saat memuat tabel transaksi.</p>
          </CardContent>
        </Card>
      )
    };
  })
);

const FinancialTransactionDialog = React.lazy(() => 
  import('./dialogs/FinancialTransactionDialog').catch((error) => {
    logger.error('Failed to load FinancialTransactionDialog', error);
    return { default: () => null };
  })
);

const CategoryManagementDialog = React.lazy(() => 
  import('./dialogs/CategoryManagementDialog').catch((error) => {
    logger.error('Failed to load CategoryManagementDialog', error);
    return { default: () => null };
  })
);

const BulkActions = React.lazy(() => 
  import('./components/BulkActions').catch((error) => {
    logger.error('Failed to load BulkActions', error);
    return { default: () => null };
  })
);

const UMKMExpenseCategories = React.lazy(() => 
  import('./components/UMKMExpenseCategories').catch((error) => {
    logger.error('Failed to load UMKMExpenseCategories component:', error);
    return { default: () => <div className="p-4 text-center text-red-500">Gagal memuat kategori pengeluaran UMKM</div> };
  })
);

// Loading components
const QuickSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={cn("bg-gray-200 rounded animate-pulse", className)} />
);

// ✅ ENHANCED Summary Cards Component - With auto-refresh feedback
const SummaryCards: React.FC<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  lastRefresh?: Date | null;
  onRefresh?: () => void;
}> = ({ totalIncome, totalExpense, balance, isLoading, isRefreshing, lastRefresh, onRefresh }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  const cards = [
    {
      title: 'Total Pemasukan',
      value: totalIncome,
      color: 'green',
      icon: TrendingUp,
      description: 'Jumlah seluruh pemasukan yang tercatat'
    },
    {
      title: 'Total Pengeluaran',
      value: totalExpense,
      color: 'red',
      icon: TrendingUp,
      iconRotate: true,
      description: 'Jumlah seluruh pengeluaran yang tercatat'
    },
    {
      title: 'Saldo Akhir',
      value: balance,
      color: balance >= 0 ? 'green' : 'red',
      icon: TrendingUp,
      description: 'Selisih antara pemasukan dan pengeluaran'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="border-l-4 border-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <card.icon className={cn(
                  "h-4 w-4",
                  card.iconRotate && "rotate-180"
                )} />
                {card.title}
              </CardTitle>
              {index === 0 && onRefresh && (
                <div className="flex items-center gap-2">
                  {lastRefresh && (
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {new Date(lastRefresh).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onRefresh} 
                    disabled={isLoading || isRefreshing}
                    className={cn(
                      "transition-colors",
                      isRefreshing && "text-orange-600"
                    )}
                  >
                    <RefreshCw className={cn(
                      "h-3 w-3",
                      (isLoading || isRefreshing) && "animate-spin"
                    )} />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-xl md:text-2xl font-bold",
              card.color === 'green' ? 'text-green-600' : 'text-red-600'
            )}>
              {isLoading ? <QuickSkeleton className="h-8 w-24" /> : formatCurrency(card.value)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isLoading ? <QuickSkeleton className="h-4 w-32" /> : card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ✅ SIMPLIFIED Error Display Component
const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 text-red-600">
        <AlertCircle className="h-6 w-6" />
        <div>
          <h3 className="font-medium">Gagal Memuat Data</h3>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
      </div>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        <RefreshCw className="mr-2 h-4 w-4" />
        Coba Lagi
      </Button>
    </CardContent>
  </Card>
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
                  Silakan login untuk mengakses data keuangan Anda.
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

// ✅ MAIN COMPONENT - Full page financial management
const FinancialManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // ✅ SINGLE HOOK - All functionality consolidated with auto-refresh
  const {
    // Data
    filteredTransactions,
    totalIncome,
    totalExpense,
    balance,
    dateRange,
    
    // State
    isLoading,
    isRefreshing,
    lastRefresh,
    hasTransactions,
    
    // Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setDateRange,
    
    // Refresh operations
    refresh,
    forceRefresh,
    
    // Settings
    settings,
    saveSettings
  } = useFinancialCore();

  // ✅ CHART DATA - Single hook
  const chartData = useFinancialChartDataProcessing(filteredTransactions);

  // ✅ BULK OPERATIONS - Transaction table hook
  const transactionTable = useTransactionTable(filteredTransactions);

  // ✅ STATE - Dialogs and active tab
  const [activeTab, setActiveTab] = useState('transactions');
  const [dialogs, setDialogs] = useState({
    transaction: { isOpen: false, editing: null as any },
    category: { isOpen: false }
  });

  // Navigation handlers
  const handleBack = () => {
    navigate('/');
  };

  const handleNavigateToCategory = () => {
    navigate('/keuangan/kategori');
  };

  const handleNavigateToAddTransaction = () => {
    navigate('/keuangan/tambah');
  };

  // ✅ DIALOG HANDLERS
  const openTransactionDialog = (transaction: any = null) => {
    logger.debug('Opening transaction dialog', { editing: !!transaction });
    setDialogs(prev => ({
      ...prev,
      transaction: { isOpen: true, editing: transaction }
    }));
  };

  const closeTransactionDialog = () => {
    logger.debug('Closing transaction dialog');
    setDialogs(prev => ({
      ...prev,
      transaction: { isOpen: false, editing: null }
    }));
  };

  const openCategoryDialog = () => {
    logger.debug('Opening category dialog');
    setDialogs(prev => ({ ...prev, category: { isOpen: true } }));
  };

  const closeCategoryDialog = () => {
    logger.debug('Closing category dialog');
    setDialogs(prev => ({ ...prev, category: { isOpen: false } }));
  };

  // ✅ TRANSACTION HANDLERS
  const handleAddTransaction = async (transactionData: any) => {
    try {
      logger.info('Adding new transaction', { transactionData });
      const result = await addTransaction(transactionData);
      if (result.success) {
        closeTransactionDialog();
        toast.success('Transaksi berhasil ditambahkan');
        logger.info('Transaction added successfully');
        return true;
      } else {
        toast.error(result.error || 'Gagal menambah transaksi');
        logger.error('Failed to add transaction', { error: result.error });
        return false;
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan');
      logger.error('Exception while adding transaction', error);
      return false;
    }
  };

  const handleUpdateTransaction = async (id: string, transactionData: any) => {
    try {
      logger.info('Updating transaction', { id, transactionData });
      const result = await updateTransaction(id, transactionData);
      if (result.success) {
        closeTransactionDialog();
        toast.success('Transaksi berhasil diperbarui');
        logger.info('Transaction updated successfully', { id });
        return true;
      } else {
        toast.error(result.error || 'Gagal memperbarui transaksi');
        logger.error('Failed to update transaction', { id, error: result.error });
        return false;
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan');
      logger.error('Exception while updating transaction', error);
      return false;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      logger.info('Deleting transaction', { id });
      const result = await deleteTransaction(id);
      if (result.success) {
        toast.success('Transaksi berhasil dihapus');
        logger.info('Transaction deleted successfully', { id });
        return true;
      } else {
        toast.error(result.error || 'Gagal menghapus transaksi');
        logger.error('Failed to delete transaction', { id, error: result.error });
        return false;
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan');
      logger.error('Exception while deleting transaction', error);
      return false;
    }
  };

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
                  <BreadcrumbPage className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    Manajemen Keuangan
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
                      <DollarSign className="w-4 h-4 text-orange-600" />
                    </div>
                    Manajemen Keuangan
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Kelola transaksi keuangan, kategori, dan laporan bisnis Anda
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/keuangan/kategori')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Kategori</span>
                </Button>
                
                <Button
                  onClick={() => navigate('/keuangan/tambah')}
                  size="sm"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tambah Transaksi</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <SummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            lastRefresh={lastRefresh}
            onRefresh={forceRefresh}
          />

          {/* Main Content */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Transaksi</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Kategori</span>
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Actions</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-orange-600" />
                      Daftar Transaksi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<div className="p-8 text-center">Memuat tabel transaksi...</div>}>
                      <TransactionTable
                        transactions={filteredTransactions}
                        onEdit={openTransactionDialog}
                        onDelete={handleDeleteTransaction}
                        isLoading={isLoading}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-600" />
                      Kategori UMKM
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<div className="p-8 text-center">Memuat kategori...</div>}>
                      <UMKMExpenseCategories />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-orange-600" />
                      Bulk Operations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<div className="p-8 text-center">Memuat bulk actions...</div>}>
                      <BulkActions
                        transactions={filteredTransactions}
                        selectedIds={transactionTable.selectedIds}
                        onSelectionChange={transactionTable.handleSelectionChange}
                        onBulkDelete={(ids) => Promise.all(ids.map(id => handleDeleteTransaction(id)))}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Lazy loaded dialogs */}
        <Suspense fallback={null}>
          {dialogs.transaction.isOpen && (
            <FinancialTransactionDialog
              isOpen={dialogs.transaction.isOpen}
              onClose={closeTransactionDialog}
              editingTransaction={dialogs.transaction.editing}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              mode={dialogs.transaction.editing ? 'edit' : 'add'}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {dialogs.category.isOpen && (
            <CategoryManagementDialog
              isOpen={dialogs.category.isOpen}
              onClose={closeCategoryDialog}
            />
          )}
        </Suspense>
      </div>
    </AuthGuard>
  );
};

export default FinancialManagementPage;