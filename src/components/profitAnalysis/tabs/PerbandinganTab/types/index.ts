// src/components/profitAnalysis/tabs/PerbandinganTab/types/index.ts

export type { 
  CashVsRealComparison,
  ComparisonMetrics,
  ImprovementPotential,
  ComparisonView 
} from './comparison.types';

export type {
  MarginThresholds,
  IndustryBenchmarks,
  StatusResult,
  CompetitiveAnalysis,
  CompetitiveRow
} from './benchmark.types';

// Re-export types from parent profitAnalysis
export type { 
  ProfitAnalysisResult, 
  MaterialUsageLog,
  ProductionRecord 
} from '../../types';