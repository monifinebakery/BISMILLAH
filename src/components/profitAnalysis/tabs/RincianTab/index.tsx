// src/components/profitAnalysis/tabs/rincianTab/index.ts

// Main component
export { default as RincianTab } from './RincianTab';

// Hook exports
export { 
  useRincianCalculations, 
  useCostAnalysis, 
  useEfficiencyMetrics, 
  useTargetAnalysis 
} from './hooks';

export {
  useCostAnalysisWithMetadata,
  useCostAnalysisComparison
} from './hooks/useCostAnalysis';

export {
  useEfficiencyMetricsWithScoring,
  useEfficiencyTrends
} from './hooks/useEfficiencyMetrics';

export {
  useIndividualTargetAnalysis,
  useActionPlan,
  useGoalTracking
} from './hooks/useTargetAnalysis';

// Type exports - calculations
export type { 
  RincianCalculations,
  CostAnalysis,
  EfficiencyMetrics,
  OpexComposition,
  MaterialUsageStats,
  CostStructureAnalysis,
  Recommendation,
  DataQualityAssessment
} from './types/calculations';

// Type exports - components
export type {
  BaseRincianProps,
  TabNavigationProps,
  DataQualityIndicatorProps,
  CostOverviewProps,
  QuickRatioAnalysisProps,
  HppSummaryCardProps,
  OpexSummaryCardProps,
  CogsDetailTabProps,
  MaterialCostsCardProps,
  LaborCostsCardProps,
  MaterialUsageAnalyticsProps,
  OpexDetailTabProps,
  ExpenseCardProps,
  AnalysisTabProps,
  EfficiencyMetricsCardProps,
  TargetVsActualCardsProps,
  RecommendationsCardProps,
  ActionItemsCardProps,
  MetricCardData,
  TabKey
} from './types/components';

// Type exports - analysis
export type {
  IndividualTargetAnalysis,
  TargetAnalysisResults,
  ActionItem,
  QuickWin,
  InvestmentOpportunity,
  CriticalIssue,
  ActionPlan,
  GoalTracking,
  GoalTrackingResults,
  EfficiencyScoring,
  EfficiencyAnalysis,
  EfficiencyMetricsWithScoring,
  EfficiencyTrend,
  EfficiencyTrends,
  CostAnalysisWithMetadata,
  IndustryComparison,
  CustomTargets,
  IndustryBenchmarks
} from './types/analysis';

// Component exports
export { DataQualityIndicator } from './components/DataQualityIndicator';
export { TabNavigation } from './components/TabNavigation';

// Overview components
export { CostOverview } from './components/overview/CostOverview';
export { HppSummaryCard } from './components/overview/HppSummaryCard';
export { OpexSummaryCard } from './components/overview/OpexSummaryCard';
export { QuickRatioAnalysis } from './components/overview/QuickRatioAnalysis';

// COGS detail components
export { CogsDetailTab } from './components/cogsDetail/CogsDetailTab';
export { MaterialCostsCard } from './components/cogsDetail/MaterialCostsCard';
export { LaborCostsCard } from './components/cogsDetail/LaborCostsCard';
export { MaterialUsageAnalytics } from './components/cogsDetail/MaterialUsageAnalytics';

// OPEX detail components
export { OpexDetailTab } from './components/opexDetail/OpexDetailTab';
export { ExpenseCard } from './components/opexDetail/ExpenseCard';
export { AdministrativeExpensesCard } from './components/opexDetail/AdministrativeExpensesCard';
export { SellingExpensesCard } from './components/opexDetail/SellingExpensesCard';
export { GeneralExpensesCard } from './components/opexDetail/GeneralExpensesCard';

// Analysis components
export { AnalysisTab } from './components/analysis/AnalysisTab';
export { EfficiencyMetricsCard } from './components/analysis/EfficiencyMetricsCard';
export { TargetVsActualCards } from './components/analysis/TargetVsActualCards';
export { RecommendationsCard } from './components/analysis/RecommendationsCard';
export { ActionItemsCard } from './components/analysis/ActionItemsCard';

// Utility exports
export { 
  formatCurrency, 
  formatPercentage, 
  formatNumber, 
  formatRatio,
  formatCompactCurrency,
  formatDataSource,
  formatAllocationMethod,
  formatCostType,
  formatUsageType,
  truncateText,
  formatMaterialId
} from './utils/formatters';

export {
  calculateCostAnalysis,
  calculateEfficiencyMetrics,
  calculateOpexComposition,
  calculateMaterialUsageStats,
  calculateVariance,
  calculateCostDistribution
} from './utils/calculations';

export {
  getTargetStatus,
  getStatusColors,
  analyzeCostStructure,
  calculateHealthScore,
  getCriticalIssues,
  generateRecommendations,
  type TargetStatus,
  type TargetColor,
  type TargetAnalysisResult
} from './utils/targetAnalysis';

export {
  validateProfitData,
  hasActualMaterialUsage,
  hasDetailedMaterialCosts,
  hasDetailedLaborCosts,
  hasDetailedOpexBreakdown,
  validatePositiveNumbers,
  validatePercentages,
  validateDataConsistency,
  calculateDataQualityScore
} from './utils/validators';

// Constants exports
export {
  COST_TARGETS,
  ANALYSIS_TARGETS,
  DATA_QUALITY_LEVELS
} from './constants/targets';

export {
  STATUS_COLORS,
  CARD_COLORS,
  DATA_SOURCE_COLORS,
  type StatusColorKey,
  type CardColorKey
} from './constants/colors';

export {
  TAB_LABELS,
  SECTION_TITLES,
  STATUS_MESSAGES,
  RECOMMENDATIONS,
  EMPTY_STATE,
  BUTTON_LABELS
} from './constants/messages';