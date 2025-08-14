// constants/index.ts
// ==============================================
// Index file untuk semua konstanta analisis profit dalam Bahasa Indonesia

// Export semua konstanta dari profitConstants.ts
export {
  PROFIT_CONSTANTS,
  REVENUE_CATEGORIES,
  OPEX_CATEGORIES,
  CHART_CONFIG,
  CURRENCY_CONFIG,
  PERIOD_OPTIONS,
  VALIDATION_RULES,
  getMonthName
} from './profitConstants';

// Re-export untuk kemudahan akses langsung
export const {
  PERIOD_TYPES,
  CALCULATION_METHODS,
  MARGIN_THRESHOLDS,
  DEFAULT_PERIODS,
  MARGIN_RATINGS,
  PERFORMANCE_STATUS
} = PROFIT_CONSTANTS;

// Export individual color configs untuk kemudahan
export const {
  colors: PROFIT_COLORS,
  margin_colors: MARGIN_COLORS,
  chart_settings: CHART_SETTINGS
} = CHART_CONFIG;

// Export types berdasarkan konstanta
export type PeriodType = typeof PROFIT_CONSTANTS.PERIOD_TYPES[keyof typeof PROFIT_CONSTANTS.PERIOD_TYPES];
export type CalculationMethod = typeof PROFIT_CONSTANTS.CALCULATION_METHODS[keyof typeof PROFIT_CONSTANTS.CALCULATION_METHODS];
export type RevenueCategoryType = typeof REVENUE_CATEGORIES[number];
export type OpexCategoryType = typeof OPEX_CATEGORIES[number];
export type MarginRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type PerformanceStatus = 'IMPROVING' | 'DECLINING' | 'STABLE';

// Helper types untuk chart colors
export type ProfitColorKey = keyof typeof CHART_CONFIG.colors;
export type MarginColorKey = keyof typeof CHART_CONFIG.margin_colors;

// Interface untuk periode option
export interface PeriodOption {
  value: string;
  label: string;
}

// Default export - semua konstanta dalam satu objek
export default {
  // Main constants
  PROFIT_CONSTANTS,
  REVENUE_CATEGORIES,
  OPEX_CATEGORIES,
  CHART_CONFIG,
  CURRENCY_CONFIG,
  PERIOD_OPTIONS,
  VALIDATION_RULES,
  
  // Shorthand access
  PERIOD_TYPES: PROFIT_CONSTANTS.PERIOD_TYPES,
  CALCULATION_METHODS: PROFIT_CONSTANTS.CALCULATION_METHODS,
  MARGIN_THRESHOLDS: PROFIT_CONSTANTS.MARGIN_THRESHOLDS,
  DEFAULT_PERIODS: PROFIT_CONSTANTS.DEFAULT_PERIODS,
  MARGIN_RATINGS: PROFIT_CONSTANTS.MARGIN_RATINGS,
  PERFORMANCE_STATUS: PROFIT_CONSTANTS.PERFORMANCE_STATUS,
  
  // Colors
  PROFIT_COLORS: CHART_CONFIG.colors,
  MARGIN_COLORS: CHART_CONFIG.margin_colors,
  CHART_SETTINGS: CHART_CONFIG.chart_settings,
  
  // Helper functions
  getMonthName
};