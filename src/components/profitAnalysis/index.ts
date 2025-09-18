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
  PROFIT_QUERY_KEYS,
  PROFIT_QUERY_MATCHERS,
  queryKeyUtils,
  type ProfitQueryKey,
  type FnbQueryKey
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
// Ekspor hanya komponen utama yang digunakan
// Note: ImprovedProfitDashboard is primarily used via dynamic import in routes
// and has been removed from static exports to avoid code splitting conflicts

// ===== API SERVICE =====
export { default as profitAnalysisApi } from './services/profitAnalysisApi';
export { EnhancedCalculationService } from './services/enhancedCalculationService';
export type { EnhancedProfitCalculation } from './services/enhancedCalculationService';

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

// Note:
// Default export intentionally removed to avoid potential circular
// initialization issues in some bundlers during lazy loading.
// Use named exports instead (Provider, hooks, components, services).
