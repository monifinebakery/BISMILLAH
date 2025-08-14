// src/components/profitAnalysis/index.ts - MAIN EXPORT
// ==============================================
// Export utama untuk modul analisis profit dalam Bahasa Indonesia

// ===== TYPES =====
export type {
  ProfitAnalysis,
  RealTimeProfitCalculation,
  ProfitAnalysisContextType,
  DateRangeFilter,
  ProfitChartData,
  ProfitTrendData,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown,
  AdvancedProfitMetrics,
  ProfitForecast,
  CostOptimizationRecommendations,
  ProfitBenchmark,
  ProfitApiResponse
} from './types/profitAnalysis.types';

// ===== CONTEXT & PROVIDER =====
export { 
  ProfitAnalysisProvider, 
  useProfitAnalysisContext,
  PROFIT_ANALYSIS_QUERY_KEYS 
} from './contexts';

// ===== HOOKS =====
export {
  useProfitAnalysis,
  useProfitCalculation,
  useProfitData
} from './hooks';

// Export types dari hooks
export type {
  UseProfitAnalysisOptions,
  UseProfitAnalysisReturn,
  UseProfitCalculationOptions,
  UseProfitCalculationReturn,
  UseProfitDataOptions,
  UseProfitDataReturn
} from './hooks';

// ===== COMPONENTS =====
export {
  ProfitSummaryCards,
  ProfitBreakdownChart,
  ProfitTrendChart,
  DetailedBreakdownTable,
  ProfitDashboard
} from './components';

// Export types dari components
export type {
  ProfitSummaryCardsProps,
  ProfitBreakdownChartProps,
  ProfitTrendChartProps,
  DetailedBreakdownTableProps,
  ProfitDashboardProps
} from './components';

// ===== API SERVICE =====
export { default as profitAnalysisApi } from './services/profitAnalysisApi';

// ===== CONSTANTS =====
export {
  PROFIT_CONSTANTS,
  REVENUE_CATEGORIES,
  OPEX_CATEGORIES,
  CHART_CONFIG,
  CURRENCY_CONFIG,
  PERIOD_OPTIONS,
  VALIDATION_RULES,
  getMonthName
} from './constants';

// Export types dari constants
export type {
  PeriodType,
  CalculationMethod,
  RevenueCategoryType,
  OpexCategoryType,
  MarginRating,
  PerformanceStatus,
  ProfitColorKey,
  MarginColorKey,
  PeriodOption
} from './constants';

// ===== UTILS & TRANSFORMERS =====
export {
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  calculateGrowth,
  generatePeriodOptions,
  getCurrentPeriod,
  getShortPeriodLabel,
  transformToRevenueBreakdown,
  transformToOpExBreakdown,
  transformToProfitAnalysis,
  getGrowthStatus
} from './utils/profitTransformers';

// ===== PROFIT CALCULATIONS =====
export {
  calculateRealTimeProfit,
  calculateMargins,
  filterTransactionsByPeriod,
  getMarginRating,
  extractMaterialName,
  calculateInventoryBasedCOGS,
  analyzeCostStructure,
  calculateBreakEvenAnalysis,
  comparePeriods,
  validateDataQuality,
  generateExecutiveInsights,
  calculateRollingAverages
} from './utils/profitCalculations';

// ===== CONVENIENT DEFAULT EXPORT =====
// Import langsung untuk menghindari masalah "not defined"
import { ProfitAnalysisProvider } from './contexts/ProfitAnalysisContext';
import { useProfitAnalysis } from './hooks/useProfitAnalysis';
import ProfitDashboard from './components/ProfitDashboard'; // Default import karena menggunakan export default
import profitAnalysisApi from './services/profitAnalysisApi';
import { PROFIT_CONSTANTS } from './constants/profitConstants';
import { PROFIT_ANALYSIS_QUERY_KEYS } from './contexts/ProfitAnalysisContext';

// Default export untuk kemudahan penggunaan
export default {
  // Provider utama
  Provider: ProfitAnalysisProvider,
  
  // Hook utama
  useProfitAnalysis,
  
  // Komponen utama
  Dashboard: ProfitDashboard,
  
  // API service
  api: profitAnalysisApi,
  
  // Konstanta
  constants: PROFIT_CONSTANTS,
  
  // Query keys
  queryKeys: PROFIT_ANALYSIS_QUERY_KEYS
};