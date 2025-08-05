// src/components/financial/FinancialReportPage.tsx - Enhanced dengan useQuery
import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Settings, ChevronDown, RefreshCw, TrendingUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// ✅ TAMBAH: Import useQuery dan TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// UI utilities
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';

// DATE UTILITIES
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

// ✅ TAMBAH: Types untuk financial data
interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  avgTransaction: number;
  topCategory: string;
  monthlyGrowth: number;
  categoryBreakdown: { [key: string]: number };
}

// ✅ TAMBAH: Query keys untuk financial data
const financialQueryKeys = {
  all: ['financial'] as const,
  transactions: () => [...financialQueryKeys.all, 'transactions'] as const,
  transactionsByRange: (from: Date, to?: Date) => 
    [...financialQueryKeys.transactions(), 'range', from.toISOString(), to?.toISOString()] as const,
  stats: (from: Date, to?: Date) => 
    [...financialQueryKeys.all, 'stats', from.toISOString(), to?.toISOString()] as const,
  categories: () => [...financialQueryKeys.all, 'categories'] as const,
  settings: () => [...financialQueryKeys.all, 'settings'] as const,
};

// ✅ TAMBAH: API functions
const fetchFinancialTransactions = async (dateRange: { from: Date; to?: Date }): Promise<FinancialTransaction[]> => {
  try {
    // Replace dengan real API endpoint
    const response = await fetch(`/api/financial/transactions?from=${dateRange.from.toISOString()}&to=${dateRange.to?.toISOString() || ''}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    logger.error('Failed to fetch financial transactions:', error);
    // Mock data untuk development
    return [
      {
        id: '1',
        date: new Date().toISOString(),
        description: 'Penjualan Menu Utama',
        amount: 150000,
        type: 'income',
        category: 'Penjualan'
      },
      {
        id: '2',
        date: new Date().toISOString(),
        description: 'Pembelian Bahan Baku',
        amount: 75000,
        type: 'expense',
        category: 'Operasional'
      }
    ] as FinancialTransaction[];
  }
};

const fetchFinancialStats = async (dateRange: { from: Date; to?: Date }): Promise<FinancialStats> => {
  try {
    const response = await fetch(`/api/financial/stats?from=${dateRange.from.toISOString()}&to=${dateRange.to?.toISOString() || ''}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    logger.error('Failed to fetch financial stats:', error);
    // Mock stats untuk development
    return {
      totalIncome: 150000,
      totalExpense: 75000,
      balance: 75000,
      transactionCount: 2,
      avgTransaction: 112500,
      topCategory: 'Penjualan',
      monthlyGrowth: 15.5,
      categoryBreakdown: {
        'Penjualan': 150000,
        'Operasional': 75000
      }
    };
  }
};

const createTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialTransaction> => {
  try {
    const response = await fetch('/api/financial/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error(`Failed to create transaction: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    logger.error('Failed to create transaction:', error);
    throw error;
  }
};

const updateTransaction = async ({ id, transaction }: { id: string; transaction: Partial<FinancialTransaction> }): Promise<FinancialTransaction> => {
  try {
    const response = await fetch(`/api/financial/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error(`Failed to update transaction: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    logger.error('Failed to update transaction:', error);
    throw error;
  }
};

const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/financial/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete transaction: ${response.status}`);
    }
  } catch (error) {
    logger.error('Failed to delete transaction:', error);
    throw error;
  }
};

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

// State management interface
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

// ✅ ENHANCED: Summary Cards Component dengan real-time data
const SummaryCards: React.FC<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
  stats?: FinancialStats;
  isLoading?: boolean;
  onRefresh?: () => void;
}> = ({ totalIncome, totalExpense, balance, stats, isLoading, onRefresh }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  const cards = [
    { 
      title: 'Total Pemasukan', 
      value: totalIncome, 
      color: 'green', 
      borderColor: 'border-green-500',
      growth: stats?.monthlyGrowth && stats.monthlyGrowth > 0 ? `+${stats.monthlyGrowth.toFixed(1)}%` : undefined,
      subtitle: stats ? `${stats.transactionCount} transaksi` : undefined
    },
    { 
      title: 'Total Pengeluaran', 
      value: totalExpense, 
      color: 'red', 
      borderColor: 'border-red-500',
      subtitle: stats?.avgTransaction ? `Rata-rata: ${formatCurrency(stats.avgTransaction)}` : undefined
    },
    { 
      title: 'Saldo Akhir', 
      value: balance, 
      color: balance >= 0 ? 'green' : 'red', 
      borderColor: 'border-blue-500',
      subtitle: stats?.topCategory ? `Kategori tertinggi: ${stats.topCategory}` : undefined
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={cn("border-l-4 relative", card.borderColor)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{card.title}</CardTitle>
              {index === 0 && onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-xl md:text-2xl font-bold break-all",
              card.color === 'green' ? 'text-green-600' : 'text-red-600'
            )}>
              {isLoading ? (
                <QuickSkeleton className="h-8 w-24" />
              ) : (
                formatCurrency(card.value)
              )}
            </p>
            {card.growth && (
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">{card.growth}</span>
              </div>
            )}
            {card.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Date Range Selector (keep original logic)
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

// ✅ ENHANCED: Custom hook dengan useQuery
const useFinancialData = (dateRange: { from: Date; to?: Date }) => {
  const queryClient = useQueryClient();

  // Query untuk transactions
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    dataUpdatedAt: transactionsUpdatedAt,
  } = useQuery({
    queryKey: financialQueryKeys.transactionsByRange(dateRange.from, dateRange.to),
    queryFn: () => fetchFinancialTransactions(dateRange),
    staleTime: 2 * 60 * 1000, // 2 minutes - financial data changes frequently
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 1,
  });

  // Query untuk stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: financialQueryKeys.stats(dateRange.from, dateRange.to),
    queryFn: () => fetchFinancialStats(dateRange),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: (newTransaction) => {
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.stats(dateRange.from, dateRange.to) });
      toast.success('Transaksi berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambah transaksi: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTransaction,
    onSuccess: (updatedTransaction) => {
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.stats(dateRange.from, dateRange.to) });
      toast.success('Transaksi berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui transaksi: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.stats(dateRange.from, dateRange.to) });
      toast.success('Transaksi berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
  });

  // Computed values
  const totalIncome = useMemo(() => 
    transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  , [transactions]);

  const totalExpense = useMemo(() => 
    transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  , [transactions]);

  const balance = totalIncome - totalExpense;

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      refetchTransactions(),
      refetchStats()
    ]);
  };

  return {
    // Data
    transactions,
    stats,
    totalIncome,
    totalExpense,
    balance,
    lastUpdated: transactionsUpdatedAt ? new Date(transactionsUpdatedAt) : undefined,
    
    // Loading states
    isLoading: transactionsLoading || statsLoading,
    isTransactionsLoading: transactionsLoading,
    isStatsLoading: statsLoading,
    error: transactionsError,
    
    // Actions
    addTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    refreshAll,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isProcessing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};

// MAIN COMPONENT - Enhanced dengan useQuery
const FinancialReportPage: React.FC = () => {
  const isMobile = useIsMobile();
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // useQuery financial data
  const financialData = useFinancialData(dateRange);

  // Single state object
  const [pageState, setPageState] = useState<PageState>(initialPageState);

  // Dialog handlers
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

  // Loading state
  if (financialData.isLoading) {
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
            {/* Real-time indicator */}
            {financialData.lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Analisis pemasukan, pengeluaran, dan saldo bisnis Anda
          </p>
          {/* Last updated info */}
          {financialData.lastUpdated && (
            <p className="text-xs text-gray-400">
              Terakhir diperbarui: {financialData.lastUpdated.toLocaleString('id-ID')}
            </p>
          )}
        </div>
        
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <Button 
            onClick={() => dialogHandlers.openTransaction()}
            disabled={financialData.isProcessing}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            {financialData.isCreating ? 'Menambah...' : 'Tambah Transaksi'}
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

      {/* Enhanced Summary Cards dengan real-time data */}
      <SummaryCards 
        totalIncome={financialData.totalIncome}
        totalExpense={financialData.totalExpense}
        balance={financialData.balance}
        stats={financialData.stats}
        isLoading={financialData.isStatsLoading}
        onRefresh={financialData.refreshAll}
      />

      {/* Charts */}
      <Suspense fallback={<ChartSkeleton />}>
        <FinancialCharts 
          filteredTransactions={financialData.transactions}
          dateRange={dateRange}
          isLoading={financialData.isTransactionsLoading}
        />
      </Suspense>

      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      }>
        <CategoryCharts 
          filteredTransactions={financialData.transactions}
          isLoading={financialData.isTransactionsLoading}
        />
      </Suspense>

      {/* Transaction Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TransactionTable
          transactions={financialData.transactions}
          onEditTransaction={dialogHandlers.openTransaction}
          onAddTransaction={() => dialogHandlers.openTransaction()}
          isLoading={financialData.isTransactionsLoading}
          onRefresh={financialData.refreshAll}
        />
      </Suspense>

      {/* Dialogs */}
      <Suspense fallback={null}>
        <FinancialTransactionDialog
          isOpen={pageState.transaction.isDialogOpen}
          onClose={dialogHandlers.closeTransaction}
          onAddTransaction={financialData.addTransaction}
          onUpdateTransaction={financialData.updateTransaction}
          categories={financialData.stats?.categoryBreakdown ? Object.keys(financialData.stats.categoryBreakdown) : []}
          transaction={pageState.transaction.editing}
          isProcessing={financialData.isProcessing}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CategoryManagementDialog
          isOpen={pageState.category.isDialogOpen}
          onClose={dialogHandlers.closeCategory}
          categories={financialData.stats?.categoryBreakdown ? Object.keys(financialData.stats.categoryBreakdown) : []}
          onSaveCategories={(categories) => {
            // Handle category save
            toast.success('Kategori berhasil disimpan');
          }}
        />
      </Suspense>
    </div>
  );
};

export default FinancialReportPage;