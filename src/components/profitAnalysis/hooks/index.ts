// 1. src/components/profitAnalysis/hooks/index.ts
// ==============================================

export { useProfitAnalysis, PROFIT_QUERY_KEYS } from './useProfitAnalysis';
export { useProfitCalculation } from './useProfitCalculation';
export { useProfitData } from './useProfitData';

export type {
  UseProfitAnalysisOptions,
  UseProfitAnalysisReturn,
  UseProfitCalculationOptions,
  UseProfitCalculationReturn,
  UseProfitDataOptions,
  UseProfitDataReturn
} from './useProfitAnalysis';

export default {
  useProfitAnalysis,
  useProfitCalculation,
  useProfitData
};