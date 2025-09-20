// src/components/financial/hooks/useFinancialChartData.ts
import { useMemo } from 'react';
import { startOfMonth, endOfDay, format, subDays, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { FinancialTransaction, FinancialChartData } from '../types/financial';

/**
 * Financial Chart Data Hook
 * Transforms financial transaction data for chart visualization
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

    if (!filteredTransactions?.length) return result;

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

    // Transform daily data (last 30 days)
    const today = endOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      const currentDate = startOfDay(subDays(today, 29 - i));
      const dayKey = format(currentDate, 'yyyy-MM-dd');
      const existingData = dailyDataMap[dayKey] || { income: 0, expense: 0 };
      
      result.dailyData.push({
        date: format(currentDate, 'd MMM', { locale: localeId }),
        Pemasukan: existingData.income,
        Pengeluaran: existingData.expense,
        Saldo: existingData.income - existingData.expense
      });
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
  }, [filteredTransactions]);
};

// Helper functions (these should be imported from financialCalculations.ts)
function calculateCategoryTotals(transactions: FinancialTransaction[]) {
  // Placeholder implementation
  return {};
}

function groupByType(transactions: FinancialTransaction[]) {
  // Placeholder implementation
  return { income: [], expense: [] };
}