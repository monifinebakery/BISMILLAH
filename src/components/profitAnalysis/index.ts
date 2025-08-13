// src/components/profitAnalysis/index.ts
// ✅ BARREL EXPORT - Export semua components

// Main Dialog
export { default as ProfitAnalysisDialog } from './ProfitAnalysisDialog';

// Components
export { MetricCard } from './components/MetricCard';
export { CostBreakdownChart } from './components/CostBreakdownChart';
export { InsightsList } from './components/InsightsList';
export { AnalysisSkeleton, MetricSkeleton } from './components/LoadingSkeleton';

// Tabs
export { RingkasanTab } from './tabs/RingkasanTab';
export { RincianTab } from './tabs/RincianTab';
export { InsightsTab } from './tabs/InsightsTab';
export { PerbandinganTab } from './tabs/PerbandinganTab';

// Utils
export * from './utils/formatters';
export * from './utils/exportHelpers';