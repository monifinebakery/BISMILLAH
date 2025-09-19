// src/components/financial/FinancialReportPage.tsx - Modular Financial Report Page
import React, { useState, useEffect } from 'react';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';
import { useIsMobile } from '@/hooks/use-mobile';
import { registerRoutePreloader, preloadRoute } from '@/utils/route-preloader';

// Import refactored components
import { FinancialHeader } from './components/FinancialHeader';
import { SummaryCards } from './components/SummaryCards';
import { FinancialTabs } from './components/FinancialTabs';

// Import existing hooks
import { useFinancialCore } from './hooks/useFinancialCore';
import { useFinancialChartDataProcessing } from './hooks/useFinancialData';
import { useTransactionTable } from './hooks/useTransactionTable';
import { DEFAULT_FINANCIAL_CATEGORIES } from './types/financial';

// Import new refactored hooks
import { useFinancialNavigation } from '@/hooks/financial/useFinancialNavigation';
import { useFinancialTransactions } from '@/hooks/financial/useFinancialTransactions';

// Auth components
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';

// Lazy loaded dialogs
const FinancialTransactionDialog = React.lazy(() => import('./dialogs/FinancialTransactionDialog'));
const CategoryManagementDialog = React.lazy(() => import('./dialogs/CategoryManagementDialog'));

// Simple Auth Guard
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

const FinancialReportPage: React.FC = () => {
  const isMobile = useIsMobile();
  
  // Core data and operations
  const financialCore = useFinancialCore();
  const chartData = useFinancialChartDataProcessing(financialCore.filteredTransactions);
  const transactionTable = useTransactionTable(financialCore.filteredTransactions);
  
  // Navigation and transaction handlers
  const navigation = useFinancialNavigation();
  const transactions = useFinancialTransactions({
    addTransaction: financialCore.addTransaction,
    updateTransaction: financialCore.updateTransaction,
    deleteTransaction: financialCore.deleteTransaction,
  });
  
  // Local state
  const [activeTab, setActiveTab] = useState(isMobile ? 'transactions' : 'charts');
  const [dialogs, setDialogs] = useState({
    transaction: { isOpen: false, editing: null as any },
    category: { isOpen: false }
  });

  // Route preloading setup
  useEffect(() => {
    const routes = {
      'financial:charts-tab': () => Promise.all([
        import('./report/ChartsTab'),
        import('./components/FinancialCharts'),
        import('./components/CategoryCharts'),
      ]),
      'financial:transactions-tab': () => Promise.all([
        import('./report/TransactionsTab'),
        import('./components/TransactionTable'),
        import('./components/BulkActions'),
      ]),
      'financial:umkm-tab': () => Promise.all([
        import('./report/UmkmTab'),
        import('./components/DailySummaryWidget'),
        import('./components/UMKMExpenseCategories'),
      ]),
    };

    Object.entries(routes).forEach(([key, loader]) => {
      registerRoutePreloader?.(key, loader);
    });

    // Prefetch after idle
    const idle = (cb: () => void) => 
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb) : setTimeout(cb, 500);
    
    idle(() => {
      Object.keys(routes).forEach(preloadRoute);
    });
  }, []);

  // Dialog handlers
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

  // Convert dateRange format for DateRangePicker
  const dateRangeForPicker = financialCore.dateRange && financialCore.dateRange.from && financialCore.dateRange.to ? {
    from: financialCore.dateRange.from,
    to: financialCore.dateRange.to
  } : undefined;

  return (
    <AuthGuard>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <FinancialHeader
          onAddTransaction={navigation.handleAddTransaction}
          onManageCategories={navigation.handleManageCategories}
          onDateRangeChange={navigation.handleDateRangeChange(financialCore.setDateRange)}
          dateRange={dateRangeForPicker}
          isLoading={financialCore.isLoading}
          isMobile={isMobile}
        />

        {/* Summary Cards */}
        <SummaryCards 
          totalIncome={financialCore.totalIncome}
          totalExpense={financialCore.totalExpense}
          balance={financialCore.balance}
          isLoading={financialCore.isLoading}
          isRefreshing={financialCore.isRefreshing}
          lastRefresh={financialCore.lastRefresh}
          onRefresh={financialCore.refresh}
        />

        {/* Tabbed Interface */}
        <FinancialTabs
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          filteredTransactions={financialCore.filteredTransactions}
          dateRange={financialCore.dateRange}
          isLoading={financialCore.isLoading}
          isRefreshing={financialCore.isRefreshing}
          onRefresh={financialCore.refresh}
          lastRefresh={financialCore.lastRefresh}
          transactionTable={transactionTable}
          onEditTransaction={navigation.handleEditTransaction}
          onAddTransaction={navigation.handleAddTransaction}
          onDeleteTransaction={transactions.handleDeleteTransaction}
        />

        {/* Legacy Dialogs */}
        <SafeSuspense loadingMessage="Memuat dialog transaksi...">
          <FinancialTransactionDialog
            isOpen={dialogs.transaction.isOpen}
            onClose={closeTransactionDialog}
            onAddTransaction={async (data) => {
              const success = await transactions.handleAddTransaction(data);
              if (success) closeTransactionDialog();
              return success;
            }}
            onUpdateTransaction={async (id, data) => {
              const success = await transactions.handleUpdateTransaction(id, data);
              if (success) closeTransactionDialog();
              return success;
            }}
            categories={DEFAULT_FINANCIAL_CATEGORIES}
            transaction={dialogs.transaction.editing}
          />
        </SafeSuspense>

        <SafeSuspense loadingMessage="Memuat dialog kategori...">
          <CategoryManagementDialog
            isOpen={dialogs.category.isOpen}
            onClose={closeCategoryDialog}
            settings={financialCore.settings}
            saveSettings={financialCore.saveSettings}
            refreshSettings={async () => true}
          />
        </SafeSuspense>
      </div>
    </AuthGuard>
  );
};

export default FinancialReportPage;