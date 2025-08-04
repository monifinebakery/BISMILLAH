// src/components/financial/index.ts
// 🎯 SIMPLIFIED - Clean barrel export (12 deps → 6-8 deps)

// === MAIN PAGE COMPONENT ===
export { default as FinancialReportPage } from './FinancialReportPage';

// === CORE COMPONENTS ===
export { default as FinancialCharts } from './components/FinancialCharts';
export { default as CategoryCharts } from './components/CategoryCharts';
export { default as TransactionTable } from './components/TransactionTable';

// === DIALOGS ===
export { default as FinancialTransactionDialog } from './dialogs/FinancialTransactionDialog';
export { default as CategoryManagementDialog } from './dialogs/CategoryManagementDialog';

// === CONTEXT ===
export { FinancialProvider, useFinancial } from './contexts/FinancialContext';

// === HOOKS ===
export { 
  useFinancialData,
  useFinancialChartData,
  usePagination,
  useFinancialForm
} from './hooks/useFinancialData';

export {
  useFilteredTransactions,
  useTransactionOperations,
  useCategoryData
} from './hooks/useFinancialContext';

// === TYPES ===
export type {
  FinancialTransaction,
  FinancialTransactionType,
  FinancialCategories,
  FinancialSummary,
  TransactionFormData,
  DateRange
} from './types/financial';

// === CONSTANTS (grouped) ===
export {
  DEFAULT_CATEGORIES,
  TRANSACTION_TYPES,
  CHART_CONFIG
} from './constants';

// === UTILITIES (key functions only) ===
export {
  calculateFinancialSummary,
  validateTransaction,
  formatTransactionForDisplay
} from './utils/financialUtils';