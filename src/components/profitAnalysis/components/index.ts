// ==============================================
// EXPORT FILES FOR PROFIT ANALYSIS MODULE
// ==============================================

// ==============================================
// 1. src/components/profitAnalysis/hooks/index.ts
// ==============================================

export { useProfitAnalysis, PROFIT_QUERY_KEYS } from './useProfitAnalysis';
export { useProfitCalculation } from './useProfitCalculation';
export { useProfitData } from './useProfitData';

export type {
  UseProfitAnalysisOptions,
  UseProfitAnalysisReturn,
  UseProfitCalculationOptions,
  UseProfitCalculationReturn,
  UseProfitDataOptions,
  UseProfitDataReturn
} from './useProfitAnalysis';

export default {
  useProfitAnalysis,
  useProfitCalculation,
  useProfitData
};

// ==============================================
// 2. src/components/profitAnalysis/constants/index.ts
// ==============================================

export { 
  PROFIT_CONSTANTS,
  REVENUE_CATEGORIES,
  CHART_CONFIG
} from './profitConstants';

export default {
  PROFIT_CONSTANTS,
  REVENUE_CATEGORIES,
  CHART_CONFIG
};

// ==============================================
// 3. src/components/profitAnalysis/components/index.ts
// ==============================================

export { default as ProfitSummaryCards } from './ProfitSummaryCards';
export { default as ProfitBreakdownChart } from './ProfitBreakdownChart';
export { default as ProfitTrendChart } from './ProfitTrendChart';
export { default as DetailedBreakdownTable } from './DetailedBreakdownTable';
export { default as ProfitDashboard } from './ProfitDashboard';

// Re-export with type information
export type { ProfitSummaryCardsProps } from './ProfitSummaryCards';
export type { ProfitBreakdownChartProps } from './ProfitBreakdownChart';
export type { ProfitTrendChartProps } from './ProfitTrendChart';
export type { DetailedBreakdownTableProps } from './DetailedBreakdownTable';
export type { ProfitDashboardProps } from './ProfitDashboard';

export default {
  ProfitSummaryCards,
  ProfitBreakdownChart,
  ProfitTrendChart,
  DetailedBreakdownTable,
  ProfitDashboard
};