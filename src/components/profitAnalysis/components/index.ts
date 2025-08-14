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