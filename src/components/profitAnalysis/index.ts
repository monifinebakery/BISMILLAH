// 6. MAIN EXPORT - src/components/profitAnalysis/index.ts
// ==============================================

// Types
export type {
  ProfitAnalysis,
  RealTimeProfitCalculation,
  ProfitAnalysisContextType,
  DateRangeFilter,
  ProfitChartData
} from './types/profitAnalysis.types';

// Context
export { 
  ProfitAnalysisProvider, 
  useProfitAnalysis 
} from './contexts/ProfitAnalysisContext';

// API
export { default as profitAnalysisApi } from './services/profitAnalysisApi';

// Constants
export { PROFIT_CONSTANTS, CHART_CONFIG } from './constants/profitConstants';

// Utils
export { 
  calculateRealTimeProfit, 
  calculateMargins,
  getMarginRating 
} from './utils/profitCalculations';

export default {
  Provider: ProfitAnalysisProvider,
  useProfitAnalysis,
  api: profitAnalysisApi,
  constants: PROFIT_CONSTANTS
};