// src/hooks/useFinancialHooks.ts
// ✅ SPECIALIZED HOOKS - No circular dependencies, optimized performance

import { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfMonth, endOfDay, format, subDays, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

// Type imports only
import { 
  FinancialTransaction, 
  CreateTransactionData, 
  UpdateTransactionData,
  DateRange,
  FinancialSummary,
  FinancialChartData,
  ChartDataPoint,
  CategoryChartData,
  ValidationResult
} from '../types/financial';

// Pure function imports
import {
  filterByDateRange,
  calculateFinancialSummary,
  groupByCategory,
  groupByType,
  calculateCategoryTotals,
  validateTransaction,
  searchTransactions,
  sortTransactions,
  calculateStats
} from '../utils/financialCalculations';

// API imports
import {
  getFinancialTransactions,
  addFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction
} from '../services/financialApi';

// Context imports
import { useAuth } from '@/contexts/AuthContext';

// ===========================================
// ✅ QUERY KEYS
// ===========================================

// ✅ STANDARDIZED: Query Keys for consistent patterns across modules
export const financialQueryKeys = {
  all: ['financial'] as const,
  transactions: (userId?: string) => [...financialQueryKeys.all, 'transactions', userId] as const,
  // ✅ ADD: Additional keys for comprehensive functionality
  summary: (userId?: string, dateRange?: any) => [...financialQueryKeys.all, 'summary', userId, dateRange] as const,
  categories: (userId?: string) => [...financialQueryKeys.all, 'categories', userId] as const,
} as const;

// ===========================================
// ✅ 1. DATA FETCHING HOOK
// ===========================================

export const useFinancialData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: financialQueryKeys.transactions(user?.id),
    queryFn: () => getFinancialTransactions(user!.id),
    enabled: !!user?.id,
    // 🚀 PERFORMANCE: Much more aggressive caching for faster loading
    staleTime: 5 * 60 * 1000, // 5 minutes - longer to avoid unnecessary fetches
    gcTime: 15 * 60 * 1000, // 15 minutes - longer cache time
    retry: 1, // Reduce retry attempts for faster failure
    retryDelay: 1000, // Fixed 1s retry delay
    // 🚀 PERFORMANCE: Reduce refetching to improve perceived speed
    refetchOnWindowFocus: false, // Disable to prevent loading on tab switch
    refetchOnMount: false, // Use cached data if available
    refetchOnReconnect: true, // Only refetch when connection restored
    refetchInterval: false, 
    refetchIntervalInBackground: false,
    // 🚀 PERFORMANCE: Smoother loading experience
    keepPreviousData: true, // Keep previous data during refetch
    placeholderData: [], // Show empty array instead of loading
    notifyOnChangeProps: ['data', 'error'], // Remove isLoading tracking
    // 🚀 PERFORMANCE: Initial data from cache if available
    initialData: undefined,
    select: (data) => {
      // Light processing on select to avoid blocking
      return data || [];
    },
  });
};

// ===========================================
// ✅ 2. CALCULATIONS HOOK (Optimized)
// ===========================================

export const useFinancialCalculations = (
  transactions: FinancialTransaction[],
  dateRange?: DateRange
) => {
  return useMemo(() => {
    // Early return for empty data
    if (!transactions?.length) {
      return {
        filteredTransactions: [],
        summary: { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 },
        groupedByCategory: {},
        groupedByType: { income: [], expense: [] },
        categoryTotals: {},
        stats: {
          summary: { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 },
          avgTransaction: 0,
          topCategory: null,
          categoryBreakdown: {},
          typeBreakdown: { income: 0, expense: 0 }
        }
      };
    }

    // Filter by date range if provided
    const filteredTransactions = dateRange 
      ? filterByDateRange(transactions, dateRange, 'date')
      : transactions;

    // Calculate all derived data
    const summary = calculateFinancialSummary(filteredTransactions);
    const groupedByCategory = groupByCategory(filteredTransactions);
    const groupedByType = groupByType(filteredTransactions);
    const categoryTotals = calculateCategoryTotals(filteredTransactions);
    const stats = calculateStats(filteredTransactions);

    return {
      filteredTransactions,
      summary,
      groupedByCategory,
      groupedByType,
      categoryTotals,
      stats
    };
  }, [transactions, dateRange]);
};

// ===========================================
// ✅ 3. CHART DATA HOOK (Optimized)
// ===========================================

// 🚀 PERFORMANCE: Lazy chart data with deferred calculation
export const useFinancialChartData = (
  filteredTransactions: FinancialTransaction[],
  defer: boolean = false
): FinancialChartData => {
  return useMemo(() => {
    const result: FinancialChartData = {
      transactionData: [],
      dailyData: [],
      categoryData: { incomeData: [], expenseData: [] }
    };

    // 🚀 PERFORMANCE: Skip expensive calculation if deferred or no data
    if (defer || !filteredTransactions?.length) return result;

    // Monthly data processing
    const monthlyData: Record<string, { income: number; expense: number; date: Date }> = {};
    const dailyDataMap: Record<string, { income: number; expense: number; date: Date }> = {};

    filteredTransactions.forEach(t => {
      const transactionDate = new Date(t.date!);
      if (!transactionDate || isNaN(transactionDate.getTime())) return;

      // Monthly aggregation
      const monthStart = startOfMonth(transactionDate);
      const monthYearKey = format(monthStart, 'yyyy-MM');
      if (!monthlyData[monthYearKey]) {
        monthlyData[monthYearKey] = { income: 0, expense: 0, date: monthStart };
      }
      
      if (t.type === 'income') {
        monthlyData[monthYearKey].income += t.amount || 0;
      } else {
        monthlyData[monthYearKey].expense += t.amount || 0;
      }

      // Daily aggregation
      const dayKey = format(transactionDate, 'yyyy-MM-dd');
      if (!dailyDataMap[dayKey]) {
        dailyDataMap[dayKey] = { income: 0, expense: 0, date: transactionDate };
      }
      
      if (t.type === 'income') {
        dailyDataMap[dayKey].income += t.amount || 0;
      } else {
        dailyDataMap[dayKey].expense += t.amount || 0;
      }
    });

    // Transform monthly data
    result.transactionData = Object.values(monthlyData)
      .map(value => ({
        month: format(value.date, 'MMM yyyy', { locale: localeId }),
        Pemasukan: value.income,
        Pengeluaran: value.expense,
        Saldo: value.income - value.expense,
        date: format(value.date, 'yyyy-MM-dd')
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 🚀 PERFORMANCE: Optimize daily data generation - only if needed
    // Only generate daily data if we have recent transactions
    const hasRecentData = Object.keys(dailyDataMap).length > 0;
    if (hasRecentData) {
      const today = endOfDay(new Date());
      const dailyDataArray = [];
      
      // 🚀 Pre-generate date keys to avoid repeated format calls
      for (let i = 0; i < 30; i++) {
        const currentDate = startOfDay(subDays(today, 29 - i));
        const dayKey = format(currentDate, 'yyyy-MM-dd');
        const existingData = dailyDataMap[dayKey] || { income: 0, expense: 0 };
        
        dailyDataArray.push({
          date: format(currentDate, 'd MMM', { locale: localeId }),
          Pemasukan: existingData.income,
          Pengeluaran: existingData.expense,
          Saldo: existingData.income - existingData.expense
        });
      }
      result.dailyData = dailyDataArray;
    }

    // Category data
    const categoryTotals = calculateCategoryTotals(filteredTransactions);
    const groupedByType = groupByType(filteredTransactions);

    // Income categories
    const incomeCategories: Record<string, number> = {};
    groupedByType.income.forEach(t => {
      const category = t.category || 'Lainnya';
      incomeCategories[category] = (incomeCategories[category] || 0) + (t.amount || 0);
    });

    // Expense categories
    const expenseCategories: Record<string, number> = {};
    groupedByType.expense.forEach(t => {
      const category = t.category || 'Lainnya';
      expenseCategories[category] = (expenseCategories[category] || 0) + (t.amount || 0);
    });

    result.categoryData = {
      incomeData: Object.entries(incomeCategories).map(([name, value]) => ({ name, value })),
      expenseData: Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))
    };

    return result;
  }, [
    filteredTransactions, 
    defer,
    // 🚀 PERFORMANCE: Add length check to avoid recalc on same data
    filteredTransactions?.length
  ]);
};

// ===========================================
// ✅ 4. TRANSACTION OPERATIONS HOOK
// ===========================================

export const useFinancialOperations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Add transaction mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateTransactionData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return addFinancialTransaction(data, user.id);
    },
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions(user?.id)
      );

      // Optimistic update
      const optimisticTransaction: FinancialTransaction = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        ...newTransaction,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(
        financialQueryKeys.transactions(user?.id),
        (old: FinancialTransaction[] = []) => [optimisticTransaction, ...old]
      );

      return { previousTransactions };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(user?.id),
          context.previousTransactions
        );
      }
      toast.error(`Gagal menambahkan transaksi: ${error.message}`);
    },
    onSuccess: () => {
      // Only refresh the transactions list; optimistic update already updated UI
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id),
        exact: true,
      });
      toast.success('Transaksi berhasil ditambahkan');
    }
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) => 
      updateFinancialTransaction(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions(user?.id)
      );

      queryClient.setQueryData(
        financialQueryKeys.transactions(user?.id),
        (old: FinancialTransaction[] = []) =>
          old.map(transaction =>
            transaction.id === id
              ? { ...transaction, ...data, updatedAt: new Date() }
              : transaction
          )
      );

      return { previousTransactions };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(user?.id),
          context.previousTransactions
        );
      }
      toast.error(`Gagal memperbarui transaksi: ${error.message}`);
    },
    onSuccess: () => {
      // Only refresh the transactions list to avoid global refetch storms
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id),
        exact: true,
      });
      toast.success('Transaksi berhasil diperbarui');
    }
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id) 
      });

      const previousTransactions = queryClient.getQueryData(
        financialQueryKeys.transactions(user?.id)
      ) as FinancialTransaction[];

      queryClient.setQueryData(
        financialQueryKeys.transactions(user?.id),
        (old: FinancialTransaction[] = []) => old.filter(t => t.id !== id)
      );

      return { previousTransactions };
    },
    onError: (error: any, id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          financialQueryKeys.transactions(user?.id),
          context.previousTransactions
        );
      }
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
    onSuccess: () => {
      // Only refresh the transactions list after deletion
      queryClient.invalidateQueries({ 
        queryKey: financialQueryKeys.transactions(user?.id),
        exact: true,
      });
      toast.success('Transaksi berhasil dihapus');
    }
  });

  return {
    addTransaction: addMutation.mutateAsync,
    updateTransaction: (id: string, data: UpdateTransactionData) => 
      updateMutation.mutateAsync({ id, data }),
    deleteTransaction: deleteMutation.mutateAsync,
    isLoading: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
};

// ===========================================
// ✅ 5. FORM MANAGEMENT HOOK
// ===========================================

export const useFinancialForm = (
  initialTransaction?: FinancialTransaction | null
) => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    category: '',
    description: '',
    date: new Date()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when transaction changes
  const initializeForm = useCallback((transaction?: FinancialTransaction | null) => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category || '',
        description: transaction.description || '',
        date: new Date(transaction.date!)
      });
    } else {
      setFormData({
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
        date: new Date()
      });
    }
    setErrors({});
  }, []);

  // Update form field
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Reset category when type changes
      if (field === 'type') {
        newData.category = '';
      }
      return newData;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): ValidationResult => {
    const result = validateTransaction(formData);
    
    // Convert to form-specific error format
    const formErrors: Record<string, string> = {};
    result.errors.forEach(error => {
      if (error.includes('Jumlah')) formErrors.amount = error;
      if (error.includes('Kategori')) formErrors.category = error;
      if (error.includes('Deskripsi')) formErrors.description = error;
      if (error.includes('Tanggal')) formErrors.date = error;
    });
    
    setErrors(formErrors);
    return result;
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    initializeForm();
  }, [initializeForm]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    initializeForm,
    isValid: Object.keys(errors).length === 0
  };
};

// ===========================================
// ✅ 6. SEARCH & FILTER HOOK
// ===========================================

export const useFinancialSearch = (transactions: FinancialTransaction[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    type?: 'income' | 'expense';
    category?: string;
    dateRange?: DateRange;
    amountRange?: { min?: number; max?: number };
  }>({});

  const searchResults = useMemo(() => {
    return searchTransactions(transactions, searchQuery, filters);
  }, [transactions, searchQuery, filters]);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    searchResults,
    hasActiveFilters: Object.keys(filters).length > 0 || searchQuery.length > 0
  };
};

// ===========================================
// ✅ 7. PAGINATION HOOK
// ===========================================

export const usePagination = <T>(
  items: T[],
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const firstItem = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(firstItem, firstItem + itemsPerPage);

    return {
      currentItems,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems: items.length,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  }, [paginationData.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPreviousPage]);

  // Reset page when items change
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    ...paginationData,
    setCurrentPage,
    goToPage,
    nextPage,
    previousPage,
    resetPagination
  };
};

// ===========================================
// ✅ 8. DATE RANGE HOOK
// ===========================================

export const useDateRange = (initialRange?: DateRange) => {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || { 
      from: startOfMonth(new Date()), 
      to: endOfDay(new Date()) 
    }
  );

  const updateDateRange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const resetToCurrentMonth = useCallback(() => {
    setDateRange({ 
      from: startOfMonth(new Date()), 
      to: endOfDay(new Date()) 
    });
  }, []);

  const setToLastMonth = useCallback(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    setDateRange({
      from: startOfMonth(lastMonth),
      to: endOfDay(lastMonth)
    });
  }, []);

  const setToLastWeek = useCallback(() => {
    const today = new Date();
    const lastWeek = subDays(today, 7);
    setDateRange({
      from: startOfDay(lastWeek),
      to: endOfDay(today)
    });
  }, []);

  return {
    dateRange,
    setDateRange: updateDateRange,
    resetToCurrentMonth,
    setToLastMonth,
    setToLastWeek
  };
};