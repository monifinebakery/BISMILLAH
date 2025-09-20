// src/components/financial/hooks/useFinancialChartData.ts
import { useMemo } from 'react';
import { startOfMonth, endOfDay, format, subDays, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { FinancialTransaction, FinancialChartData } from '../types/financial';

/**
 * Optimized Financial Chart Data Hook
 * Transforms financial transaction data for chart visualization with minimal computation
 */
export const useFinancialChartData = (
  filteredTransactions: FinancialTransaction[],
  skipProcessing = false
): FinancialChartData => {
  return useMemo(() => {
    // Return empty data immediately if processing should be skipped or no data
    if (skipProcessing || !filteredTransactions?.length) {
      return {
        transactionData: [],
        dailyData: [],
        categoryData: { incomeData: [], expenseData: [] }
      };
    }

    // Simple aggregation - combine monthly and daily processing in single loop
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    const dailyData: Record<string, { income: number; expense: number }> = {};
    const incomeCategories: Record<string, number> = {};
    const expenseCategories: Record<string, number> = {};

    // Single loop for all processing - much faster
    filteredTransactions.forEach(t => {
      const amount = t.amount || 0;
      const isIncome = t.type === 'income';
      const category = t.category || 'Lainnya';
      
      try {
        const transactionDate = new Date(t.date!);
        if (isNaN(transactionDate.getTime())) return;

        // Monthly key - simpler format
        const monthKey = transactionDate.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        // Daily key - simpler format
        const dayKey = transactionDate.toISOString().slice(0, 10); // YYYY-MM-DD
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { income: 0, expense: 0 };
        }

        // Update all data in single pass
        if (isIncome) {
          monthlyData[monthKey].income += amount;
          dailyData[dayKey].income += amount;
          incomeCategories[category] = (incomeCategories[category] || 0) + amount;
        } else {
          monthlyData[monthKey].expense += amount;
          dailyData[dayKey].expense += amount;
          expenseCategories[category] = (expenseCategories[category] || 0) + amount;
        }
      } catch {
        // Skip invalid dates silently
      }
    });

    // Fast transformation - minimal date formatting
    const transactionData = Object.entries(monthlyData)
      .map(([monthKey, data]) => ({
        month: monthKey,
        Pemasukan: data.income,
        Pengeluaran: data.expense,
        Saldo: data.income - data.expense,
        date: monthKey
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Simple daily data - only process last 30 days, no complex date operations
    const dailyDataArray = Object.entries(dailyData)
      .map(([dateKey, data]) => ({
        date: dateKey.slice(-5), // Show MM-DD only
        Pemasukan: data.income,
        Pengeluaran: data.expense,
        Saldo: data.income - data.expense
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Only last 30 entries

    return {
      transactionData,
      dailyData: dailyDataArray,
      categoryData: {
        incomeData: Object.entries(incomeCategories).map(([name, value]) => ({ name, value })),
        expenseData: Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))
      }
    };
  }, [filteredTransactions, skipProcessing]);
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