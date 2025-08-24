// src/components/financial/hooks/useFinancialContext.ts
// ✅ FIXED - No circular dependencies, correct imports

import { useCallback, useMemo } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import {
  FinancialTransaction,
  FinancialSummary,
  DateRange,
  CreateTransactionData,
  UpdateTransactionData
} from '../types/financial';
import {
  filterByDateRange,
  calculateFinancialSummary,
  groupByCategory,
  groupByType
} from '../utils/financialCalculations'; // ✅ FIXED: Changed from financialUtils

// ===========================================
// ✅ ENHANCED FINANCIAL HOOKS
// ===========================================

/**
 * Hook dengan computed values dan helper functions
 * ✅ RENAMED: Avoid conflict with main useFinancialData hook
 */
export const useFinancialDataComputed = () => {
  const context = useFinancial();
  
  const computedValues = useMemo(() => {
    const summary = calculateFinancialSummary(context.financialTransactions);
    const grouped = groupByType(context.financialTransactions);
    const categories = groupByCategory(context.financialTransactions);
    
    return {
      summary,
      grouped,
      categories,
      totalTransactions: context.financialTransactions.length,
      hasTransactions: context.financialTransactions.length > 0
    };
  }, [context.financialTransactions]);

  return {
    ...context,
    ...computedValues
  };
};

/**
 * Hook untuk filtered transactions berdasarkan date range
 */
export const useFilteredTransactions = (dateRange?: DateRange) => {
  const { financialTransactions, isLoading } = useFinancial();
  
  const filteredData = useMemo(() => {
    if (!dateRange) {
      return {
        transactions: financialTransactions,
        summary: calculateFinancialSummary(financialTransactions)
      };
    }
    
    const filtered = filterByDateRange(financialTransactions, dateRange, 'date');
    const summary = calculateFinancialSummary(filtered);
    
    return {
      transactions: filtered,
      summary
    };
  }, [financialTransactions, dateRange]);

  return {
    ...filteredData,
    isLoading,
    hasData: filteredData.transactions.length > 0
  };
};

/**
 * Hook untuk transaction operations dengan optimistic updates
 */
export const useTransactionOperations = () => {
  const { 
    addFinancialTransaction, 
    updateFinancialTransaction, 
    deleteFinancialTransaction,
    isLoading 
  } = useFinancial();

  const addTransaction = useCallback(async (
    data: CreateTransactionData,
    options?: { optimistic?: boolean }
  ) => {
    // Could add optimistic update logic here
    return await addFinancialTransaction(data);
  }, [addFinancialTransaction]);

  const updateTransaction = useCallback(async (
    id: string,
    data: UpdateTransactionData,
    options?: { optimistic?: boolean }
  ) => {
    // Could add optimistic update logic here
    return await updateFinancialTransaction(id, data);
  }, [updateFinancialTransaction]);

  const deleteTransaction = useCallback(async (
    id: string,
    options?: { optimistic?: boolean }
  ) => {
    // Could add optimistic update logic here
    return await deleteFinancialTransaction(id);
  }, [deleteFinancialTransaction]);

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading
  };
};

/**
 * Hook untuk category-specific operations
 */
export const useCategoryData = () => {
  const { financialTransactions } = useFinancial();
  
  const categoryAnalysis = useMemo(() => {
    const categorized = groupByCategory(financialTransactions);
    const byType = groupByType(financialTransactions);
    
    // Get unique categories
    const allCategories = [
      ...new Set(financialTransactions.map(t => t.category).filter(Boolean))
    ] as string[];
    
    // Category totals
    const categoryTotals = Object.entries(categorized).reduce((acc, [category, transactions]) => {
      acc[category] = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      return acc;
    }, {} as Record<string, number>);
    
    // Top categories
    const topIncomeCategories = Object.entries(categoryTotals)
      .filter(([category]) => 
        byType.income.some(t => t.category === category)
      )
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
      
    const topExpenseCategories = Object.entries(categoryTotals)
      .filter(([category]) => 
        byType.expense.some(t => t.category === category)
      )
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      categorized,
      allCategories,
      categoryTotals,
      topIncomeCategories,
      topExpenseCategories,
      categoryCount: allCategories.length
    };
  }, [financialTransactions]);

  const getTransactionsByCategory = useCallback((category: string) => {
    return financialTransactions.filter(t => t.category === category);
  }, [financialTransactions]);

  const getCategoryTotal = useCallback((category: string) => {
    return categoryAnalysis.categoryTotals[category] || 0;
  }, [categoryAnalysis.categoryTotals]);

  return {
    ...categoryAnalysis,
    getTransactionsByCategory,
    getCategoryTotal
  };
};

/**
 * Hook untuk recent transactions dengan utilities
 */
export const useRecentTransactions = (limit: number = 5) => {
  const { financialTransactions } = useFinancial();
  
  const recentData = useMemo(() => {
    const sorted = [...financialTransactions]
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
    
    const recent = sorted.slice(0, limit);
    const todaysTransactions = sorted.filter(t => {
      const transactionDate = new Date(t.date || 0);
      const today = new Date();
      return transactionDate.toDateString() === today.toDateString();
    });
    
    return {
      recent,
      todaysTransactions,
      recentCount: recent.length,
      todaysCount: todaysTransactions.length
    };
  }, [financialTransactions, limit]);

  return recentData;
};

/**
 * Hook untuk search dan filter transactions
 */
export const useTransactionSearch = () => {
  const { financialTransactions } = useFinancial();
  
  const searchTransactions = useCallback((
    query: string,
    filters?: {
      type?: 'income' | 'expense';
      category?: string;
      dateRange?: DateRange;
      amountRange?: { min?: number; max?: number };
    }
  ) => {
    let results = [...financialTransactions];
    
    // Text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(t => 
        (t.description || '').toLowerCase().includes(searchTerm) ||
        (t.category || '').toLowerCase().includes(searchTerm)
      );
    }
    
    // Type filter
    if (filters?.type) {
      results = results.filter(t => t.type === filters.type);
    }
    
    // Category filter
    if (filters?.category) {
      results = results.filter(t => t.category === filters.category);
    }
    
    // Date range filter
    if (filters?.dateRange) {
      results = filterByDateRange(results, filters.dateRange, 'date');
    }
    
    // Amount range filter
    if (filters?.amountRange) {
      const { min, max } = filters.amountRange;
      results = results.filter(t => {
        const amount = t.amount || 0;
        return (!min || amount >= min) && (!max || amount <= max);
      });
    }
    
    return results;
  }, [financialTransactions]);

  return {
    searchTransactions,
    totalTransactions: financialTransactions.length
  };
};

// ===========================================
// ✅ BATCH OPERATIONS HOOK
// ===========================================

/**
 * Hook untuk batch operations (bulk delete, bulk update, etc.)
 */
export const useBatchOperations = () => {
  const { deleteFinancialTransaction, updateFinancialTransaction } = useFinancial();
  
  const bulkDelete = useCallback(async (ids: string[]) => {
    const results = await Promise.allSettled(
      ids.map(id => deleteFinancialTransaction(id))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    
    return { successful, failed, total: results.length };
  }, [deleteFinancialTransaction]);
  
  const bulkUpdate = useCallback(async (
    updates: Array<{ id: string; data: UpdateTransactionData }>
  ) => {
    const results = await Promise.allSettled(
      updates.map(({ id, data }) => updateFinancialTransaction(id, data))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    
    return { successful, failed, total: results.length };
  }, [updateFinancialTransaction]);

  return {
    bulkDelete,
    bulkUpdate
  };
};

// ===========================================
// ✅ COMBINED EXPORT
// ===========================================

export const FinancialContextHooks = {
  useFinancialDataComputed,
  useFilteredTransactions,
  useTransactionOperations,
  useCategoryData,
  useRecentTransactions,
  useTransactionSearch,
  useBatchOperations
};

export default FinancialContextHooks;