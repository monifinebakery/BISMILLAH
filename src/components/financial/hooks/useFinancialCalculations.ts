// src/components/financial/hooks/useFinancialCalculations.ts
import { useMemo } from 'react';
import {
  filterByDateRange,
  calculateFinancialSummary,
  groupByCategory,
  groupByType,
  calculateCategoryTotals,
  calculateStats
} from '../utils/financialCalculations';
import { FinancialTransaction, DateRange } from '../types/financial';

interface FinancialCalculationsResult {
  filteredTransactions: FinancialTransaction[];
  summary: any; // FinancialSummary
  groupedByCategory: any;
  groupedByType: any;
  categoryTotals: any;
  stats: any;
}

/**
 * Financial Calculations Hook
 * Performs calculations on financial transaction data
 */
export const useFinancialCalculations = (
  transactions: FinancialTransaction[],
  dateRange?: DateRange
): FinancialCalculationsResult => {
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