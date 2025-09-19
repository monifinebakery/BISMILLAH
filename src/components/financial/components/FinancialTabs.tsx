// src/components/financial/components/FinancialTabs.tsx - Financial Tabs Interface
import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { preloadRoute } from '@/utils/route-preloader';

const ChartSpinner = () => (
  <div className="min-h-[120px] flex items-center justify-center">
    <LoadingSpinner size="sm" />
  </div>
);

// Lazy loaded tabs
const ChartsTab = React.lazy(() => import('../report/ChartsTab'));
const TransactionsTab = React.lazy(() => import('../report/TransactionsTab'));
const UmkmTab = React.lazy(() => import('../report/UmkmTab'));

interface FinancialTabsProps {
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  filteredTransactions: any[];
  dateRange: { from: Date; to: Date } | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastRefresh: Date | null;
  transactionTable: {
    isSelectionMode: boolean;
    selectedTransactions: any[];
    selectedIds: string[];
    exitSelectionMode: () => void;
    handleSelectAll: () => void;
    isAllSelected: boolean;
    handleSelectionChange: (id: string, selected: boolean) => void;
  };
  onEditTransaction: (transaction: any) => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => Promise<boolean>;
}

export const FinancialTabs: React.FC<FinancialTabsProps> = ({
  activeTab,
  onActiveTabChange,
  filteredTransactions,
  dateRange,
  isLoading,
  isRefreshing,
  onRefresh,
  lastRefresh,
  transactionTable,
  onEditTransaction,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  return (
    <div className="w-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0 h-auto sm:h-10 p-1 bg-muted">
          <TabsTrigger 
            value="charts" 
            className="h-10 sm:h-auto text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
            onMouseEnter={() => preloadRoute('financial:charts-tab')}
          >
            <span className="hidden sm:inline">Charts & Reports</span>
            <span className="sm:hidden">Charts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="h-10 sm:h-auto text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
            onMouseEnter={() => preloadRoute('financial:transactions-tab')}
          >
            Transaksi
          </TabsTrigger>
          <TabsTrigger 
            value="umkm" 
            className="h-10 sm:h-auto text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
            onMouseEnter={() => preloadRoute('financial:umkm-tab')}
          >
            <span className="hidden sm:inline">Fitur UMKM</span>
            <span className="sm:hidden">UMKM</span>
          </TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <Suspense fallback={<div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>}>
            <ChartsTab 
              filteredTransactions={filteredTransactions}
              dateRange={dateRange as any}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              onRefresh={onRefresh}
              lastUpdated={lastRefresh as any}
            />
          </Suspense>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Suspense fallback={<div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>}>
            <TransactionsTab
              filteredTransactions={filteredTransactions}
              isLoading={isLoading}
              isSelectionMode={transactionTable.isSelectionMode}
              selectedTransactions={transactionTable.selectedTransactions}
              selectedIds={transactionTable.selectedIds}
              onClearSelection={transactionTable.exitSelectionMode}
              onSelectAll={transactionTable.handleSelectAll}
              isAllSelected={transactionTable.isAllSelected}
              onSelectionChange={transactionTable.handleSelectionChange}
              onEditTransaction={onEditTransaction}
              onAddTransaction={onAddTransaction}
              onDeleteTransaction={onDeleteTransaction}
              dateRange={dateRange as any}
            />
          </Suspense>
        </TabsContent>

        {/* UMKM Features Tab */}
        <TabsContent value="umkm" className="space-y-4">
          <Suspense fallback={<div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>}>
            <UmkmTab transactions={filteredTransactions} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};