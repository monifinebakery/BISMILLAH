// src/components/financial/FinancialReportPage.tsx
// MODULAR VERSION dengan Dynamic Import dan Code Splitting

import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { useFinancial } from './contexts/FinancialContext';
import { filterByDateRange, calculateTotalIncome, calculateTotalExpense } from './utils/financialUtils'; // Asumsi ada folder utils

// ... lazy loaded components ...
const FinancialCharts = React.lazy(() => import('./components/FinancialCharts'));
const CategoryCharts = React.lazy(() => import('./components/CategoryCharts'));
const TransactionTable = React.lazy(() => import('./components/TransactionTable'));
const FinancialTransactionDialog = React.lazy(() => import('./dialogs/FinancialTransactionDialog'));
const CategoryManagementDialog = React.lazy(() => import('./dialogs/CategoryManagementDialog'));

// ===========================================
// LOCAL COMPONENTS - Keep simple ones local
// ===========================================

const SummaryCards: React.FC<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
}> = ({ totalIncome, totalExpense, balance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalIncome)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalExpense)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Saldo Akhir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const DateRangeSelector: React.FC<{
  dateRange: { from: Date; to?: Date };
  onDateRangeChange: (range: { from: Date; to?: Date }) => void;
}> = ({ dateRange, onDateRangeChange }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            "w-full sm:w-[280px] justify-start text-left font-normal",
            !dateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? 
              `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}` : 
              formatDateForDisplay(dateRange.from)
          ) : (
            <span>Pilih tanggal</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex" align="end">
        <div className="flex flex-col space-y-1 p-2 border-r">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onDateRangeChange({ 
              from: startOfDay(new Date()), 
              to: endOfDay(new Date()) 
            })}
          >
            Hari ini
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onDateRangeChange({ 
              from: startOfDay(subDays(new Date(), 1)), 
              to: endOfDay(subDays(new Date(), 1)) 
            })}
          >
            Kemarin
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onDateRangeChange({ 
              from: startOfDay(subDays(new Date(), 6)), 
              to: endOfDay(new Date()) 
            })}
          >
            7 Hari Terakhir
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onDateRangeChange({ 
              from: startOfMonth(new Date()), 
              to: endOfMonth(new Date()) 
            })}
          >
            Bulan ini
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onDateRangeChange({ 
              from: startOfMonth(subMonths(new Date(), 1)), 
              to: endOfMonth(subMonths(new Date(), 1)) 
            })}
          >
            Bulan Kemarin
          </Button>
        </div>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={1}
        />
      </PopoverContent>
    </Popover>
  );
};

// Loading Components
const ChartSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
    </CardHeader>
    <CardContent>
      <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
    </CardContent>
  </Card>
);

const TableSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4"></div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// ===========================================
// MAIN COMPONENT
// ===========================================

const FinancialReportPage: React.FC = () => {
  // Hooks
  const { 
    financialTransactions: transactions, 
    addFinancialTransaction, 
    updateFinancialTransaction, 
    deleteFinancialTransaction, 
    isLoading: financialLoading 
  } = useFinancial();
  
  const { settings, saveSettings, isLoading: settingsLoading } = useUserSettings();
  const isMobile = useIsMobile();

  // State
  const [dateRange, setDateRange] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfDay(new Date()) 
  });
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Computed values
  const filteredTransactions = useMemo(() => 
    filterByDateRange(transactions, dateRange, 'date').sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ), 
    [transactions, dateRange]
  );

  const totalIncome = useMemo(() => calculateTotalIncome(filteredTransactions), [filteredTransactions]);
  const totalExpense = useMemo(() => calculateTotalExpense(filteredTransactions), [filteredTransactions]);
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  // Event handlers
  const handleEditTransaction = useCallback((transaction: any) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  }, []);

  const handleCloseTransactionDialog = useCallback(() => {
    setIsTransactionDialogOpen(false);
    setEditingTransaction(null);
  }, []);

  const handleDateRangeChange = useCallback((range: { from: Date; to?: Date }) => {
    setDateRange(range);
  }, []);

  // Loading state
  if (financialLoading || settingsLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-96"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
        <ChartSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">
            Analisis pemasukan, pengeluaran, dan saldo bisnis Anda
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Kelola Kategori
          </Button>
          <DateRangeSelector 
            dateRange={dateRange} 
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards 
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
      />

      {/* Main Chart - Lazy Loaded */}
      <Suspense fallback={<ChartSkeleton />}>
        <FinancialCharts 
          filteredTransactions={filteredTransactions}
          dateRange={dateRange}
        />
      </Suspense>

      {/* Category Charts - Lazy Loaded */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      }>
        <CategoryCharts filteredTransactions={filteredTransactions} />
      </Suspense>

      {/* Transaction Table - Lazy Loaded */}
      <Suspense fallback={<TableSkeleton />}>
        <TransactionTable
          transactions={filteredTransactions}
          onEditTransaction={handleEditTransaction}
          onAddTransaction={() => setIsTransactionDialogOpen(true)}
        />
      </Suspense>

      {/* Dialogs - Lazy Loaded */}
      <Suspense fallback={null}>
        <FinancialTransactionDialog
          isOpen={isTransactionDialogOpen}
          onClose={handleCloseTransactionDialog}
          onAddTransaction={addFinancialTransaction}
          onUpdateTransaction={updateFinancialTransaction}
          categories={settings?.financialCategories}
          transaction={editingTransaction}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CategoryManagementDialog
          isOpen={isCategoryDialogOpen}
          onClose={() => setIsCategoryDialogOpen(false)}
          settings={settings}
          saveSettings={saveSettings}
        />
      </Suspense>
    </div>
  );
};

export default FinancialReportPage;