// src/components/financial/hooks/useFinancialHooks.ts
// Updated facade that exports from refactored modules for backward compatibility

// Export all individual hooks from the new refactored modules
export { useFinancialOperations } from './crud/useFinancialOperations';
export { useFinancialForm } from './form/useFinancialForm';
export { useFinancialSearch } from './search/useFinancialSearch';
export { useFinancialPagination } from './pagination/useFinancialPagination';
export { useFinancialDateRange } from './date/useFinancialDateRange';

// Export utility hooks
export { useFinancialData } from './useFinancialData';
export { useFinancialCalculations } from './useFinancialCalculations';
export { useFinancialChartData } from './useFinancialChartData';

// Export query keys
export { financialQueryKeys } from './useFinancialQueryKeys';

// Re-export types for convenience
export type { 
  FinancialTransaction, 
  CreateTransactionData, 
  UpdateTransactionData,
  DateRange,
  FinancialSummary,
  FinancialChartData,
  ChartDataPoint,
  CategoryChartData,
  ValidationResult
} from '../types/financial';