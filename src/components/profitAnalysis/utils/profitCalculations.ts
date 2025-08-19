// src/components/profitAnalysis/utils/profitCalculations.ts
// Main profit calculation utilities - Backward compatible version

// Re-export all utilities from organized modules for backward compatibility
export * from './calculations/basicCalculations';
export * from './filters/dataFilters';
export * from './ratings/profitRatings';
export * from './formatting/displayFormatting';
export * from './analysis/complexAnalysis';

// Export types
export type { 
  FinancialTransactionActual, 
  BahanBakuActual, 
  OperationalCostActual,
  PemakaianBahan,
  RealTimeProfitCalculation
} from './types/profitAnalysis.types';

// Export constants for backward compatibility
export { PROFIT_CONSTANTS, FNB_THRESHOLDS, FNB_LABELS } from '../constants/profitConstants';