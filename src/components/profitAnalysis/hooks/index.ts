// src › components › profitAnalysis › hooks › index.ts
// ==============================================

// Direct exports untuk menghindari masalah "not defined"
export { useProfitAnalysis, PROFIT_QUERY_KEYS } from './useProfitAnalysis';
export { useProfitCalculation } from './useProfitCalculation';
export { useProfitData } from './useProfitData';

// Export types
export type {
  UseProfitAnalysisOptions,
  UseProfitAnalysisReturn
} from './useProfitAnalysis';

export type {
  UseProfitCalculationOptions,
  UseProfitCalculationReturn
} from './useProfitCalculation';

export type {
  UseProfitDataOptions,
  UseProfitDataReturn
} from './useProfitData';