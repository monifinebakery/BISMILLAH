// src/components/financial/types/financial
// ✅ SINGLE SOURCE OF TRUTH - No circular dependencies

export type FinancialTransactionType = 'income' | 'expense';

// ✅ CORE TRANSACTION TYPE - Single definition
export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  category: string | null;
  amount: number;
  description: string | null;
  date: Date | string | null;
  relatedId?: string | null;
  userId: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

// ✅ UTILITY TYPES
export type CreateTransactionData = Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateTransactionData = Partial<Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt'>>;

// ✅ CALCULATION INTERFACES
export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface DateRange {
  from: Date | string;
  to?: Date | string;
}

// ✅ CHART DATA TYPES
export interface ChartDataPoint {
  date: string;
  month?: string;
  Pemasukan: number;
  Pengeluaran: number;
  Saldo: number;
}

export interface CategoryChartData {
  name: string;
  value: number;
  color?: string;
}

export interface FinancialChartData {
  transactionData: ChartDataPoint[];
  dailyData: ChartDataPoint[];
  categoryData: {
    incomeData: CategoryChartData[];
    expenseData: CategoryChartData[];
  };
}

// ✅ FORM TYPES
export interface TransactionFormData {
  type: FinancialTransactionType;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ✅ API RESPONSE TYPES
export interface FinancialApiResponse<T = any> {
  data: T;
  error?: string;
  success: boolean;
}

// ✅ CONTEXT TYPE - Minimal interface
export interface FinancialContextType {
  financialTransactions: FinancialTransaction[];
  isLoading: boolean;
  addFinancialTransaction: (transaction: CreateTransactionData) => Promise<boolean>;
  updateFinancialTransaction: (id: string, transaction: UpdateTransactionData) => Promise<boolean>;
  deleteFinancialTransaction: (id: string) => Promise<boolean>;
}

// ✅ CATEGORIES
export interface FinancialCategories {
  income: string[];
  expense: string[];
}

export const DEFAULT_FINANCIAL_CATEGORIES: FinancialCategories = {
  income: [
    'Penjualan Produk',
    'Jasa Konsultasi', 
    'Investasi',
    'Bonus',
    'Lainnya'
  ],
  expense: [
    'Pembelian Bahan Baku',
    'Gaji Karyawan',
    'Sewa Tempat', 
    'Utilitas',
    'Marketing',
    'Transportasi',
    'Lainnya'
  ]
};

// ✅ CONSTANTS
export const TRANSACTION_TYPE_LABELS: Record<FinancialTransactionType, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran'
};

export const CHART_COLORS = {
  primary: ['#16a34a', '#2563eb', '#f59e0b', '#8b5cf6', '#dc2626', '#06b6d4'],
  income: '#16a34a',
  expense: '#dc2626', 
  balance: '#2563eb'
};