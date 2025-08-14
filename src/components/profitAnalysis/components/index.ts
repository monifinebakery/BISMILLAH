// components/index.ts
// ==============================================
// Index file untuk semua komponen analisis profit dalam Bahasa Indonesia

// Import semua komponen terlebih dahulu agar tersedia untuk default export
import ProfitSummaryCards from './ProfitSummaryCards';
import ProfitBreakdownChart from './ProfitBreakdownChart';
import ProfitTrendChart from './ProfitTrendChart';
import DetailedBreakdownTable from './DetailedBreakdownTable';
import ProfitDashboard from './ProfitDashboard';

// Named exports - Re-export dengan sintaks yang benar
export { default as ProfitSummaryCards } from './ProfitSummaryCards';
export { default as ProfitBreakdownChart } from './ProfitBreakdownChart';
export { default as ProfitTrendChart } from './ProfitTrendChart';
export { default as DetailedBreakdownTable } from './DetailedBreakdownTable';
export { default as ProfitDashboard } from './ProfitDashboard';

// Export interface yang di-export dari komponen
export type { ProfitSummaryCardsProps } from './ProfitSummaryCards';
export type { ProfitBreakdownChartProps } from './ProfitBreakdownChart';
export type { ProfitTrendChartProps } from './ProfitTrendChart';
export type { DetailedBreakdownTableProps } from './DetailedBreakdownTable';
export type { ProfitDashboardProps } from './ProfitDashboard';

// Default export menggunakan komponen yang sudah di-import
export default {
  ProfitSummaryCards,
  ProfitBreakdownChart,
  ProfitTrendChart,
  DetailedBreakdownTable,
  ProfitDashboard
};