// components/index.ts
// ==============================================

// Import all components first to make them available for default export
import ProfitSummaryCards from './ProfitSummaryCards';
import ProfitBreakdownChart from './ProfitBreakdownChart';
import ProfitTrendChart from './ProfitTrendChart';
import DetailedBreakdownTable from './DetailedBreakdownTable';
import ProfitDashboard from './ProfitDashboard';

// Named exports - Re-export with correct syntax
export { default as ProfitSummaryCards } from './ProfitSummaryCards';
export { default as ProfitBreakdownChart } from './ProfitBreakdownChart';
export { default as ProfitTrendChart } from './ProfitTrendChart';
export { default as DetailedBreakdownTable } from './DetailedBreakdownTable';
export { default as ProfitDashboard } from './ProfitDashboard';

// Export interfaces that are exported from the components
export type { ProfitSummaryCardsProps } from './ProfitSummaryCards';
export type { ProfitBreakdownChartProps } from './ProfitBreakdownChart';
export type { ProfitTrendChartProps } from './ProfitTrendChart';
export type { DetailedBreakdownTableProps } from './DetailedBreakdownTable';
export type { ProfitDashboardProps } from './ProfitDashboard';

// Default export using imported components
export default {
  ProfitSummaryCards,
  ProfitBreakdownChart,
  ProfitTrendChart,
  DetailedBreakdownTable,
  ProfitDashboard
};