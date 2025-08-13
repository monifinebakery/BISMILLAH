// src/components/profitAnalysis/tabs/rincianTab/index.ts

// Main component export
export { RincianTab } from './index';

// Hook exports
export { useRincianCalculations, useCostAnalysis, useEfficiencyMetrics, useTargetAnalysis } from './hooks/useRincianCalculations';

// Type exports
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

export type {
  BaseRincianProps,
  TabNavigationProps,
  DataQualityIndicatorProps,
  CostOverviewProps,
  QuickRatioAnalysisProps,
  MetricCardData,
  TabKey
} from './types/components';

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
  formatUsageType
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
  generateRecommendations
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
  DATA_SOURCE_COLORS
} from './constants/colors';

export {
  TAB_LABELS,
  SECTION_TITLES,
  STATUS_MESSAGES,
  RECOMMENDATIONS,
  EMPTY_STATE,
  BUTTON_LABELS
} from './constants/messages';