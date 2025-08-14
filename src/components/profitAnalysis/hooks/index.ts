// 1. src/components/profitAnalysis/hooks/index.ts
// ==============================================

// Export hooks
export { useProfitAnalysis, PROFIT_QUERY_KEYS } from './useProfitAnalysis';
export { useProfitCalculation } from './useProfitCalculation';
export { useProfitData } from './useProfitData';

// Export types from useProfitAnalysis
export type {
  UseProfitAnalysisOptions,
  UseProfitAnalysisReturn
} from './useProfitAnalysis';

// Export types from useProfitCalculation
export type {
  UseProfitCalculationOptions,
  UseProfitCalculationReturn
} from './useProfitCalculation';

// Export types from useProfitData
export type {
  UseProfitDataOptions,
  UseProfitDataReturn
} from './useProfitData';

// Default export
export default {
  useProfitAnalysis,
  useProfitCalculation,
  useProfitData
};