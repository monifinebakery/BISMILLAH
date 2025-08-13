// src/components/profitAnalysis/tabs/rincianTab/types/calculations.ts

import { TargetAnalysisResult } from '../utils/targetAnalysis';

/**
 * Cost analysis ratios
 */
export interface CostAnalysis {
  materialRatio: number;
  laborRatio: number;
  overheadRatio: number;
  cogsRatio: number;
  opexRatio: number;
  totalCostRatio: number;
}

/**
 * Efficiency metrics
 */
export interface EfficiencyMetrics {
  revenuePerCost: number;
  cogsEfficiency: number;
  opexEfficiency: number;
  materialEfficiency: number;
  laborEfficiency: number;
  overheadRate: number;
}

/**
 * OPEX composition ratios
 */
export interface OpexComposition {
  adminRatio: number;
  sellingRatio: number;
  generalRatio: number;
}

/**
 * Material usage statistics
 */
export interface MaterialUsageStats {
  totalRecords: number;
  avgUnitCost: number;
  totalCost: number;
  usageByType: Record<string, number>;
  topMaterials: Array<{
    materialId: string;
    cost: number;
  }>;
}

/**
 * Target analysis for cost structure
 */
export interface CostStructureAnalysis {
  material: TargetAnalysisResult;
  labor: TargetAnalysisResult;
  cogs: TargetAnalysisResult;
  opex: TargetAnalysisResult;
  overall: {
    healthScore: number;
    criticalIssues: Array<{
      name: string;
      severity: 'critical' | 'warning' | 'info';
      message: string;
      priority: number;
    }>;
  };
}

/**
 * Recommendation item
 */
export interface Recommendation {
  type: 'material' | 'labor' | 'opex' | 'data' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

/**
 * Data quality assessment
 */
export interface DataQualityAssessment {
  score: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
  }>;
  warnings: string[];
}

/**
 * Complete rincian calculations result
 */
export interface RincianCalculations {
  costAnalysis: CostAnalysis;
  efficiencyMetrics: EfficiencyMetrics;
  opexComposition: OpexComposition;
  materialUsageStats: MaterialUsageStats | null;
  costStructureAnalysis: CostStructureAnalysis;
  recommendations: Recommendation[];
  dataQuality: DataQualityAssessment;
}