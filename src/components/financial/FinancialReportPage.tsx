// src/components/financial/FinancialReportPage.tsx
// ✅ SIMPLIFIED VERSION - Only Financial Reports and Charts

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

// UI utilities
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';

// Auth Context
import { useAuth } from '@/contexts/AuthContext';

// ✅ EXISTING COMPONENTS - Reuse what's already available
import DateRangePicker from '@/components/ui/DateRangePicker';

// ✅ CLEAN IMPORTS - Using consolidated hooks
import { useFinancialCore } from './hooks/useFinancialCore';
import { useFinancialPage } from './hooks/useFinancialPages';
import { useFinancialChartDataProcessing } from './hooks/useFinancialData';
import { DEFAULT_FINANCIAL_CATEGORIES } from './types/financial';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useTransactionTable } from './hooks/useTransactionTable';

// LAZY LOADED COMPONENTS
const FinancialCharts = React.lazy(() => 
  import('./components/FinancialCharts').catch((error) => {
    logger.error('Failed to load FinancialCharts', error);
    return {
      default: () => <div className="p-4 text-center text-red-500">Gagal memuat chart</div>
    };
  })
);

const CategoryCharts = React.lazy(() => 
  import('./components/CategoryCharts').catch((error) => {
    logger.error('Failed to load CategoryCharts', error);
    return {
      default: () => <div className="p-4 text-center text-red-500">Gagal memuat kategori chart</div>
    };
  })
);

const TransactionTable = React.lazy(() => 
  import('./components/TransactionTable').catch((error) => {
    logger.error('Failed to load TransactionTable', error);
    return {
      default: () => <div className="p-4 text-center text-red-500">Gagal memuat tabel</div>
    };
  })
);

const FinancialTransactionDialog = React.lazy(() => 
  import('./dialogs/FinancialTransactionDialog').catch((error) => {
    logger.error('Failed to load FinancialTransactionDialog', error);
    return {
      default: () => null
    };
  })
);

const CategoryManagementDialog = React.lazy(() => 
  import('./dialogs/CategoryManagementDialog').catch((error) => {
    logger.error('Failed to load CategoryManagementDialog', error);
    return {
      default: () => null
    };
  })
);

const BulkActions = React.lazy(() => 
  import('./components/BulkActions').catch((error) => {
    logger.error('Failed to load BulkActions', error);
    return {
      default: () => null
    };
  })
);

const DailyCashFlowTracker = React.lazy(() => 
  import('./components/DailyCashFlowTracker').catch((error) => {
    logger.error('Failed to load DailyCashFlowTracker component:', error);
    return { default: () => <div>Error loading cash flow tracker</div> };
  })
);

const ProfitLossSimple = React.lazy(() => 
  import('./components/ProfitLossSimple').catch((error) => {
    logger.error('Failed to load ProfitLossSimple component:', error);
    return { default: () => <div>Error loading profit loss</div> };
  })
);

const DailySummaryWidget = React.lazy(() => 
  import('./components/DailySummaryWidget').catch((error) => {
    logger.error('Failed to load DailySummaryWidget component:', error);
    return { default: () => <div>Error loading daily summary</div> };
  })
);

const UMKMExpenseCategories = React.lazy(() => 
  import('./components/UMKMExpenseCategories').catch((error) => {
    logger.error('Failed to load UMKMExpenseCategories component:', error);
    return { default: () => <div>Error loading UMKM expense categories</div> };
  })
);

const SavingsGoalTracker = React.lazy(() => 
  import('./components/SavingsGoalTracker').catch((error) => {
    logger.error('Failed to load SavingsGoalTracker component:', error);
    return { default: () => <div>Error loading savings goal tracker</div> };
  })
);

const DebtTracker = React.lazy(() => 
  import('./components/DebtTracker').catch((error) => {
    logger.error('Failed to load DebtTracker component:', error);
    return { default: () => <div>Error loading debt tracker</div> };
  })
);

const ExpenseAlerts = React.lazy(() => 
  import('./components/ExpenseAlerts').catch((error) => {
    logger.error('Failed to load ExpenseAlerts component:', error);
    return { default: () => <div>Error loading expense alerts</div> };
  })
);

const SimpleBusinessReport = React.lazy(() => 
  import('./components/SimpleBusinessReport').catch((error) => {
    logger.error('Failed to load SimpleBusinessReport component:', error);
    return { default: () => <div>Error loading business report</div> };
  })
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

// ✅ SIMPLIFIED Summary Cards Component - Only basic financial data
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-l-4 border-blue-500">
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

// ✅ MAIN COMPONENT - SIMPLIFIED WITHOUT PROFIT MARGIN
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
    settings,
    saveSettings
  } = useFinancialCore();

  // ✅ CHART DATA - Single hook
  const chartData = useFinancialChartDataProcessing(filteredTransactions);

  // ✅ BULK OPERATIONS - Transaction table hook
  const transactionTable = useTransactionTable(filteredTransactions);

  // ✅ STATE - Dialogs and active tab (only charts and transactions)
  const [activeTab, setActiveTab] = useState('charts');
  const [dialogs, setDialogs] = useState({
    transaction: { isOpen: false, editing: null as any },
    category: { isOpen: false }
  });

  // ✅ EFFECT - Reset form fields when category dialog opens
  React.useEffect(() => {
    if (dialogs.category.isOpen) {
      // Dialog just opened, ensure we have fresh data
    }
  }, [dialogs.category.isOpen]);

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

  // ✅ DATE RANGE HANDLER
  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    logger.debug('Date range changed', { range });
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
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">Laporan Keuangan Arus Kas</h1>
                <p className="text-white opacity-90 text-sm sm:text-base">
                  Analisis pemasukan, pengeluaran, dan saldo bisnis Anda
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap items-center gap-3">
              <Button
                onClick={() => openTransactionDialog()}
                disabled={isLoading}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Transaksi
              </Button>

              <Button
                onClick={openCategoryDialog}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
              >
                <Settings className="h-4 w-4" />
                {isMobile ? "Kategori" : "Kelola Kategori"}
              </Button>

              <div className="w-full md:w-auto md:min-w-[260px]">
                <DateRangePicker
                  dateRange={dateRangeForPicker}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder="Pilih periode laporan"
                  isMobile={isMobile}
                  className="bg-white text-gray-900 border-none hover:bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="flex md:hidden flex-col gap-3 mt-6">
            <Button
              onClick={() => openTransactionDialog()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Transaksi
            </Button>

            <Button
              onClick={openCategoryDialog}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
            >
              <Settings className="h-4 w-4" />
              {isMobile ? "Kategori" : "Kelola Kategori"}
            </Button>

            <DateRangePicker
              dateRange={dateRangeForPicker}
              onDateRangeChange={handleDateRangeChange}
              placeholder="Pilih periode laporan"
              isMobile={isMobile}
              className="bg-white text-gray-900 border-none hover:bg-gray-100 w-full"
            />
          </div>
        </div>

        {/* ✅ SIMPLIFIED Summary Cards - Only basic financial data */}
        <SummaryCards 
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
          isLoading={isLoading}
        />

        {/* ✅ ENHANCED TABBED INTERFACE - Charts, Transactions, and UMKM Features */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts">Charts & Reports</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="umkm">Fitur UMKM</TabsTrigger>
          </TabsList>

          {/* ✅ CHARTS TAB - Financial charts and category charts */}
          <TabsContent value="charts" className="space-y-6">
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
          </TabsContent>

          {/* ✅ TRANSACTIONS TAB */}
          <TabsContent value="transactions" className="space-y-6">
            {transactionTable.isSelectionMode && (
              <Suspense fallback={null}>
                <BulkActions
                  selectedTransactions={transactionTable.selectedTransactions}
                  selectedIds={transactionTable.selectedIds}
                  onClearSelection={transactionTable.exitSelectionMode}
                  onSelectAll={transactionTable.handleSelectAll}
                  isAllSelected={transactionTable.isAllSelected}
                  totalCount={filteredTransactions.length}
                />
              </Suspense>
            )}
            <Suspense fallback={<ChartSkeleton />}>
              <TransactionTable
                transactions={filteredTransactions}
                onEditTransaction={openTransactionDialog}
                onAddTransaction={() => openTransactionDialog()}
                onDeleteTransaction={handleDeleteTransaction}
                isLoading={isLoading}
                selectedIds={transactionTable.selectedIds}
                onSelectionChange={transactionTable.handleSelectionChange}
                isSelectionMode={transactionTable.isSelectionMode}
                onSelectAll={transactionTable.handleSelectAll}
                isAllSelected={transactionTable.isAllSelected}
              />
            </Suspense>
          </TabsContent>

          {/* ✅ UMKM FEATURES TAB - Optimized Layout */}
          <TabsContent value="umkm" className="space-y-4">
            {/* Daily Summary Widget - Full Width */}
            <Suspense fallback={<ChartSkeleton />}>
              <DailySummaryWidget 
                transactions={filteredTransactions}
              />
            </Suspense>

            {/* Main Grid - 3 Columns on Large Screens, 2 on Medium, 1 on Small */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Daily Cash Flow Tracker */}
              <Suspense fallback={<ChartSkeleton />}>
                <DailyCashFlowTracker 
                  transactions={filteredTransactions}
                />
              </Suspense>

              {/* Simple Profit Loss */}
              <Suspense fallback={<ChartSkeleton />}>
                <ProfitLossSimple 
                  transactions={filteredTransactions}
                />
              </Suspense>

              {/* UMKM Expense Categories */}
              <Suspense fallback={<ChartSkeleton />}>
                <UMKMExpenseCategories 
                  transactions={filteredTransactions}
                />
              </Suspense>

              {/* Savings Goal Tracker */}
              <Suspense fallback={<ChartSkeleton />}>
                <SavingsGoalTracker 
                  transactions={filteredTransactions}
                />
              </Suspense>

              {/* Debt Tracker */}
              <Suspense fallback={<ChartSkeleton />}>
                <DebtTracker />
              </Suspense>

              {/* Expense Alerts */}
              <Suspense fallback={<ChartSkeleton />}>
                <ExpenseAlerts 
                  transactions={filteredTransactions}
                />
              </Suspense>
            </div>

            {/* Simple Business Report - Full Width at Bottom */}
            <Suspense fallback={<ChartSkeleton />}>
              <SimpleBusinessReport 
                transactions={filteredTransactions}
              />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* ✅ DIALOGS - Only transaction and category dialogs */}
        <Suspense fallback={null}>
          <FinancialTransactionDialog
            isOpen={dialogs.transaction.isOpen}
            onClose={closeTransactionDialog}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            categories={DEFAULT_FINANCIAL_CATEGORIES}
            transaction={dialogs.transaction.editing}
          />
        </Suspense>

        <Suspense fallback={null}>
          <CategoryManagementDialog
            isOpen={dialogs.category.isOpen}
            onClose={closeCategoryDialog}
            settings={settings}
            saveSettings={async (newSettings) => {
              try {
                // This is now a legacy fallback - categories are managed dynamically
                const result = await saveSettings(newSettings);
                if (result) {
                  toast.success('Pengaturan berhasil disimpan');
                  logger.info('Settings saved successfully');
                  return true;
                } else {
                  toast.error('Gagal menyimpan pengaturan');
                  return false;
                }
              } catch (error) {
                toast.error('Terjadi kesalahan saat menyimpan pengaturan');
                logger.error('Failed to save settings:', error);
                return false;
              }
            }}
            refreshSettings={async () => {
              // Refresh settings if needed
              return true;
            }}
          />
        </Suspense>
      </div>
    </AuthGuard>
  );
};

export default FinancialReportPage;