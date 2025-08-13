// src/components/profitAnalysis/tabs/PerbandinganTab/types/comparison.types.ts

export interface CashVsRealComparison {
  cashFlow: number;
  realProfit: number;
  difference: number;
  isRealProfitHigher: boolean;
  accuracyScore: number;
  dataSource: 'actual' | 'mixed' | 'estimated';
}

export interface ComparisonMetrics {
  grossMargin: number;
  netMargin: number;
  cogsRatio: number;
  opexRatio: number;
  materialRatio: number;
  laborRatio: number;
  materialEfficiency: number;
}

export interface ImprovementPotential {
  cogsReduction10: number;
  opexReduction10: number;
  materialOptimization: number;
  laborEfficiency: number;
  dataAccuracyGain: number;
}