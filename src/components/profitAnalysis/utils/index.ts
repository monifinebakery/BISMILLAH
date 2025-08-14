// index.ts - Clean profit utils export file
// ==============================================

// Export profit calculations (core business logic)
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
  formatCurrency,
  formatPercentage
} from './profitCalculations';

// Export profit transformers (data transformation)
export {
  calculateRollingAverages, // TETAP ADA DI SINI - only in transformers
  transformToRevenueBreakdown,
  transformToCOGSBreakdown,
  transformToOpExBreakdown,
  transformToProfitAnalysis,
  transformToChartData,
  formatCurrency as formatCurrencyTrans, // Alias to avoid conflict
  formatPercentage as formatPercentageTrans, // Alias to avoid conflict
  formatLargeNumber,
  formatPeriodLabel,
  getShortPeriodLabel,
  calculateGrowth,
  getGrowthStatus,
  generatePeriodOptions,
  isValidPeriod,
  getCurrentPeriod
} from './profitTransformers';

// Export types
export type {
  FinancialTransactionActual,
  BahanBakuActual,
  OperationalCostActual
} from './profitCalculations';