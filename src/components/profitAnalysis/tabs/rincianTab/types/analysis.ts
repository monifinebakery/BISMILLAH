// src/components/profitAnalysis/tabs/rincianTab/types/analysis.ts

import { TargetAnalysisResult } from '../utils/targetAnalysis';

/**
 * Individual target analysis result
 */
export interface IndividualTargetAnalysis {
  analysis: TargetAnalysisResult;
  target: {
    target: number;
    threshold: number;
    label: string;
    unit: string;
    description: string;
  };
  actual: number;
}

/**
 * Complete target analysis results
 */
export interface TargetAnalysisResults {
  material: IndividualTargetAnalysis;
  labor: IndividualTargetAnalysis;
  cogs: IndividualTargetAnalysis;
  opex: IndividualTargetAnalysis;
  netMargin: IndividualTargetAnalysis;
}

/**
 * Action plan item
 */
export interface ActionItem {
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeline: 'immediate' | 'short-term' | 'long-term';
}

/**
 * Quick win opportunity
 */
export interface QuickWin {
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
}

/**
 * Investment opportunity
 */
export interface InvestmentOpportunity {
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  investment: string;
  roi: string;
}

/**
 * Critical issue
 */
export interface CriticalIssue {
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeline: 'immediate' | 'short-term' | 'long-term';
}

/**
 * Comprehensive action plan
 */
export interface ActionPlan {
  immediate: Array<{
    type: 'material' | 'labor' | 'opex' | 'data' | 'general';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
  shortTerm: Array<{
    type: 'material' | 'labor' | 'opex' | 'data' | 'general';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
  longTerm: Array<{
    type: 'material' | 'labor' | 'opex' | 'data' | 'general';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
  criticalIssues: CriticalIssue[];
  quickWins: QuickWin[];
  investments: InvestmentOpportunity[];
}

/**
 * Goal tracking for individual metric
 */
export interface GoalTracking {
  current: number;
  target: number;
  gap: number;
  progress: number; // 0-100%
  achievable: boolean;
}

/**
 * Complete goal tracking results
 */
export interface GoalTrackingResults {
  goals: {
    material: GoalTracking;
    labor: GoalTracking;
    cogs: GoalTracking;
    opex: GoalTracking;
    margin: GoalTracking;
  };
  summary: {
    achievableGoals: number;
    totalGoals: number;
    averageProgress: number;
    priorityAreas: string[];
  };
}

/**
 * Efficiency scoring results
 */
export interface EfficiencyScoring {
  revenuePerCostScore: number;
  cogsEfficiencyScore: number;
  opexEfficiencyScore: number;
  materialEfficiencyScore: number;
  laborEfficiencyScore: number;
  overheadScore: number;
  overall: number;
}

/**
 * Efficiency analysis with scoring
 */
export interface EfficiencyAnalysis {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  improvementAreas: Array<{
    metric: string;
    score: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  strengths: string[];
  recommendations: string[];
}

/**
 * Complete efficiency metrics with scoring
 */
export interface EfficiencyMetricsWithScoring {
  metrics: {
    revenuePerCost: number;
    cogsEfficiency: number;
    opexEfficiency: number;
    materialEfficiency: number;
    laborEfficiency: number;
    overheadRate: number;
  };
  scores: EfficiencyScoring;
  analysis: EfficiencyAnalysis;
}

/**
 * Trend data for efficiency metrics
 */
export interface EfficiencyTrend {
  change: number;
  changePercent: number;
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Efficiency trends comparison
 */
export interface EfficiencyTrends {
  current: {
    revenuePerCost: number;
    cogsEfficiency: number;
    opexEfficiency: number;
    materialEfficiency: number;
    laborEfficiency: number;
    overheadRate: number;
  };
  historical?: {
    revenuePerCost: number;
    cogsEfficiency: number;
    opexEfficiency: number;
    materialEfficiency: number;
    laborEfficiency: number;
    overheadRate: number;
  };
  trends?: {
    revenuePerCost: EfficiencyTrend;
    cogsEfficiency: EfficiencyTrend;
    opexEfficiency: EfficiencyTrend;
  };
}

/**
 * Cost analysis with additional metadata
 */
export interface CostAnalysisWithMetadata {
  materialRatio: number;
  laborRatio: number;
  overheadRatio: number;
  cogsRatio: number;
  opexRatio: number;
  totalCostRatio: number;
  metadata: {
    totalCosts: number;
    revenue: number;
    profitability: number;
    costEfficiency: number;
    breakEvenPoint: number;
    marginSafety: number;
    costStructureHealth: {
      isHealthy: boolean;
      riskLevel: 'low' | 'medium' | 'high';
      recommendations: string[];
    };
  };
}

/**
 * Industry benchmark comparison
 */
export interface IndustryComparison {
  costAnalysis: {
    materialRatio: number;
    laborRatio: number;
    cogsRatio: number;
    opexRatio: number;
  };
  comparison: {
    materialVariance: number;
    laborVariance: number;
    cogsVariance: number;
    opexVariance: number;
  };
  performance: {
    materialPerformance: 'above' | 'below';
    laborPerformance: 'above' | 'below';
    cogsPerformance: 'above' | 'below';
    opexPerformance: 'above' | 'below';
  };
}

/**
 * Custom targets for goal setting
 */
export interface CustomTargets {
  materialTarget?: number;
  laborTarget?: number;
  cogsTarget?: number;
  opexTarget?: number;
  marginTarget?: number;
}

/**
 * Industry benchmarks data structure
 */
export interface IndustryBenchmarks {
  materialRatio: number;
  laborRatio: number;
  cogsRatio: number;
  opexRatio: number;
  industry?: string;
  source?: string;
  lastUpdated?: string;
}