// src/utils/financialUtils.ts
// Modular Financial Utilities with proper TypeScript types

import { safeParseDate } from '@/utils/unifiedDateUtils';

// ===========================================
// TYPES
// ===========================================

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string | null;
  amount: number;
  description: string | null;
  date: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  userId?: string;
  relatedId?: string | null;
}

export interface DateRange {
  from: Date | string;
  to?: Date | string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

// ===========================================
// CORE FILTERING FUNCTIONS
// ===========================================

/**
 * Filter transactions by date range
 * @param transactions - Array of transactions
 * @param dateRange - Date range object with from/to dates
 * @param dateKey - Property name for the date field
 * @returns Filtered transactions
 */
export const filterByDateRange = <T extends Record<string, any>>(
  transactions: T[],
  dateRange: DateRange | null | undefined,
  dateKey: string = 'date'
): T[] => {
  if (!transactions || !Array.isArray(transactions) || !dateRange?.from) {
    return [];
  }

  try {
    const fromDate = safeParseDate(dateRange.from);
    const toDate = dateRange.to ? safeParseDate(dateRange.to) : fromDate;

    if (!fromDate) {
      console.warn('Invalid from date in filterByDateRange');
      return [];
    }

    const fromTime = fromDate.setHours(0, 0, 0, 0);
    const toTime = toDate ? toDate.setHours(23, 59, 59, 999) : fromTime;

    return transactions.filter(item => {
      const itemDateValue = item[dateKey];
      if (!itemDateValue) return false;

      const itemDate = safeParseDate(itemDateValue);
      if (!itemDate) return false;

      const itemTime = itemDate.getTime();
      return itemTime >= fromTime && itemTime <= toTime;
    });
  } catch (error) {
    console.error('Error in filterByDateRange:', error);
    return [];
  }
};

/**
 * Filter transactions by type
 * @param transactions - Array of financial transactions
 * @param type - Transaction type to filter by
 * @returns Filtered transactions
 */
export const filterByType = (
  transactions: FinancialTransaction[],
  type: 'income' | 'expense'
): FinancialTransaction[] => {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }
  return transactions.filter(t => t.type === type);
};

/**
 * Filter transactions by category
 * @param transactions - Array of financial transactions
 * @param category - Category name to filter by
 * @returns Filtered transactions
 */
export const filterByCategory = (
  transactions: FinancialTransaction[],
  category: string
): FinancialTransaction[] => {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }
  return transactions.filter(t => t.category === category);
};

// ===========================================
// CALCULATION FUNCTIONS
// ===========================================

/**
 * Calculate total income from financial transactions
 * @param transactions - Array of financial transactions
 * @returns Total income amount
 */
export const calculateTotalIncome = (transactions: FinancialTransaction[]): number => {
  if (!transactions || !Array.isArray(transactions)) {
    return 0;
  }
  
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

/**
 * Calculate total expense from financial transactions
 * @param transactions - Array of financial transactions
 * @returns Total expense amount
 */
export const calculateTotalExpense = (transactions: FinancialTransaction[]): number => {
  if (!transactions || !Array.isArray(transactions)) {
    return 0;
  }
  
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

/**
 * Calculate gross revenue from orders (for business revenue tracking)
 * @param orders - Array of order objects
 * @param totalField - Field name containing order total
 * @returns Total gross revenue
 */
export const calculateGrossRevenue = <T extends Record<string, any>>(
  orders: T[],
  totalField: string = 'total'
): number => {
  if (!orders || !Array.isArray(orders)) {
    return 0;
  }
  
  return orders.reduce((sum, order) => sum + (order[totalField] || 0), 0);
};

/**
 * Calculate financial summary
 * @param transactions - Array of financial transactions
 * @returns Summary object with totals and balance
 */
export const calculateFinancialSummary = (
  transactions: FinancialTransaction[]
): FinancialSummary => {
  if (!transactions || !Array.isArray(transactions)) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0
    };
  }

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpense = calculateTotalExpense(transactions);
  
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: transactions.length
  };
};

// ===========================================
// GROUPING FUNCTIONS
// ===========================================

/**
 * Group transactions by category
 * @param transactions - Array of financial transactions
 * @returns Object with categories as keys and transaction arrays as values
 */
export const groupByCategory = (
  transactions: FinancialTransaction[]
): Record<string, FinancialTransaction[]> => {
  if (!transactions || !Array.isArray(transactions)) {
    return {};
  }

  return transactions.reduce((groups, transaction) => {
    const category = transaction.category || 'Lainnya';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(transaction);
    return groups;
  }, {} as Record<string, FinancialTransaction[]>);
};

/**
 * Group transactions by type
 * @param transactions - Array of financial transactions
 * @returns Object with income and expense transaction arrays
 */
export const groupByType = (
  transactions: FinancialTransaction[]
): { income: FinancialTransaction[]; expense: FinancialTransaction[] } => {
  if (!transactions || !Array.isArray(transactions)) {
    return { income: [], expense: [] };
  }

  return transactions.reduce(
    (groups, transaction) => {
      if (transaction.type === 'income') {
        groups.income.push(transaction);
      } else {
        groups.expense.push(transaction);
      }
      return groups;
    },
    { income: [] as FinancialTransaction[], expense: [] as FinancialTransaction[] }
  );
};

/**
 * Calculate category totals
 * @param transactions - Array of financial transactions
 * @returns Object with category names as keys and total amounts as values
 */
export const calculateCategoryTotals = (
  transactions: FinancialTransaction[]
): Record<string, number> => {
  if (!transactions || !Array.isArray(transactions)) {
    return {};
  }

  return transactions.reduce((totals, transaction) => {
    const category = transaction.category || 'Lainnya';
    totals[category] = (totals[category] || 0) + (transaction.amount || 0);
    return totals;
  }, {} as Record<string, number>);
};

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

/**
 * Validate transaction data
 * @param transaction - Transaction object to validate
 * @returns Validation error message or null if valid
 */
export const validateTransaction = (
  transaction: Partial<FinancialTransaction>
): string | null => {
  if (!transaction.amount || transaction.amount <= 0) {
    return 'Amount must be greater than 0';
  }
  
  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    return 'Transaction type must be either income or expense';
  }
  
  if (!transaction.category || !transaction.category.trim()) {
    return 'Category is required';
  }
  
  if (!transaction.description || !transaction.description.trim()) {
    return 'Description is required';
  }
  
  if (!transaction.date) {
    return 'Date is required';
  }
  
  return null;
};

// ===========================================
// FORMATTING HELPERS
// ===========================================

/**
 * Format transaction for display
 * @param transaction - Financial transaction
 * @returns Formatted transaction object
 */
export const formatTransactionForDisplay = (
  transaction: FinancialTransaction
): {
  id: string;
  typeLabel: string;
  categoryLabel: string;
  amountFormatted: string;
  dateFormatted: string;
} => {
  return {
    id: transaction.id,
    typeLabel: transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    categoryLabel: transaction.category || 'Lainnya',
    amountFormatted: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(transaction.amount || 0),
    dateFormatted: transaction.date
      ? new Intl.DateTimeFormat('id-ID').format(safeParseDate(transaction.date) || new Date())
      : '-'
  };
};

// ===========================================
// EXPORT ORGANIZED UTILITIES
// ===========================================

export const FinancialFilters = {
  filterByDateRange,
  filterByType,
  filterByCategory
};

export const FinancialCalculations = {
  calculateTotalIncome,
  calculateTotalExpense,
  calculateGrossRevenue,
  calculateFinancialSummary,
  calculateCategoryTotals
};

export const FinancialGrouping = {
  groupByCategory,
  groupByType
};

export const FinancialValidation = {
  validateTransaction
};

export const FinancialFormatting = {
  formatTransactionForDisplay
};

// Default export with all utilities
export default {
  ...FinancialFilters,
  ...FinancialCalculations,
  ...FinancialGrouping,
  ...FinancialValidation,
  ...FinancialFormatting
};