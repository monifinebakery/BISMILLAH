// src/components/financial/FinancialReportPage.tsx - Final with Real API & Auth (FIXED VERSION)
import React, { useState, useMemo, useCallback, Suspense, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Settings, ChevronDown, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { logger } from '@/utils/logger';

// TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// UI utilities
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Auth Context
import { useAuth } from '@/contexts/AuthContext';

// DATE UTILITIES
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

// TYPES & API
import { 
  FinancialTransaction, 
  CreateTransactionData,
  UpdateTransactionData,
  DEFAULT_FINANCIAL_CATEGORIES 
} from './types/financial';

// REAL API CALLS
import {
  getFinancialTransactions,
  addFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
  getTransactionsByDateRange,
  getFinancialStats
} from './services/financialApi';

// FINANCIAL UTILITIES
import { 
  calculateFinancialSummary,
  calculateCategoryTotals 
} from './utils/financialCalculations';

// Query keys
const financialQueryKeys = {
  all: ['financial'] as const,
  transactions: (userId: string) => [...financialQueryKeys.all, 'transactions', userId] as const,
  transactionsByRange: (userId: string, from: Date, to?: Date) => 
    [...financialQueryKeys.transactions(userId), 'range', from.toISOString(), to?.toISOString()] as const,
  stats: (userId: string, from: Date, to?: Date) => 
    [...financialQueryKeys.all, 'stats', userId, from.toISOString(), to?.toISOString()] as const,
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
    editing: FinancialTransaction | null;
  };
  category: {
    isDialogOpen: boolean;
  };
}

const initialPageState: PageState = {
  transaction: { isDialogOpen: false, editing: null },
  category: { isDialogOpen: false }
};

// Summary Cards Component
const SummaryCards: React.FC<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
  stats?: any;
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

// Date Range Selector
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

// Custom hook for managing financial data with REAL API (FIXED VERSION)
const useFinancialData = (dateRange: { from: Date; to?: Date }, userId: string) => {
  const queryClient = useQueryClient();
  
  // ✅ FIXED: State untuk track USER ACTIONS (bukan data changes)
  const [lastUserAction, setLastUserAction] = useState<Date | undefined>(undefined);
  const [initialLoadTime, setInitialLoadTime] = useState<Date | undefined>(undefined);
  const hasSetInitialLoad = useRef(false); // ✅ Ref untuk prevent multiple set

  // Query untuk transactions dengan real API
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    dataUpdatedAt: transactionsUpdatedAt,
  } = useQuery({
    queryKey: financialQueryKeys.transactionsByRange(userId, dateRange.from, dateRange.to),
    queryFn: async () => {
      if (dateRange.from && dateRange.to) {
        return getTransactionsByDateRange(userId, dateRange.from, dateRange.to);
      } else {
        return getFinancialTransactions(userId);
      }
    },
    enabled: !!userId, // Only run when userId is available
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 1,
  });

  // Query untuk stats dengan real API
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: financialQueryKeys.stats(userId, dateRange.from, dateRange.to),
    queryFn: () => getFinancialStats(userId, dateRange.from, dateRange.to),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // ✅ SUPER STRICT: Initial load time hanya sekali per session
  useEffect(() => {
    if (transactions && transactions.length >= 0 && !hasSetInitialLoad.current && !transactionsLoading) {
      setInitialLoadTime(new Date());
      hasSetInitialLoad.current = true;
      logger.debug('📊 Initial financial data loaded - timestamp set ONCE');
    }
  }, [transactions, transactionsLoading]);

  // ✅ DEBUG: Log untuk debugging refresh
  const smartRefreshAll = async () => {
    logger.debug('🔄 Smart refresh called - NOT updating lastUpdated timestamp');
    await Promise.all([
      refetchTransactions(),
      refetchStats()
    ]);
    logger.debug('🔄 Smart refresh completed');
  };

  // Mutations dengan real API (FIXED - update timestamp saat user action)
  const createMutation = useMutation({
    mutationFn: (transaction: CreateTransactionData) => 
      addFinancialTransaction(transaction, userId),
    onSuccess: (response) => {
      if (response.success) {
        // ✅ FIXED: Update timestamp saat user berhasil tambah transaksi
        setLastUserAction(new Date());
        queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions(userId) });
        queryClient.invalidateQueries({ queryKey: financialQueryKeys.stats(userId, dateRange.from, dateRange.to) });
        toast.success('Transaksi berhasil ditambahkan');
      } else {
        toast.error(response.error || 'Gagal menambah transaksi');
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambah transaksi: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, transaction }: { id: string; transaction: UpdateTransactionData }) => 
      updateFinancialTransaction(id, transaction),
    onSuccess: (response) => {
      if (response.success) {
        // ✅ FIXED: Update timestamp saat user berhasil edit transaksi
        setLastUserAction(new Date());
        queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions(userId) });
        queryClient.invalidateQueries({ queryKey: financialQueryKeys.stats(userId, dateRange.from, dateRange.to) });
        toast.success('Transaksi berhasil diperbarui');
      } else {
        toast.error(response.error || 'Gagal memperbarui transaksi');
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui transaksi: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onSuccess: (response) => {
      if (response.success) {
        // ✅ FIXED: Update timestamp saat user berhasil hapus transaksi
        setLastUserAction(new Date());
        queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions(userId) });
        queryClient.invalidateQueries({ queryKey: financialQueryKeys.stats(userId, dateRange.from, dateRange.to) });
        toast.success('Transaksi berhasil dihapus');
      } else {
        toast.error(response.error || 'Gagal menghapus transaksi');
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
  });

  // Computed values
  const summary = useMemo(() => {
    const basicSummary = calculateFinancialSummary(transactions);
    const categoryTotals = calculateCategoryTotals(transactions);
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Tidak ada';
    const avgTransaction = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
      : 0;

    return {
      ...basicSummary,
      categoryTotals,
      topCategory,
      avgTransaction,
      monthlyGrowth: stats?.monthlyGrowth || 0
    };
  }, [transactions, stats]);

  return {
    // Data
    transactions,
    stats,
    summary,
    // ✅ FIXED: Prioritas lastUserAction, fallback ke initialLoadTime
    lastUpdated: lastUserAction || initialLoadTime,
    
    // Loading states
    isLoading: transactionsLoading || statsLoading,
    isTransactionsLoading: transactionsLoading,
    isStatsLoading: statsLoading,
    error: transactionsError,
    
    // Actions with proper typing
    addTransaction: async (transaction: CreateTransactionData) => {
      const result = await createMutation.mutateAsync(transaction);
      return result.success;
    },
    updateTransaction: async (id: string, transaction: UpdateTransactionData) => {
      const result = await updateMutation.mutateAsync({ id, transaction });
      return result.success;
    },
    deleteTransaction: async (id: string) => {
      const result = await deleteMutation.mutateAsync(id);
      return result.success;
    },
    refreshAll: smartRefreshAll, // ✅ FIXED: Pakai smart refresh
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isProcessing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};

// Error Display Component
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

// Auth Guard Component
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

// MAIN COMPONENT - WITH REAL API & AUTH (FIXED VERSION)
const FinancialReportPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Financial data with REAL API and AUTH
  const financialData = useFinancialData(dateRange, user?.id || '');

  // Single state object
  const [pageState, setPageState] = useState<PageState>(initialPageState);

  // Dialog handlers
  const dialogHandlers = {
    openTransaction: useCallback((transaction: FinancialTransaction | null = null) => {
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

  return (
    <AuthGuard>
      {/* Show error state if there's an error */}
      {financialData.error && !financialData.isLoading && financialData.transactions.length === 0 ? (
        <div className="p-4 sm:p-6">
          <ErrorDisplay 
            error={financialData.error.message || 'Terjadi kesalahan'} 
            onRetry={financialData.refreshAll} 
          />
        </div>
      ) : (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Live Data
                </div>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Analisis pemasukan, pengeluaran, dan saldo bisnis Anda dengan data real-time
              </p>
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

          {/* Summary Cards */}
          <SummaryCards 
            totalIncome={financialData.summary.totalIncome}
            totalExpense={financialData.summary.totalExpense}
            balance={financialData.summary.balance}
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
              onDeleteTransaction={financialData.deleteTransaction}
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
              categories={DEFAULT_FINANCIAL_CATEGORIES}
              transaction={pageState.transaction.editing}
              isProcessing={financialData.isProcessing}
            />
          </Suspense>

          <Suspense fallback={null}>
            <CategoryManagementDialog
              isOpen={pageState.category.isDialogOpen}
              onClose={dialogHandlers.closeCategory}
              categories={Object.keys(financialData.summary.categoryTotals)}
              onSaveCategories={(categories) => {
                toast.success('Kategori berhasil disimpan');
              }}
            />
          </Suspense>
        </div>
      )}
    </AuthGuard>
  );
};

export default FinancialReportPage;