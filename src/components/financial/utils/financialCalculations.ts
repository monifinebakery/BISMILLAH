// src/components/financial/utils/financialCalculations.ts
// ✅ PURE FUNCTIONS - No circular dependencies, no context imports

import { safeParseDate } from '@/utils/unifiedDateUtils';
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

  const fromDate = safeParseDate(dateRange.from);
  const toDate = dateRange.to ? safeParseDate(dateRange.to) : fromDate;

  if (!fromDate) return [];

  const fromTime = fromDate.setHours(0, 0, 0, 0);
  const toTime = toDate ? toDate.setHours(23, 59, 59, 999) : fromTime;

  return items.filter(item => {
    const itemDate = safeParseDate(item[dateKey]);
    if (!itemDate) return false;
    const itemTime = itemDate.getTime();
    return itemTime >= fromTime && itemTime <= toTime;
  });
};

export const filterByType = (
  transactions: FinancialTransaction[],
  type: 'income' | 'expense'
): FinancialTransaction[] => {
  return transactions?.filter(t => t.type === type) || [];
};

export const filterByCategory = (
  transactions: FinancialTransaction[],
  category: string
): FinancialTransaction[] => {
  return transactions?.filter(t => t.category === category) || [];
};

// ===========================================
// ✅ CALCULATION FUNCTIONS (Pure)
// ===========================================

export const calculateTotalIncome = (transactions: FinancialTransaction[]): number => {
  return transactions
    ?.filter(t => t.type === 'income')
    ?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
};

export const calculateTotalExpense = (transactions: FinancialTransaction[]): number => {
  return transactions
    ?.filter(t => t.type === 'expense')
    ?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
};

export const calculateFinancialSummary = (
  transactions: FinancialTransaction[]
): FinancialSummary => {
  if (!transactions?.length) {
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
  return transactions?.reduce((groups, transaction) => {
    const category = transaction.category || 'Lainnya';
    if (!groups[category]) groups[category] = [];
    groups[category].push(transaction);
    return groups;
  }, {} as Record<string, FinancialTransaction[]>) || {};
};

export const groupByType = (
  transactions: FinancialTransaction[]
): { income: FinancialTransaction[]; expense: FinancialTransaction[] } => {
  return transactions?.reduce(
    (groups, transaction) => {
      if (transaction.type === 'income') {
        groups.income.push(transaction);
      } else {
        groups.expense.push(transaction);
      }
      return groups;
    },
    { income: [] as FinancialTransaction[], expense: [] as FinancialTransaction[] }
  ) || { income: [], expense: [] };
};

export const calculateCategoryTotals = (
  transactions: FinancialTransaction[]
): Record<string, number> => {
  return transactions?.reduce((totals, transaction) => {
    const category = transaction.category || 'Lainnya';
    totals[category] = (totals[category] || 0) + (transaction.amount || 0);
    return totals;
  }, {} as Record<string, number>) || {};
};

// ===========================================
// ✅ VALIDATION FUNCTIONS (Pure)
// ===========================================

export const validateTransaction = (
  transaction: Partial<CreateTransactionData | UpdateTransactionData>
): ValidationResult => {
  const errors: string[] = [];

  if (transaction.amount !== undefined && transaction.amount <= 0) {
    errors.push('Jumlah harus lebih dari 0');
  }
  
  if (transaction.type && !['income', 'expense'].includes(transaction.type)) {
    errors.push('Tipe transaksi harus pemasukan atau pengeluaran');
  }
  
  if (transaction.category !== undefined && (!transaction.category || !transaction.category.trim())) {
    errors.push('Kategori wajib dipilih');
  }
  
  if (transaction.description !== undefined && (!transaction.description || !transaction.description.trim())) {
    errors.push('Deskripsi tidak boleh kosong');
  }
  
  if (transaction.date !== undefined && !transaction.date) {
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
  const parsedDate = safeParseDate(date);
  return parsedDate 
    ? new Intl.DateTimeFormat('id-ID').format(parsedDate)
    : '-';
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
      (t.category || '').toLowerCase().includes(searchTerm) ||
      (t.notes || '').toLowerCase().includes(searchTerm)
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
      case 'date':
        const dateA = safeParseDate(a.date)?.getTime() || 0;
        const dateB = safeParseDate(b.date)?.getTime() || 0;
        comparison = dateA - dateB;
        break;
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