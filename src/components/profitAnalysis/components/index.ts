// src › components › profitAnalysis › components › index.ts
// Index file untuk semua komponen analisis profit dalam Bahasa Indonesia

// HANYA ini yang digunakan - tidak perlu bagian bawah
export { default as ProfitSummaryCards } from './ProfitSummaryCards';
export { default as ProfitBreakdownChart } from './lazy/LazyProfitBreakdownChart';
export { default as ProfitTrendChart } from './lazy/LazyProfitTrendChart';
export { default as DetailedBreakdownTable } from './lazy/LazyDetailedBreakdownTable';
export { default as ProfitDashboard } from './ProfitDashboard';

// Export types
export type { ProfitSummaryCardsProps } from './ProfitSummaryCards';
export type { ProfitBreakdownChartProps } from './ProfitBreakdownChart';
export type { ProfitTrendChartProps } from './ProfitTrendChart';
export type { DetailedBreakdownTableProps } from './DetailedBreakdownTable';
export type { ProfitDashboardProps } from './ProfitDashboard';