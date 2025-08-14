// utils/index.ts
// ==============================================
// Export semua utilitas untuk modul analisis profit

// Export profit calculations
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
} from './profitCalculations';

// Export profit transformers
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
} from './profitTransformers';

// Export types
export type {
  FinancialTransactionActual,
  BahanBakuActual,
  OperationalCostActual
} from './profitCalculations';