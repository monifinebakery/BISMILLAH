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
// PERBAIKAN: Gunakan default export yang benar
export { default as ProfitSummaryCards } from './components/ProfitSummaryCards';
export { default as ProfitBreakdownChart } from './components/lazy/LazyProfitBreakdownChart';
export { default as ProfitTrendChart } from './components/lazy/LazyProfitTrendChart';
export { default as DetailedBreakdownTable } from './components/lazy/LazyDetailedBreakdownTable';
export { default as ProfitDashboard } from './components/ProfitDashboard';

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
// FIXED: Import dari file yang benar dengan alias untuk menghindari konflik
export {
  formatCurrency as formatCurrencyTrans,
  formatPercentage as formatPercentageTrans,
  formatLargeNumber,
  calculateGrowth,
  generatePeriodOptions,
  getCurrentPeriod,
  getShortPeriodLabel,
  transformToRevenueBreakdown,
  transformToOpExBreakdown,
  transformToProfitAnalysis,
  calculateRollingAverages,
  getGrowthStatus,
  formatPeriodLabel,
  isValidPeriod,
  transformToCOGSBreakdown,
  transformToChartData
} from './utils/profitTransformers';

// ===== PROFIT CALCULATIONS =====
// ✅ FIXED: Import yang sudah benar dengan semua fungsi yang ada (removed calculateMargins for consistency)
export {
  calculateRealTimeProfit,
  filterTransactionsByPeriod,
  filterTransactionsByDateRange,
  getMarginRating,
  extractMaterialName,
  calculateInventoryBasedCOGS,
  analyzeCostStructure,
  calculateBreakEvenAnalysis,
  comparePeriods,
  validateDataQuality,
  generateExecutiveInsights,
  formatCurrency,
  formatPercentage
} from './utils/profitCalculations';

// ✅ STANDARDIZED: Export centralized validation utilities
export { 
  safeCalculateMargins, 
  validateFinancialData, 
  monitorDataQuality 
} from '../../utils/profitValidation';

// ✅ STANDARDIZED: Export centralized COGS utilities
export { 
  getEffectiveCogs, 
  shouldUseWAC, 
  getCOGSSourceLabel, 
  validateCOGSConsistency 
} from '../../utils/cogsCalculation';

// Export types dari utils
export type {
  FinancialTransactionActual,
  BahanBakuActual,
  OperationalCostActual
} from './utils/profitCalculations';

// ===== CONVENIENT DEFAULT EXPORT =====
// ✅ FIXED: Import separate instances to avoid reference issues
import { ProfitAnalysisProvider as Provider, PROFIT_ANALYSIS_QUERY_KEYS as queryKeys } from './contexts/ProfitAnalysisContext';
import { useProfitAnalysis } from './hooks/useProfitAnalysis';
import ProfitDashboard from './components/ProfitDashboard';
import profitAnalysisApi from './services/profitAnalysisApi';
import { PROFIT_CONSTANTS } from './constants/profitConstants';

// Default export untuk kemudahan penggunaan
export default {
  // Provider utama
  Provider,
  
  // Hook utama
  useProfitAnalysis,
  
  // Komponen utama
  Dashboard: ProfitDashboard,
  
  // API service
  api: profitAnalysisApi,
  
  // Konstanta
  constants: PROFIT_CONSTANTS,
  
  // Query keys
  queryKeys
};
