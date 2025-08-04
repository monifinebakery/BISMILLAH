// src/components/financial/FinancialReportPage.tsx - Optimized Dependencies (7 → 4)
import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Settings, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// ✅ CONSOLIDATED: Single hook import instead of multiple
import { useFinancialCore } from './hooks/useFinancialCore'; // New consolidated hook

// ✅ UI utilities
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// ✅ DATE UTILITIES (keep existing)
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

// ✅ LAZY LOADED COMPONENTS (Better code splitting)
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

// ❌ REMOVED: Individual imports - now consolidated
// - date-fns functions, useFinancial, useUserSettings, formatDateForDisplay, filterByDateRange, etc.

// ✅ SIMPLIFIED: Loading components
const QuickSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={cn("bg-gray-200 rounded animate-pulse", className)} />
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <QuickSkeleton className="h-6 w-1/3" />
    </CardHeader>
    <CardContent>
      <QuickSkeleton className="h-64 md:h-80" />
    </CardContent>
  </Card>
);

const TableSkeleton = () => (
  <Card>
    <CardHeader>
      <QuickSkeleton className="h-6 w-1/4" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <QuickSkeleton key={i} className="h-12" />
        ))}
      </div>
    </CardContent>
  </Card>
);

// ✅ CONSOLIDATED: State management interface
interface PageState {
  transaction: {
    isDialogOpen: boolean;
    editing: any;
  };
  category: {
    isDialogOpen: boolean;
  };
}

const initialPageState: PageState = {
  transaction: { isDialogOpen: false, editing: null },
  category: { isDialogOpen: false }
};

// ✅ SIMPLIFIED: Summary Cards Component
const SummaryCards: React.FC<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
}> = ({ totalIncome, totalExpense, balance }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  const cards = [
    { title: 'Total Pemasukan', value: totalIncome, color: 'green', borderColor: 'border-green-500' },
    { title: 'Total Pengeluaran', value: totalExpense, color: 'red', borderColor: 'border-red-500' },
    { title: 'Saldo Akhir', value: balance, color: balance >= 0 ? 'green' : 'red', borderColor: 'border-blue-500' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={cn("border-l-4", card.borderColor)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-xl md:text-2xl font-bold break-all",
              card.color === 'green' ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ✅ SIMPLIFIED: Date Range Selector (keep original logic)
const DateRangeSelector: React.FC<{
  dateRange: { from: Date; to?: Date };
  onDateRangeChange: (range: { from: Date; to?: Date }) => void;
  isMobile?: boolean;
}> = ({ dateRange, onDateRangeChange, isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ KEEP ORIGINAL: Date formatting logic
  const formatDateRange = () => {
    if (!dateRange?.from) return "Pilih tanggal";
    
    if (dateRange.to) {
      if (isMobile) {
        return `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`;
      } else {
        return `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`;
      }
    } else {
      return isMobile ? format(dateRange.from, 'dd/MM/yyyy') : formatDateForDisplay(dateRange.from);
    }
  };

  // ✅ KEEP ORIGINAL: Quick date options
  const quickDateOptions = [
    {
      label: "Hari ini",
      range: { 
        from: startOfDay(new Date()), 
        to: endOfDay(new Date()) 
      }
    },
    {
      label: "Kemarin",
      range: { 
        from: startOfDay(subDays(new Date(), 1)), 
        to: endOfDay(subDays(new Date(), 1)) 
      }
    },
    {
      label: "7 Hari Terakhir",
      range: { 
        from: startOfDay(subDays(new Date(), 6)), 
        to: endOfDay(new Date()) 
      }
    },
    {
      label: "Bulan ini",
      range: { 
        from: startOfMonth(new Date()), 
        to: endOfMonth(new Date()) 
      }
    },
    {
      label: "Bulan Kemarin",
      range: { 
        from: startOfMonth(subMonths(new Date(), 1)), 
        to: endOfMonth(subMonths(new Date(), 1)) 
      }
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
              {formatDateRange(dateRange, isMobile)}
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
      >
        <div className={cn("flex", isMobile ? "flex-col" : "flex-row")}>
          <div className={cn("flex flex-col space-y-1 p-2", !isMobile && "border-r")}>
            <div className="text-sm font-medium text-gray-500 px-2 py-1">
              Pilihan Cepat
            </div>
            {quickDateOptions.map((option, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-sm h-8"
                onClick={() => {
                  onDateRangeChange(option.range);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <div className={cn(isMobile && "border-t")}>
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

// ✅ MAIN COMPONENT - Optimized
const FinancialReportPage: React.FC = () => {
  const isMobile = useIsMobile();
  
  // ✅ CONSOLIDATED: Single hook for all financial operations
  const {
    // Data
    transactions,
    filteredTransactions,
    totalIncome,
    totalExpense,
    balance,
    
    // State
    isLoading,
    dateRange,
    
    // Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Date management
    setDateRange,
    
    // Settings
    settings,
    saveSettings
  } = useFinancialCore();

  // ✅ SIMPLIFIED: Single state object
  const [pageState, setPageState] = useState<PageState>(initialPageState);

  // ✅ CONSOLIDATED: Dialog handlers
  const dialogHandlers = {
    openTransaction: useCallback((transaction: any = null) => {
      setPageState(prev => ({
        ...prev,
        transaction: { isDialogOpen: true, editing: transaction }
      }));
    }, []),

    closeTransaction: useCallback(() => {
      setPageState(prev => ({
        ...prev,
        transaction: { isDialogOpen: false, editing: null }
      }));
    }, []),

    openCategory: useCallback(() => {
      setPageState(prev => ({
        ...prev,
        category: { isDialogOpen: true }
      }));
    }, []),

    closeCategory: useCallback(() => {
      setPageState(prev => ({
        ...prev,
        category: { isDialogOpen: false }
      }));
    }, [])
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <QuickSkeleton className="h-8 w-48 sm:w-64" />
            <QuickSkeleton className="h-4 w-64 sm:w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <QuickSkeleton key={i} className="h-24" />
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
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Analisis pemasukan, pengeluaran, dan saldo bisnis Anda
          </p>
        </div>
        
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <Button 
            onClick={() => dialogHandlers.openTransaction()}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Transaksi
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
            <Button 
              variant="outline" 
              onClick={dialogHandlers.openCategory}
              className={cn("w-full sm:w-auto", isMobile ? "text-sm" : "")}
            >
              <Settings className="mr-2 h-4 w-4" />
              {isMobile ? "Kategori" : "Kelola Kategori"}
            </Button>
            
            <div className="w-full sm:w-auto sm:min-w-[280px]">
              <DateRangeSelector 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange}
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

      {/* Charts */}
      <Suspense fallback={<ChartSkeleton />}>
        <FinancialCharts 
          filteredTransactions={filteredTransactions}
          dateRange={dateRange}
        />
      </Suspense>

      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      }>
        <CategoryCharts filteredTransactions={filteredTransactions} />
      </Suspense>

      {/* Transaction Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TransactionTable
          transactions={filteredTransactions}
          onEditTransaction={dialogHandlers.openTransaction}
          onAddTransaction={() => dialogHandlers.openTransaction()}
        />
      </Suspense>

      {/* Dialogs */}
      <Suspense fallback={null}>
        <FinancialTransactionDialog
          isOpen={pageState.transaction.isDialogOpen}
          onClose={dialogHandlers.closeTransaction}
          onAddTransaction={addTransaction}
          onUpdateTransaction={updateTransaction}
          categories={settings?.financialCategories}
          transaction={pageState.transaction.editing}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CategoryManagementDialog
          isOpen={pageState.category.isDialogOpen}
          onClose={dialogHandlers.closeCategory}
          settings={settings}
          saveSettings={saveSettings}
        />
      </Suspense>
    </div>
  );
};

export default FinancialReportPage;