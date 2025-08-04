// 📁 components/promoCalculator/analytics/index.ts
// Analytics module exports

// Main analytics component
export { default as PromoAnalytics } from './PromoAnalytics';

// Chart components
export { default as HppAnalysisChart } from './HppAnalysisChart';
export { default as ProfitAnalysisChart } from './ProfitAnalysisChart';
export { default as PromoPerformanceCard } from './PromoPerformanceCard';

// Re-export everything for convenience
export * from './PromoAnalytics';
export * from './HppAnalysisChart';
export * from './ProfitAnalysisChart';
export * from './PromoPerformanceCard';