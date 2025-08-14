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
  formatCurrency,
  formatPercentage
} from './profitCalculations';

// Export profit transformers
export {
  calculateRollingAverages, // TETAP ADA DI SINI
  transformToRevenueBreakdown,
  transformToCOGSBreakdown,
  transformToOpExBreakdown,
  transformToProfitAnalysis,
  transformToChartData,
  formatCurrency as formatCurrencyTrans,
  formatPercentage as formatPercentageTrans,
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