// 4. src/components/profitAnalysis/index.ts - MAIN EXPORT
// ==============================================

// Types
export type {
  ProfitAnalysis,
  RealTimeProfitCalculation,
  ProfitAnalysisContextType,
  DateRangeFilter,
  ProfitChartData,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown,
  AdvancedProfitMetrics,
  ProfitForecast,
  CostOptimizationRecommendations,
  ProfitBenchmark
} from './types/profitAnalysis.types';

// Context & Provider
export { 
  ProfitAnalysisProvider, 
  useProfitAnalysis as useProfitAnalysisContext,
  PROFIT_ANALYSIS_QUERY_KEYS 
} from './contexts/ProfitAnalysisContext';

// Hooks
export {
  useProfitAnalysis,
  useProfitCalculation,
  useProfitData
} from './hooks';

// Components
export {
  ProfitSummaryCards,
  ProfitBreakdownChart,
  ProfitTrendChart,
  DetailedBreakdownTable,
  ProfitDashboard
} from './components';

// API
export { default as profitAnalysisApi } from './services/profitAnalysisApi';

// Constants
export { PROFIT_CONSTANTS, CHART_CONFIG } from './constants';

// Utils & Transformers
export {
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  calculateGrowth,
  generatePeriodOptions,
  getCurrentPeriod,
  transformToRevenueBreakdown,
  transformToOpExBreakdown,
  transformToProfitAnalysis
} from './utils/profitTransformers';

export {
  calculateAdvancedProfitMetrics,
  generateProfitForecast,
  generateCostOptimizationRecommendations,
  performCompetitiveBenchmarking,
  generateExecutiveSummary
} from './utils/profitCalculations';

// Default export for convenience
export default {
  // Provider
  Provider: ProfitAnalysisProvider,
  
  // Main Hook
  useProfitAnalysis,
  
  // Main Component
  Dashboard: ProfitDashboard,
  
  // API
  api: profitAnalysisApi,
  
  // Constants
  constants: PROFIT_CONSTANTS
};