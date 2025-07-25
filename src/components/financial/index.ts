// src/components/financial/index.ts
// Barrel export untuk semua financial modules

// ===========================================
// IMPORTS FOR COMPONENT GROUPS & RE-EXPORTS
// ===========================================

// Component imports
import FinancialReportPageComponent from './FinancialReportPage';
import FinancialChartsComponent from './components/FinancialCharts';
import CategoryChartsComponent from './components/CategoryCharts';
import TransactionTableComponent from './components/TransactionTable';
import FinancialTransactionDialogComponent from './dialogs/FinancialTransactionDialog';
import CategoryManagementDialogComponent from './dialogs/CategoryManagementDialog';

// Hook imports
import {
  useFinancialData as useFinancialDataHook,
  useFinancialChartData as useFinancialChartDataHook,
  usePagination as usePaginationHook,
  useFinancialForm as useFinancialFormHook,
  default as FinancialHooksDefault
} from './hooks/useFinancialData';

import {
  useFilteredTransactions as useFilteredTransactionsHook,
  useTransactionOperations as useTransactionOperationsHook,
  useCategoryData as useCategoryDataHook,
  useRecentTransactions as useRecentTransactionsHook,
  useTransactionSearch as useTransactionSearchHook,
  useBatchOperations as useBatchOperationsHook,
  FinancialContextHooks as FinancialContextHooksDefault
} from './hooks/useFinancialContext';

// Constants imports
import {
  CHART_CONFIG as ChartConfigConst,
  DEFAULT_CATEGORIES as DefaultCategoriesConst,
  PAGINATION_CONFIG as PaginationConfigConst,
  VALIDATION_RULES as ValidationRulesConst,
  ERROR_MESSAGES as ErrorMessagesConst,
  DATE_PRESETS as DatePresetsConst,
  TRANSACTION_TYPES as TransactionTypesConst,
  FORMAT_CONFIG as FormatConfigConst,
  UI_CONFIG as UIConfigConst,
  ChartConstants as ChartConstantsObj,
  FormConstants as FormConstantsObj,
  UIConstants as UIConstantsObj,
  FormatConstants as FormatConstantsObj,
  default as FinancialConstantsDefault
} from './constants';

// Utils imports (re-export from utils)
import {
  filterByDateRange as filterByDateRangeUtil,
  filterByType as filterByTypeUtil,
  filterByCategory as filterByCategoryUtil,
  calculateTotalIncome as calculateTotalIncomeUtil,
  calculateTotalExpense as calculateTotalExpenseUtil,
  calculateGrossRevenue as calculateGrossRevenueUtil,
  calculateFinancialSummary as calculateFinancialSummaryUtil,
  calculateCategoryTotals as calculateCategoryTotalsUtil,
  groupByCategory as groupByCategoryUtil,
  groupByType as groupByTypeUtil,
  validateTransaction as validateTransactionUtil,
  formatTransactionForDisplay as formatTransactionForDisplayUtil,
  FinancialFilters as FinancialFiltersObj,
  FinancialCalculations as FinancialCalculationsObj,
  FinancialGrouping as FinancialGroupingObj,
  FinancialValidation as FinancialValidationObj,
  FinancialFormatting as FinancialFormattingObj,
  default as FinancialUtilsDefault
} from './utils/financialUtils';

// ===========================================
// MAIN COMPONENTS (Individual Exports)
// ===========================================

export { default as FinancialReportPage } from './FinancialReportPage';

// Chart components
export { default as FinancialCharts } from './components/FinancialCharts';
export { default as CategoryCharts } from './components/CategoryCharts';

// Table components  
export { default as TransactionTable } from './components/TransactionTable';

// Dialog components
export { default as FinancialTransactionDialog } from './dialogs/FinancialTransactionDialog';
export { default as CategoryManagementDialog } from './dialogs/CategoryManagementDialog';

// ===========================================
// HOOKS
// ===========================================

export {
  useFinancialData,
  useFinancialChartData,
  usePagination,
  useFinancialForm,
  default as FinancialHooks
} from './hooks/useFinancialData';

// Context hooks
export {
  useFilteredTransactions,
  useTransactionOperations,
  useCategoryData,
  useRecentTransactions,
  useTransactionSearch,
  useBatchOperations,
  FinancialContextHooks
} from './hooks/useFinancialContext';

// ===========================================
// CONSTANTS & CONFIG
// ===========================================

export {
  CHART_CONFIG,
  DEFAULT_CATEGORIES,
  PAGINATION_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  DATE_PRESETS,
  TRANSACTION_TYPES,
  FORMAT_CONFIG,
  UI_CONFIG,
  ChartConstants,
  FormConstants,
  UIConstants,
  FormatConstants,
  default as FinancialConstants
} from './constants';

// ===========================================
// UTILITIES (Re-export from utils)
// ===========================================

export {
  filterByDateRange,
  filterByType,
  filterByCategory,
  calculateTotalIncome,
  calculateTotalExpense,
  calculateGrossRevenue,
  calculateFinancialSummary,
  calculateCategoryTotals,
  groupByCategory,
  groupByType,
  validateTransaction,
  formatTransactionForDisplay,
  FinancialFilters,
  FinancialCalculations,
  FinancialGrouping,
  FinancialValidation,
  FinancialFormatting,
  default as FinancialUtils
} from './utils/financialUtils';

// ===========================================
// TYPES (Re-export)
// ===========================================

export type {
  FinancialTransaction,
  FinancialTransactionType,
  FinancialCategories,
  FinancialSettings,
  DateRange,
  FinancialSummary,
  ChartDataPoint,
  CategoryChartData,
  FinancialChartData,
  TransactionFormData,
  TransactionFormErrors,
  FinancialApiResponse,
  PaginatedResponse,
  FinancialContextType,
  FinancialTransactionDialogProps,
  CategoryManagementDialogProps,
  TransactionTableProps,
  FinancialChartsProps,
  CategoryChartsProps,
  CreateTransactionData,
  UpdateTransactionData
} from './types/financial';

// ===========================================
// LAZY COMPONENT LOADERS (for dynamic imports)
// ===========================================

export const LazyFinancialComponents = {
  FinancialCharts: () => import('./components/FinancialCharts'),
  CategoryCharts: () => import('./components/CategoryCharts'),
  TransactionTable: () => import('./components/TransactionTable'),
  FinancialTransactionDialog: () => import('./dialogs/FinancialTransactionDialog'),
  CategoryManagementDialog: () => import('./dialogs/CategoryManagementDialog')
};

// ===========================================
// COMPONENT GROUPS (for organized imports)
// ===========================================

export const FinancialComponents = {
  Charts: {
    FinancialCharts: FinancialChartsComponent,
    CategoryCharts: CategoryChartsComponent
  },
  Tables: {
    TransactionTable: TransactionTableComponent
  },
  Dialogs: {
    FinancialTransactionDialog: FinancialTransactionDialogComponent,
    CategoryManagementDialog: CategoryManagementDialogComponent
  }
};

// ===========================================
// CONTEXT 
// ===========================================

export { 
  FinancialProvider, 
  useFinancial 
} from './contexts/FinancialContext';

// ===========================================
// QUICK SETUP HELPERS
// ===========================================

/**
 * Helper function to setup financial module with default configuration
 */
export const setupFinancialModule = () => {
  return {
    defaultCategories: DEFAULT_CATEGORIES,
    chartConfig: CHART_CONFIG,
    validationRules: VALIDATION_RULES,
    formatConfig: FORMAT_CONFIG
  };
};

/**
 * Helper function to create financial transaction with validation
 */
export const createFinancialTransaction = (
  data: Partial<FinancialTransaction>
): CreateTransactionData | { error: string } => {
  const validationError = validateTransaction(data as FinancialTransaction);
  if (validationError) {
    return { error: validationError };
  }
  
  return {
    type: data.type!,
    amount: data.amount!,
    category: data.category!,
    description: data.description!,
    date: data.date!,
    notes: data.notes || null,
    relatedId: data.relatedId || null
  };
};

// ===========================================
// VERSION INFO
// ===========================================

export const FINANCIAL_MODULE_VERSION = '1.0.0';
export const FINANCIAL_MODULE_INFO = {
  version: FINANCIAL_MODULE_VERSION,
  description: 'Modular Financial Management System',
  features: [
    'Transaction Management',
    'Category Management', 
    'Financial Reports',
    'Chart Visualizations',
    'Export Functions',
    'Real-time Updates'
  ],
  lastUpdated: new Date().toISOString()
};

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
  // Main components
  FinancialReportPage: FinancialReportPageComponent,
  
  // Component groups
  Components: FinancialComponents,
  
  // Utilities
  Utils: FinancialUtilsDefault,
  Hooks: FinancialHooksDefault,
  ContextHooks: FinancialContextHooksDefault,
  Constants: FinancialConstantsDefault,
  
  // Lazy loaders
  Lazy: LazyFinancialComponents,
  
  // Setup helpers
  setup: setupFinancialModule,
  createTransaction: createFinancialTransaction,
  
  // Module info
  moduleInfo: FINANCIAL_MODULE_INFO
};