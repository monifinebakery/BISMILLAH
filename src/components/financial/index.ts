// src/components/financial/index.ts
// ✅ FIXED - Clean Barrel Export with Correct Paths for Existing Structure

/**
 * Financial Module - Clean Barrel Export
 * Dependencies reduced and optimized for existing structure
 */

// ===========================================
// ✅ CORE PAGE COMPONENTS
// ===========================================
export { default as FinancialReportPage } from './FinancialReportPage';

// ===========================================
// ✅ ESSENTIAL CONTEXT
// ===========================================
export { 
  FinancialProvider, 
  useFinancial
} from './contexts/FinancialContext';

// ===========================================
// ✅ CONSOLIDATED HOOKS (From existing structure)
// ===========================================
export { useFinancialCore } from './hooks/useFinancialCore';

// Individual hooks for flexibility
export { 
  useFinancialData,
  useFilteredTransactions,
  useTransactionOperations,
  useCategoryData,
  useRecentTransactions,
  useTransactionSearch,
  useBatchOperations
} from './hooks/useFinancialContext';

export {
  useFinancialChartData,
  usePagination,
  useFinancialForm
} from './hooks/useFinancialData';

// ===========================================
// ✅ ESSENTIAL TYPES ONLY
// ===========================================
export type {
  FinancialTransaction,
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData,
  FinancialSummary,
  DateRange,
  ValidationResult,
  FinancialCategories
} from './types/financial';

// Chart-specific types
export type {
  ChartDataPoint,
  CategoryData,
  FinancialChartData
} from './hooks/useFinancialData';

// ===========================================
// ✅ ESSENTIAL UTILITIES (Pure functions)
// ===========================================
export {
  calculateFinancialSummary,
  validateTransaction,
  formatCurrency,
  formatDate,
  filterByDateRange,
  calculateTotalIncome,
  calculateTotalExpense,
  groupByCategory,
  groupByType,
  calculateCategoryTotals
} from './utils/financialCalculations';

// ===========================================
// ✅ QUICK ACCESS CONSTANTS
// ===========================================
export { 
  DEFAULT_FINANCIAL_CATEGORIES,
  TRANSACTION_TYPE_LABELS,
  CHART_COLORS
} from './types/financial';

// ===========================================
// ✅ OPTIONAL: Advanced imports for power users
// ===========================================
export const FINANCIAL_ADVANCED = {
  // Lazy-loaded modules to avoid bundling everything
  hooks: {
    context: () => import('./hooks/useFinancialContext'),
    data: () => import('./hooks/useFinancialData'),
    core: () => import('./hooks/useFinancialCore')
  },
  
  calculations: () => import('./utils/financialCalculations'),
  api: () => import('./services/financialApi'),
  types: () => import('./types/financial'),
  
  // Component modules (if they exist)
  components: () => import('./components').catch(() => null),
  dialogs: () => import('./dialogs').catch(() => null),
  constants: () => import('./constants').catch(() => null)
} as const;

// ===========================================
// 📝 USAGE EXAMPLES:
// ===========================================
/*
// ✅ RECOMMENDED USAGE:

// For pages (consolidated hook):
import { useFinancialCore } from '@/components/financial';

// For specific functionality:
import { useFinancialData, useTransactionOperations } from '@/components/financial';

// For context:
import { useFinancial, FinancialProvider } from '@/components/financial';

// For utilities:
import { calculateFinancialSummary, validateTransaction } from '@/components/financial';

// For types:
import type { FinancialTransaction, DateRange } from '@/components/financial';

// For advanced usage:
import { FINANCIAL_ADVANCED } from '@/components/financial';
const contextHooks = await FINANCIAL_ADVANCED.hooks.context();
*/

// ===========================================
// ❌ REMOVED (To reduce dependencies):
// ===========================================
// - Complex re-exports that create circular dependencies
// - Non-essential component exports (use direct imports)
// - Detailed type exports that aren't commonly used
// - Utilities that aren't essential for most use cases