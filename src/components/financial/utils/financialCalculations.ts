// src/components/financial/utils/financialCalculations.ts
// ✅ FIXED - Correct import path for types

import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { safeParseDate } from '@/utils/unifiedDateUtils'; // Keep for transition
import { logger } from '@/utils/logger';

// ✅ FIXED: Correct import path for types
import { 
  FinancialTransaction, 
  FinancialSummary, 
  DateRange,
  ValidationResult,
  CreateTransactionData,
  UpdateTransactionData
} from '../types/financial';

// ===========================================
// ✅ FILTERING FUNCTIONS (Pure)
// ===========================================

export const filterByDateRange = <T extends Record<string, any>>(
  items: T[],
  dateRange: DateRange | null | undefined,
  dateKey: string = 'date'
): T[] => {
  if (!items?.length || !dateRange?.from) return [];

  try {
    const fromResult = UnifiedDateHandler.parseDate(dateRange.from);
    const fromDate = fromResult.isValid && fromResult.date ? fromResult.date : null;
    
    const toResult = dateRange.to ? UnifiedDateHandler.parseDate(dateRange.to) : fromResult;
    const toDate = toResult.isValid && toResult.date ? toResult.date : fromDate;

    if (!fromDate) {
      logger.warn('Invalid from date in filterByDateRange');
      return [];
    }

    const fromTime = fromDate.setHours(0, 0, 0, 0);
    const toTime = toDate ? toDate.setHours(23, 59, 59, 999) : fromTime;

    return items.filter(item => {
      const itemDateValue = item[dateKey];
      if (!itemDateValue) return false;

      const itemResult = UnifiedDateHandler.parseDate(itemDateValue);
      const itemDate = itemResult.isValid && itemResult.date ? itemResult.date : null;
      if (!itemDate) return false;

      const itemTime = itemDate.getTime();
      return itemTime >= fromTime && itemTime <= toTime;
    });
  } catch (error) {
    logger.error('Error in filterByDateRange:', error);
    return [];
  }
};

export const filterByType = (
  transactions: FinancialTransaction[],
  type: 'income' | 'expense'
): FinancialTransaction[] => {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }
  return transactions.filter(t => t.type === type);
};

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
// ✅ CALCULATION FUNCTIONS (Pure)
// ===========================================

export const calculateTotalIncome = (transactions: FinancialTransaction[]): number => {
  if (!transactions || !Array.isArray(transactions)) {
    return 0;
  }
  
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

export const calculateTotalExpense = (transactions: FinancialTransaction[]): number => {
  if (!transactions || !Array.isArray(transactions)) {
    return 0;
  }
  
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

export const calculateGrossRevenue = <T extends Record<string, any>>(
  orders: T[],
  totalField: string = 'total'
): number => {
  if (!orders || !Array.isArray(orders)) {
    return 0;
  }
  
  return orders.reduce((sum, order) => sum + (order[totalField] || 0), 0);
};

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
// ✅ GROUPING FUNCTIONS (Pure)
// ===========================================

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
// ✅ VALIDATION FUNCTIONS (Pure)
// ===========================================

export const validateTransaction = (
  transaction: Partial<FinancialTransaction>
): ValidationResult => {
  const errors: string[] = [];

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('Jumlah harus lebih dari 0');
  }
  
  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    errors.push('Tipe transaksi harus pemasukan atau pengeluaran');
  }
  
  if (!transaction.category || !transaction.category.trim()) {
    errors.push('Kategori wajib dipilih');
  }
  
  if (!transaction.description || !transaction.description.trim()) {
    errors.push('Deskripsi tidak boleh kosong');
  }
  
  if (!transaction.date) {
    errors.push('Tanggal wajib diisi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ===========================================
// ✅ FORMATTING FUNCTIONS (Pure)
// ===========================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount);
};

export const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  const result = UnifiedDateHandler.parseDate(date);
  const parsedDate = result.isValid && result.date ? result.date : null;
  if (!parsedDate) return 'Format tidak valid';
  
  try {
    // Check if date has specific time information
    const hasTimeInfo = parsedDate.getHours() !== 0 || parsedDate.getMinutes() !== 0 || parsedDate.getSeconds() !== 0;
    
    if (hasTimeInfo) {
      // Return date with time if time information is available
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }).format(parsedDate) + ' WIB';
    } else {
      // Return only date if no specific time
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(parsedDate);
    }
  } catch (error) {
    logger.warn('Error formatting date:', { date, error });
    return 'Error format';
  }
};

export const formatTransactionForDisplay = (transaction: FinancialTransaction) => {
  return {
    id: transaction.id,
    typeLabel: transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    categoryLabel: transaction.category || 'Lainnya',
    amountFormatted: formatCurrency(transaction.amount || 0),
    dateFormatted: formatDate(transaction.date),
    description: transaction.description || '-'
  };
};

// ===========================================
// ✅ SEARCH & SORT FUNCTIONS (Pure)
// ===========================================

export const searchTransactions = (
  transactions: FinancialTransaction[],
  query: string,
  filters?: {
    type?: 'income' | 'expense';
    category?: string;
    dateRange?: DateRange;
    amountRange?: { min?: number; max?: number };
  }
): FinancialTransaction[] => {
  let results = [...(transactions || [])];
  
  // Text search
  if (query?.trim()) {
    const searchTerm = query.toLowerCase();
    results = results.filter(t => 
      (t.description || '').toLowerCase().includes(searchTerm) ||
      (t.category || '').toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply filters
  if (filters?.type) {
    results = results.filter(t => t.type === filters.type);
  }
  
  if (filters?.category) {
    results = results.filter(t => t.category === filters.category);
  }
  
  if (filters?.dateRange) {
    results = filterByDateRange(results, filters.dateRange, 'date');
  }
  
  if (filters?.amountRange) {
    const { min, max } = filters.amountRange;
    results = results.filter(t => {
      const amount = t.amount || 0;
      return (!min || amount >= min) && (!max || amount <= max);
    });
  }
  
  return results;
};

export const sortTransactions = (
  transactions: FinancialTransaction[],
  sortBy: 'date' | 'amount' | 'category' | 'type' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): FinancialTransaction[] => {
  return [...(transactions || [])].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date': {
        const dateAResult = UnifiedDateHandler.parseDate(a.date);
        const dateBResult = UnifiedDateHandler.parseDate(b.date);
        const dateA = dateAResult.isValid && dateAResult.date ? dateAResult.date.getTime() : 0;
        const dateB = dateBResult.isValid && dateBResult.date ? dateBResult.date.getTime() : 0;
        comparison = dateA - dateB;
        break;
      }
      case 'amount':
        comparison = (a.amount || 0) - (b.amount || 0);
        break;
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

// ===========================================
// ✅ STATS CALCULATION (Pure)
// ===========================================

export const calculateStats = (transactions: FinancialTransaction[]) => {
  if (!transactions?.length) {
    return {
      summary: { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 },
      avgTransaction: 0,
      topCategory: null,
      categoryBreakdown: {},
      typeBreakdown: { income: 0, expense: 0 }
    };
  }

  const summary = calculateFinancialSummary(transactions);
  const categoryTotals = calculateCategoryTotals(transactions);
  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  return {
    summary,
    avgTransaction: (summary.totalIncome + summary.totalExpense) / transactions.length,
    topCategory,
    categoryBreakdown: categoryTotals,
    typeBreakdown: {
      income: summary.totalIncome,
      expense: summary.totalExpense
    }
  };
};

// ===========================================
// ✅ EXPORT ORGANIZED UTILITIES
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
  formatTransactionForDisplay,
  formatCurrency,
  formatDate
};

// Default export with all utilities
export default {
  ...FinancialFilters,
  ...FinancialCalculations,
  ...FinancialGrouping,
  ...FinancialValidation,
  ...FinancialFormatting
};