// src/components/financial/hooks/useFinancialHooks.ts
// Simplified main export file for financial hooks

// Export all individual hooks
export { useFinancialOperations } from './crud/useFinancialOperations';
export { useFinancialForm } from './form/useFinancialForm';
export { useFinancialSearch } from './search/useFinancialSearch';
export { useFinancialPagination } from './pagination/useFinancialPagination';
export { useFinancialDateRange } from './date/useFinancialDateRange';

// Export query keys (assuming this exists or will be created)
export { financialQueryKeys } from './useFinancialQueryKeys';

// Export utility hooks that were in the original file
export { useFinancialData } from './useFinancialData';
export { useFinancialCalculations } from './useFinancialCalculations';
export { useFinancialChartData } from './useFinancialChartData';

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