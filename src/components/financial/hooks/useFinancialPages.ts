// src/hooks/useFinancialPage.ts
// ✅ COMPOSITE HOOK - Single hook for pages, no circular dependencies

import { useMemo } from 'react';
import { startOfMonth, endOfDay } from 'date-fns';

// Type imports only
import { DateRange } from '../types/financial';

// Clean hook imports
import {
  useFinancialData,
  useFinancialCalculations,
  useFinancialChartData,
  useFinancialOperations,
  useFinancialForm,
  useFinancialSearch,
  usePagination,
  useDateRange
} from './useFinancialHooks';

// Context imports
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { getFinancialCategories } from '../services/categoryService';
import { 
  DEFAULT_FINANCIAL_CATEGORIES,
  FinancialCategories 
} from '../types/financial';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// ===========================================
// ✅ COMPOSITE HOOK FOR FINANCIAL PAGES
// ===========================================

interface UseFinancialPageOptions {
  initialDateRange?: DateRange;
  itemsPerPage?: number;
  autoSearch?: boolean;
}

/**
 * All-in-one hook for financial pages
 * Replaces the complex useFinancialCore and eliminates circular dependencies
 */
export const useFinancialPage = (options: UseFinancialPageOptions = {}) => {
  const {
    initialDateRange = { 
      from: startOfMonth(new Date()), 
      to: endOfDay(new Date()) 
    },
    itemsPerPage = 10,
    autoSearch = true
  } = options;

  // ===========================================
  // ✅ CORE DATA & SETTINGS
  // ===========================================

  // Fetch financial data
  const { 
    data: transactions = [], 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useFinancialData();

  const { user } = useAuth();

  // ✅ Dynamic categories from transaction data
  const { data: dynamicCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['financial-categories', user?.id],
    queryFn: () => user?.id ? getFinancialCategories(user.id) : Promise.resolve(DEFAULT_FINANCIAL_CATEGORIES),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // User settings
  const { 
    settings, 
    saveSettings, 
    isLoading: settingsLoading 
  } = useUserSettings();

  // Date range management
  const {
    dateRange,
    setDateRange,
    resetToCurrentMonth,
    setToLastMonth,
    setToLastWeek
  } = useDateRange(initialDateRange);

  // Transaction operations
  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading: operationsLoading
  } = useFinancialOperations();

  // ===========================================
  // ✅ CALCULATIONS & PROCESSING
  // ===========================================

  // Calculate financial data based on date range
  const {
    filteredTransactions,
    summary,
    groupedByCategory,
    groupedByType,
    categoryTotals,
    stats
  } = useFinancialCalculations(transactions, dateRange);

  // Generate chart data
  const chartData = useFinancialChartData(filteredTransactions);

  // ===========================================
  // ✅ SEARCH & PAGINATION
  // ===========================================

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    searchResults,
    hasActiveFilters
  } = useFinancialSearch(autoSearch ? filteredTransactions : transactions);

  // Pagination
  const finalTransactions = autoSearch ? searchResults : filteredTransactions;
  const {
    currentItems: paginatedTransactions,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    resetPagination
  } = usePagination(finalTransactions, itemsPerPage);

  // ===========================================
  // ✅ FORM MANAGEMENT
  // ===========================================

  const formHook = useFinancialForm();

  // ===========================================
  // ✅ COMPUTED VALUES
  // ===========================================

  const computedValues = useMemo(() => ({
    // Loading states
    isLoading: transactionsLoading || settingsLoading || operationsLoading,
    hasError: !!transactionsError,

    // Data states
    hasTransactions: transactions.length > 0,
    hasFilteredTransactions: filteredTransactions.length > 0,
    hasSearchResults: searchResults.length > 0,

    // Financial indicators
    isPositiveBalance: summary.balance >= 0,
    hasData: finalTransactions.length > 0,

    // Categories from dynamic transaction data
    categories: dynamicCategories || DEFAULT_FINANCIAL_CATEGORIES,

    // Quick stats
    quickStats: {
      totalTransactions: transactions.length,
      filteredCount: filteredTransactions.length,
      searchResultsCount: searchResults.length,
      currentPageCount: paginatedTransactions.length,
      incomeTransactions: groupedByType.income.length,
      expenseTransactions: groupedByType.expense.length
    }
  }), [
    transactionsLoading,
    categoriesLoading,
    operationsLoading,
    transactionsError,
    transactions.length,
    filteredTransactions.length,
    searchResults.length,
    summary.balance,
    finalTransactions.length,
    dynamicCategories,
    paginatedTransactions.length,
    groupedByType.income.length,
    groupedByType.expense.length
  ]);

  // ===========================================
  // ✅ RETURN COMPLETE API
  // ===========================================

  return {
    // Raw data
    transactions,
    filteredTransactions,
    paginatedTransactions,
    
    // Processed data
    summary,
    chartData,
    groupedByCategory,
    groupedByType,
    categoryTotals,
    stats,
    
    // State management
    dateRange,
    searchQuery,
    filters,
    currentPage,
    
    // Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Date management
    setDateRange,
    resetToCurrentMonth,
    setToLastMonth,
    setToLastWeek,
    
    // Search & filter
    setSearchQuery,
    updateFilter,
    clearFilters,
    
    // Pagination
    goToPage,
    nextPage,
    previousPage,
    resetPagination,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    
    // Form management
    form: formHook,
    
    // Settings
    settings,
    saveSettings,
    
    // Computed values
    ...computedValues,
    
    // Utility functions
    utils: {
      refreshData: () => {
        // Could trigger refetch if needed
      },
      exportData: () => {
        // Could implement export functionality
        return filteredTransactions;
      },
      resetAllFilters: () => {
        clearFilters();
        resetToCurrentMonth();
        resetPagination();
      }
    }
  };
};

// ===========================================
// ✅ SPECIALIZED PAGE HOOKS
// ===========================================

/**
 * Hook specifically for Financial Report Page
 */
export const useFinancialReportPage = () => {
  return useFinancialPage({
    initialDateRange: { 
      from: startOfMonth(new Date()), 
      to: endOfDay(new Date()) 
    },
    itemsPerPage: 20,
    autoSearch: true
  });
};

/**
 * Hook specifically for Financial Dashboard
 */
export const useFinancialDashboard = () => {
  const pageData = useFinancialPage({
    initialDateRange: { 
      from: startOfMonth(new Date()), 
      to: endOfDay(new Date()) 
    },
    itemsPerPage: 5, // Fewer items for dashboard
    autoSearch: false // No search needed for dashboard
  });

  // Dashboard-specific calculations
  const dashboardData = useMemo(() => {
    const recentTransactions = pageData.transactions
      .slice(0, 5)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    const todayTransactions = pageData.transactions.filter(t => {
      const transactionDate = new Date(t.date!);
      const today = new Date();
      return transactionDate.toDateString() === today.toDateString();
    });

    return {
      recentTransactions,
      todayTransactions,
      todayCount: todayTransactions.length,
      todayIncome: todayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      todayExpense: todayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
    };
  }, [pageData.transactions]);

  return {
    ...pageData,
    dashboard: dashboardData
  };
};

/**
 * Hook specifically for Transaction Management
 */
export const useTransactionManagement = () => {
  return useFinancialPage({
    itemsPerPage: 15,
    autoSearch: true
  });
};

// ===========================================
// ✅ EXPORT
// ===========================================

export default {
  useFinancialPage,
  useFinancialReportPage,
  useFinancialDashboard,
  useTransactionManagement
};