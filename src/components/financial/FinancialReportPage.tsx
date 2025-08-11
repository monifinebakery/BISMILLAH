// src/components/financial/FinancialReportPage.tsx
// ✅ CLEAN VERSION - Using existing DateRangePicker component

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// UI utilities
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Auth Context
import { useAuth } from '@/contexts/AuthContext';

// ✅ EXISTING COMPONENTS - Reuse what's already available
import DateRangePicker from '@/components/ui/DateRangePicker';

// ✅ CLEAN IMPORTS - Using consolidated hooks
import { useFinancialCore } from './hooks/useFinancialCore';
import { useFinancialChartData } from './hooks/useFinancialData';
import { DEFAULT_FINANCIAL_CATEGORIES } from './types/financial';

// LAZY LOADED COMPONENTS
const FinancialCharts = React.lazy(() => 
  import('./components/FinancialCharts').catch(() => ({
    default: () => <div className="p-4 text-center text-red-500">Gagal memuat chart</div>
  }))
);

const CategoryCharts = React.lazy(() => 
  import('./components/CategoryCharts').catch(() => ({
    default: () => <div className="p-4 text-center text-red-500">Gagal memuat kategori chart</div>
  }))
);

const TransactionTable = React.lazy(() => 
  import('./components/TransactionTable').catch(() => ({
    default: () => <div className="p-4 text-center text-red-500">Gagal memuat tabel</div>
  }))
);

const FinancialTransactionDialog = React.lazy(() => 
  import('./dialogs/FinancialTransactionDialog').catch(() => ({
    default: () => null
  }))
);

const CategoryManagementDialog = React.lazy(() => 
  import('./dialogs/CategoryManagementDialog').catch(() => ({
    default: () => null
  }))
);

// Loading components
const QuickSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={cn("bg-gray-200 rounded animate-pulse", className)} />
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader><QuickSkeleton className="h-6 w-1/3" /></CardHeader>
    <CardContent><QuickSkeleton className="h-64 md:h-80" /></CardContent>
  </Card>
);

// ✅ SIMPLIFIED Summary Cards Component
const SummaryCards: React.FC<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}> = ({ totalIncome, totalExpense, balance, isLoading, onRefresh }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  const cards = [
    { title: 'Total Pemasukan', value: totalIncome, color: 'green' },
    { title: 'Total Pengeluaran', value: totalExpense, color: 'red' },
    { title: 'Saldo Akhir', value: balance, color: balance >= 0 ? 'green' : 'red' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{card.title}</CardTitle>
              {index === 0 && onRefresh && (
                <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
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

// ✅ MAIN COMPONENT - MUCH SIMPLIFIED WITH EXISTING DateRangePicker
const FinancialReportPage: React.FC = () => {
  const isMobile = useIsMobile();
  
  // ✅ SINGLE HOOK - All functionality consolidated
  const {
    // Data
    filteredTransactions,
    totalIncome,
    totalExpense,
    balance,
    dateRange,
    
    // State
    isLoading,
    hasTransactions,
    
    // Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setDateRange,
    
    // Settings
    settings
  } = useFinancialCore();

  // ✅ CHART DATA - Single hook
  const chartData = useFinancialChartData(filteredTransactions);

  // ✅ SIMPLE STATE - Just dialogs
  const [dialogs, setDialogs] = useState({
    transaction: { isOpen: false, editing: null as any },
    category: { isOpen: false }
  });

  // ✅ SIMPLE HANDLERS
  const openTransactionDialog = (transaction: any = null) => {
    setDialogs(prev => ({
      ...prev,
      transaction: { isOpen: true, editing: transaction }
    }));
  };

  const closeTransactionDialog = () => {
    setDialogs(prev => ({
      ...prev,
      transaction: { isOpen: false, editing: null }
    }));
  };

  const openCategoryDialog = () => {
    setDialogs(prev => ({ ...prev, category: { isOpen: true } }));
  };

  const closeCategoryDialog = () => {
    setDialogs(prev => ({ ...prev, category: { isOpen: false } }));
  };

  // ✅ TRANSACTION HANDLERS
  const handleAddTransaction = async (transactionData: any) => {
    try {
      const result = await addTransaction(transactionData);
      if (result.success) {
        closeTransactionDialog();
        toast.success('Transaksi berhasil ditambahkan');
        return true;
      } else {
        toast.error(result.error || 'Gagal menambah transaksi');
        return false;
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const handleUpdateTransaction = async (id: string, transactionData: any) => {
    try {
      const result = await updateTransaction(id, transactionData);
      if (result.success) {
        closeTransactionDialog();
        toast.success('Transaksi berhasil diperbarui');
        return true;
      } else {
        toast.error(result.error || 'Gagal memperbarui transaksi');
        return false;
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const result = await deleteTransaction(id);
      if (result.success) {
        toast.success('Transaksi berhasil dihapus');
        return true;
      } else {
        toast.error(result.error || 'Gagal menghapus transaksi');
        return false;
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  // ✅ DATE RANGE HANDLER - Convert DateRangePicker format to useFinancialCore format
  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    if (range) {
      setDateRange({
        from: range.from,
        to: range.to
      });
    } else {
      // Reset to current month if no range selected
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({ from, to });
    }
  };

  // ✅ CONVERT dateRange format for DateRangePicker component
  const dateRangeForPicker = dateRange && dateRange.from && dateRange.to ? {
    from: dateRange.from,
    to: dateRange.to
  } : undefined;

  return (
    <AuthGuard>
      <div className="p-4 sm:p-6 space-y-6">
        {/* ✅ SIMPLIFIED Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Analisis pemasukan, pengeluaran, dan saldo bisnis Anda
            </p>
          </div>
          
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <Button 
              onClick={() => openTransactionDialog()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Transaksi
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={openCategoryDialog}
                className="w-full sm:w-auto"
              >
                <Settings className="mr-2 h-4 w-4" />
                {isMobile ? "Kategori" : "Kelola Kategori"}
              </Button>
              
              {/* ✅ USING EXISTING DateRangePicker */}
              <div className="w-full sm:w-auto sm:min-w-[280px]">
                <DateRangePicker
                  dateRange={dateRangeForPicker}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder="Pilih periode laporan"
                  isMobile={isMobile}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ SIMPLIFIED Summary Cards */}
        <SummaryCards 
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
          isLoading={isLoading}
        />

        {/* ✅ SIMPLIFIED Charts */}
        <Suspense fallback={<ChartSkeleton />}>
          <FinancialCharts 
            filteredTransactions={filteredTransactions}
            dateRange={dateRange}
            isLoading={isLoading}
          />
        </Suspense>

        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        }>
          <CategoryCharts 
            filteredTransactions={filteredTransactions}
            isLoading={isLoading}
          />
        </Suspense>

        {/* ✅ SIMPLIFIED Transaction Table */}
        <Suspense fallback={<ChartSkeleton />}>
          <TransactionTable
            transactions={filteredTransactions}
            onEditTransaction={openTransactionDialog}
            onAddTransaction={() => openTransactionDialog()}
            onDeleteTransaction={handleDeleteTransaction}
            isLoading={isLoading}
          />
        </Suspense>

        {/* ✅ SIMPLIFIED Dialogs */}
        <Suspense fallback={null}>
          <FinancialTransactionDialog
            isOpen={dialogs.transaction.isOpen}
            onClose={closeTransactionDialog}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            categories={settings?.financialCategories || DEFAULT_FINANCIAL_CATEGORIES}
            transaction={dialogs.transaction.editing}
          />
        </Suspense>

        <Suspense fallback={null}>
          <CategoryManagementDialog
            isOpen={dialogs.category.isOpen}
            onClose={closeCategoryDialog}
            settings={settings}
            saveSettings={(newSettings) => {
              toast.success('Kategori berhasil disimpan');
            }}
          />
        </Suspense>
      </div>
    </AuthGuard>
  );
};

export default FinancialReportPage;