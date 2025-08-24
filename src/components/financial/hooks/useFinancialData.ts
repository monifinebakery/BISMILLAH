// src/components/financial/hooks/useFinancialData.ts
// ✅ FIXED - No circular dependencies, correct imports

import { useMemo, useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfDay, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

// ✅ FIXED: Import from correct file - changed from financialUtils to financialCalculations
import {
  filterByDateRange,
  calculateTotalIncome,
  calculateTotalExpense,
  groupByCategory,
  calculateCategoryTotals
} from '../utils/financialCalculations';

// ✅ FIXED: Import FinancialTransaction from types
import { FinancialTransaction } from '../types/financial';

// ===========================================
// TYPES
// ===========================================

export interface ChartDataPoint {
  date: string;
  month?: string;
  Pemasukan: number;
  Pengeluaran: number;
  Saldo: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface FinancialChartData {
  transactionData: ChartDataPoint[];
  dailyData: ChartDataPoint[];
  categoryData: {
    incomeData: CategoryData[];
    expenseData: CategoryData[];
  };
}

// ===========================================
// CUSTOM HOOKS
// ===========================================

/**
 * Hook untuk memproses data keuangan berdasarkan date range
 * ✅ RENAMED: Avoid conflict with main useFinancialData hook
 */
export const useFinancialDataProcessing = (
  transactions: FinancialTransaction[],
  dateRange: { from: Date; to?: Date }
) => {
  return useMemo(() => {
    // Filter transactions by date range
    const filteredTransactions = filterByDateRange(transactions, dateRange, 'date')
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    // Calculate totals
    const totalIncome = calculateTotalIncome(filteredTransactions);
    const totalExpense = calculateTotalExpense(filteredTransactions);
    const balance = totalIncome - totalExpense;

    return {
      filteredTransactions,
      totalIncome,
      totalExpense,
      balance,
      transactionCount: filteredTransactions.length
    };
  }, [transactions, dateRange]);
};

/**
 * Hook untuk memproses data chart
 */
export const useFinancialChartData = (
  filteredTransactions: FinancialTransaction[]
): FinancialChartData => {
  return useMemo(() => {
    const result: FinancialChartData = {
      transactionData: [],
      dailyData: [],
      categoryData: { incomeData: [], expenseData: [] }
    };

    if (!filteredTransactions || filteredTransactions.length === 0) {
      return result;
    }

    const monthlyData: Record<string, { income: number; expense: number; date: Date }> = {};
    const dailyDataMap: Record<string, { income: number; expense: number; date: Date }> = {};

    // Process transactions
    filteredTransactions.forEach(t => {
      const transactionDate = new Date(t.date!);
      if (transactionDate) {
        // Monthly data
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

        // Daily data
        const dayKey = format(transactionDate, 'yyyy-MM-dd');
        if (!dailyDataMap[dayKey]) {
          dailyDataMap[dayKey] = { income: 0, expense: 0, date: transactionDate };
        }
        if (t.type === 'income') {
          dailyDataMap[dayKey].income += t.amount || 0;
        } else {
          dailyDataMap[dayKey].expense += t.amount || 0;
        }
      }
    });

    // Transform monthly data
    result.transactionData = Object.values(monthlyData)
      .map(value => ({
        month: format(value.date, 'MMM yyyy', { locale: id }),
        Pemasukan: value.income,
        Pengeluaran: value.expense,
        Saldo: value.income - value.expense,
        date: format(value.date, 'yyyy-MM-dd')
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Transform daily data (last 30 days)
    const today = endOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      const currentDate = startOfDay(subDays(today, 29 - i));
      const dayKey = format(currentDate, 'yyyy-MM-dd');
      const existingData = dailyDataMap[dayKey] || { income: 0, expense: 0 };
      result.dailyData.push({
        date: format(currentDate, 'd MMM', { locale: id }),
        Pemasukan: existingData.income,
        Pengeluaran: existingData.expense,
        Saldo: existingData.income - existingData.expense
      });
    }

    // Category data
    const groupedByType = filteredTransactions.reduce(
      (groups, t) => {
        const category = t.category || 'Lainnya';
        if (t.type === 'income') {
          groups.income[category] = (groups.income[category] || 0) + (t.amount || 0);
        } else {
          groups.expense[category] = (groups.expense[category] || 0) + (t.amount || 0);
        }
        return groups;
      },
      { income: {} as Record<string, number>, expense: {} as Record<string, number> }
    );

    result.categoryData = {
      incomeData: Object.entries(groupedByType.income).map(([name, value]) => ({ name, value })),
      expenseData: Object.entries(groupedByType.expense).map(([name, value]) => ({ name, value }))
    };

    return result;
  }, [filteredTransactions]);
};

/**
 * Hook untuk pagination
 */
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
      totalItems: items.length
    };
  }, [items, currentPage, itemsPerPage]);

  // Reset page when items change
  useEffect(() => {
    if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, paginationData.totalPages, currentPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  }, [paginationData.totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    ...paginationData,
    setCurrentPage,
    goToPage,
    nextPage,
    previousPage
  };
};

/**
 * Hook untuk managing financial form state
 */
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
  useEffect(() => {
    if (initialTransaction) {
      setFormData({
        type: initialTransaction.type,
        amount: initialTransaction.amount,
        category: initialTransaction.category || '',
        description: initialTransaction.description || '',
        date: new Date(initialTransaction.date!)
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
  }, [initialTransaction]);

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

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Jumlah harus lebih dari 0';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Kategori wajib dipilih';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi tidak boleh kosong';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      type: 'expense',
      amount: 0,
      category: '',
      description: '',
      date: new Date()
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
};

export default {
  useFinancialDataProcessing,
  useFinancialChartData,
  usePagination,
  useFinancialForm
};