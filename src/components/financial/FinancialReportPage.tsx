// src/components/financial/FinancialReportPage.tsx
// ENHANCED RESPONSIVE VERSION dengan Dynamic Import dan Code Splitting

import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Settings, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { useFinancial } from './contexts/FinancialContext';
import { filterByDateRange, calculateTotalIncome, calculateTotalExpense } from './utils/financialUtils';

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
          <p className="text-xl md:text-2xl font-bold text-green-600 break-all">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalIncome)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl md:text-2xl font-bold text-red-600 break-all">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalExpense)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Saldo Akhir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-xl md:text-2xl font-bold break-all ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
  isMobile?: boolean;
}> = ({ dateRange, onDateRangeChange, isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateRange = () => {
    if (!dateRange?.from) return "Pilih tanggal";
    
    if (dateRange.to) {
      if (isMobile) {
        // Short format for mobile
        return `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`;
      } else {
        return `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`;
      }
    } else {
      return isMobile ? format(dateRange.from, 'dd/MM/yyyy') : formatDateForDisplay(dateRange.from);
    }
  };

  const quickDateOptions = [
    {
      label: "Hari ini",
      action: () => onDateRangeChange({ 
        from: startOfDay(new Date()), 
        to: endOfDay(new Date()) 
      })
    },
    {
      label: "Kemarin",
      action: () => onDateRangeChange({ 
        from: startOfDay(subDays(new Date(), 1)), 
        to: endOfDay(subDays(new Date(), 1)) 
      })
    },
    {
      label: "7 Hari Terakhir",
      action: () => onDateRangeChange({ 
        from: startOfDay(subDays(new Date(), 6)), 
        to: endOfDay(new Date()) 
      })
    },
    {
      label: "Bulan ini",
      action: () => onDateRangeChange({ 
        from: startOfMonth(new Date()), 
        to: endOfMonth(new Date()) 
      })
    },
    {
      label: "Bulan Kemarin",
      action: () => onDateRangeChange({ 
        from: startOfMonth(subMonths(new Date(), 1)), 
        to: endOfMonth(subMonths(new Date(), 1)) 
      })
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal",
            !dateRange && "text-muted-foreground",
            isMobile ? "text-sm" : ""
          )}
        >
          <div className="flex items-center flex-1 min-w-0">
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {formatDateRange()}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0",
          isMobile ? "w-screen max-w-[calc(100vw-2rem)]" : ""
        )} 
        align={isMobile ? "center" : "end"}
        side={isMobile ? "bottom" : "bottom"}
      >
        <div className={cn(
          "flex",
          isMobile ? "flex-col" : "flex-row"
        )}>
          {/* Quick date options */}
          <div className={cn(
            "flex flex-col space-y-1 p-2",
            !isMobile && "border-r"
          )}>
            <div className="text-sm font-medium text-gray-500 px-2 py-1">
              Pilihan Cepat
            </div>
            {quickDateOptions.map((option, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-sm h-8"
                onClick={() => {
                  option.action();
                  setIsOpen(false);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* Calendar */}
          <div className={cn(
            isMobile && "border-t"
          )}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                if (range) {
                  onDateRangeChange(range);
                  if (range.from && range.to) {
                    setIsOpen(false);
                  }
                }
              }}
              numberOfMonths={isMobile ? 1 : 1}
            />
          </div>
        </div>
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
      <div className="h-64 md:h-80 bg-gray-100 rounded animate-pulse"></div>
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
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 sm:w-64"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-64 sm:w-96"></div>
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
      {/* Enhanced Responsive Header */}
      <div className="space-y-4">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Analisis pemasukan, pengeluaran, dan saldo bisnis Anda
          </p>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          {/* Left side - Add Transaction Button */}
          <Button 
            onClick={() => setIsTransactionDialogOpen(true)}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Transaksi
          </Button>
          
          {/* Right side - Date Range and Settings */}
          <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryDialogOpen(true)}
              className={cn(
                "w-full sm:w-auto",
                isMobile ? "text-sm" : ""
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              {isMobile ? "Kategori" : "Kelola Kategori"}
            </Button>
            
            <div className="w-full sm:w-auto sm:min-w-[280px]">
              <DateRangeSelector 
                dateRange={dateRange} 
                onDateRangeChange={handleDateRangeChange}
                isMobile={isMobile}
              />
            </div>
          </div>
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