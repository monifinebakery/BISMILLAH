// src/types/financial.ts
// Centralized type definitions for financial modules

export type FinancialTransactionType = 'income' | 'expense';

export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  category: string | null;
  amount: number;
  description: string | null;
  date: Date | string | null;
  notes?: string | null;
  relatedId?: string | null;
  userId: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface FinancialCategories {
  income: string[];
  expense: string[];
}

export interface FinancialSettings {
  financialCategories: FinancialCategories;
  defaultCurrency?: string;
  budgetAlerts?: boolean;
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

// Form types
export interface TransactionFormData {
  type: FinancialTransactionType;
  amount: number;
  category: string;
  description: string;
  date: Date;
  notes?: string;
}

export interface TransactionFormErrors {
  type?: string;
  amount?: string;
  category?: string;
  description?: string;
  date?: string;
  notes?: string;
}

// API response types
export interface FinancialApiResponse<T = any> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Context types
export interface FinancialContextType {
  financialTransactions: FinancialTransaction[];
  isLoading: boolean;
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateFinancialTransaction: (id: string, transaction: Partial<FinancialTransaction>) => Promise<boolean>;
  deleteFinancialTransaction: (id: string) => Promise<boolean>;
}

// Component prop types
export interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateTransaction?: (id: string, transaction: Partial<FinancialTransaction>) => Promise<boolean>;
  transaction?: FinancialTransaction | null;
  categories?: FinancialCategories;
}

export interface CategoryManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any; // UserSettings type
  saveSettings: (settings: any) => Promise<boolean>;
}

export interface TransactionTableProps {
  transactions: FinancialTransaction[];
  onEditTransaction: (transaction: FinancialTransaction) => void;
  onAddTransaction: () => void;
  isLoading?: boolean;
}

export interface FinancialChartsProps {
  filteredTransactions: FinancialTransaction[];
  dateRange: DateRange;
}

export interface CategoryChartsProps {
  filteredTransactions: FinancialTransaction[];
}

// Utility function types
export type FilterFunction<T> = (items: T[], ...args: any[]) => T[];
export type CalculationFunction<T, R> = (items: T[]) => R;
export type ValidationFunction<T> = (item: T) => string | null;

// Export helper types
export type CreateTransactionData = Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateTransactionData = Partial<Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt'>>;

// Default values
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