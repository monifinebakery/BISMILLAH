// hooks/index.ts
// ==============================================

// Import all hooks first to ensure they're available
import { useProfitAnalysis, PROFIT_QUERY_KEYS } from './useProfitAnalysis';
import { useProfitCalculation } from './useProfitCalculation';
import { useProfitData } from './useProfitData';

// Import all types
import type {
  UseProfitAnalysisOptions,
  UseProfitAnalysisReturn
} from './useProfitAnalysis';

import type {
  UseProfitCalculationOptions,
  UseProfitCalculationReturn
} from './useProfitCalculation';

import type {
  UseProfitDataOptions,
  UseProfitDataReturn
} from './useProfitData';

// Named exports - Re-export everything
export { useProfitAnalysis, PROFIT_QUERY_KEYS };
export { useProfitCalculation };
export { useProfitData };

// Type exports
export type {
  UseProfitAnalysisOptions,
  UseProfitAnalysisReturn,
  UseProfitCalculationOptions,
  UseProfitCalculationReturn,
  UseProfitDataOptions,
  UseProfitDataReturn
};

// Default export - All hooks aggregated
export default {
  useProfitAnalysis,
  useProfitCalculation,
  useProfitData,
  PROFIT_QUERY_KEYS
};