// src/components/profitAnalysis/tabs/RincianTab/hooks/useTargetAnalysis.ts

import { useMemo } from 'react';
import { ProfitAnalysisResult } from '../../types';
import { CostStructureAnalysis, Recommendation } from '../types/calculations';
import { calculateCostAnalysis } from '../utils/calculations';
import { analyzeCostStructure, generateRecommendations, getTargetStatus } from '../utils/targetAnalysis';
import { validateProfitData } from '../utils/validators';
import { ANALYSIS_TARGETS } from '../constants/targets';

/**
 * Hook for comprehensive target analysis
 */
export const useTargetAnalysis = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      return null;
    }

    try {
      const costAnalysis = calculateCostAnalysis(profitData);
      const costStructureAnalysis = analyzeCostStructure(costAnalysis);
      const recommendations = generateRecommendations(
        costAnalysis,
        profitData.cogsBreakdown.dataSource || 'estimated'
      );

      return {
        costStructureAnalysis,
        recommendations,
        costAnalysis
      };
    } catch (error) {
      console.error('Error in useTargetAnalysis:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for individual target status analysis
 */
export const useIndividualTargetAnalysis = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData) return null;

    const costAnalysis = calculateCostAnalysis(profitData);
    
    return {
      material: {
        analysis: getTargetStatus(costAnalysis.materialRatio, ANALYSIS_TARGETS.MATERIAL.target),
        target: ANALYSIS_TARGETS.MATERIAL,
        actual: costAnalysis.materialRatio
      },
      labor: {
        analysis: getTargetStatus(costAnalysis.laborRatio, ANALYSIS_TARGETS.LABOR.target),
        target: ANALYSIS_TARGETS.LABOR,
        actual: costAnalysis.laborRatio
      },
      cogs: {
        analysis: getTargetStatus(costAnalysis.cogsRatio, ANALYSIS_TARGETS.COGS.target),
        target: ANALYSIS_TARGETS.COGS,
        actual: costAnalysis.cogsRatio
      },
      opex: {
        analysis: getTargetStatus(costAnalysis.opexRatio, ANALYSIS_TARGETS.OPEX.target),
        target: ANALYSIS_TARGETS.OPEX,
        actual: costAnalysis.opexRatio
      },
      netMargin: {
        analysis: getTargetStatus(profitData.profitMarginData.netMargin, ANALYSIS_TARGETS.NET_MARGIN.target),
        target: ANALYSIS_TARGETS.NET_MARGIN,
        actual: profitData.profitMarginData.netMargin
      }
    };
  }, [profitData]);
};

/**
 * Hook for priority-based action planning
 */
export const useActionPlan = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData) return null;

    const costAnalysis = calculateCostAnalysis(profitData);
    const costStructureAnalysis = analyzeCostStructure(costAnalysis);
    const recommendations = generateRecommendations(
      costAnalysis,
      profitData.cogsBreakdown.dataSource || 'estimated'
    );

    // Create action plan based on priority
    const actionPlan = {
      immediate: recommendations.filter(r => r.priority === 'high'),
      shortTerm: recommendations.filter(r => r.priority === 'medium'),
      longTerm: recommendations.filter(r => r.priority === 'low'),
      
      // Critical issues requiring immediate attention
      criticalIssues: costStructureAnalysis.overall.criticalIssues
        .filter(issue => issue.severity === 'critical')
        .map(issue => ({
          area: issue.name,
          description: issue.message,
          impact: 'high',
          timeline: 'immediate'
        })),

      // Quick wins (high impact, low effort)
      quickWins: identifyQuickWins(costAnalysis, profitData),

      // Investment opportunities (high impact, high effort)
      investments: identifyInvestmentOpportunities(costAnalysis, profitData)
    };

    return actionPlan;
  }, [profitData]);
};

/**
 * Hook for goal setting and tracking
 */
export const useGoalTracking = (
  profitData: ProfitAnalysisResult | null,
  customTargets?: {
    materialTarget?: number;
    laborTarget?: number;
    cogsTarget?: number;
    opexTarget?: number;
    marginTarget?: number;
  }
) => {
  return useMemo(() => {
    if (!profitData) return null;

    const costAnalysis = calculateCostAnalysis(profitData);
    const targets = {
      material: customTargets?.materialTarget ?? ANALYSIS_TARGETS.MATERIAL.target,
      labor: customTargets?.laborTarget ?? ANALYSIS_TARGETS.LABOR.target,
      cogs: customTargets?.cogsTarget ?? ANALYSIS_TARGETS.COGS.target,
      opex: customTargets?.opexTarget ?? ANALYSIS_TARGETS.OPEX.target,
      margin: customTargets?.marginTarget ?? ANALYSIS_TARGETS.NET_MARGIN.target
    };

    const goalTracking = {
      material: {
        current: costAnalysis.materialRatio,
        target: targets.material,
        gap: costAnalysis.materialRatio - targets.material,
        progress: Math.max(0, Math.min(100, (targets.material / costAnalysis.materialRatio) * 100)),
        achievable: Math.abs(costAnalysis.materialRatio - targets.material) <= 10
      },
      labor: {
        current: costAnalysis.laborRatio,
        target: targets.labor,
        gap: costAnalysis.laborRatio - targets.labor,
        progress: Math.max(0, Math.min(100, (targets.labor / costAnalysis.laborRatio) * 100)),
        achievable: Math.abs(costAnalysis.laborRatio - targets.labor) <= 5
      },
      cogs: {
        current: costAnalysis.cogsRatio,
        target: targets.cogs,
        gap: costAnalysis.cogsRatio - targets.cogs,
        progress: Math.max(0, Math.min(100, (targets.cogs / costAnalysis.cogsRatio) * 100)),
        achievable: Math.abs(costAnalysis.cogsRatio - targets.cogs) <= 15
      },
      opex: {
        current: costAnalysis.opexRatio,
        target: targets.opex,
        gap: costAnalysis.opexRatio - targets.opex,
        progress: Math.max(0, Math.min(100, (targets.opex / costAnalysis.opexRatio) * 100)),
        achievable: Math.abs(costAnalysis.opexRatio - targets.opex) <= 10
      },
      margin: {
        current: profitData.profitMarginData.netMargin,
        target: targets.margin,
        gap: profitData.profitMarginData.netMargin - targets.margin,
        progress: Math.max(0, Math.min(100, (profitData.profitMarginData.netMargin / targets.margin) * 100)),
        achievable: profitData.profitMarginData.netMargin >= targets.margin * 0.7
      }
    };

    return {
      goals: goalTracking,
      summary: {
        achievableGoals: Object.values(goalTracking).filter(g => g.achievable).length,
        totalGoals: Object.keys(goalTracking).length,
        averageProgress: Object.values(goalTracking).reduce((sum, g) => sum + g.progress, 0) / Object.keys(goalTracking).length,
        priorityAreas: Object.entries(goalTracking)
          .filter(([, goal]) => goal.gap > 5)
          .sort(([, a], [, b]) => Math.abs(b.gap) - Math.abs(a.gap))
          .map(([area]) => area)
      }
    };
  }, [profitData, customTargets]);
};

/**
 * Identify quick wins (high impact, low effort improvements)
 */
const identifyQuickWins = (costAnalysis: any, profitData: ProfitAnalysisResult): Array<{
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
}> => {
  const quickWins = [];

  // Material procurement optimization
  if (costAnalysis.materialRatio > 45) {
    quickWins.push({
      area: 'Material Procurement',
      description: 'Renegotiate with top 3 suppliers for better rates',
      impact: 'high' as const,
      effort: 'low' as const,
      timeframe: '1-2 months'
    });
  }

  // Administrative cost reduction
  if (costAnalysis.opexRatio > 25) {
    quickWins.push({
      area: 'Administrative Efficiency',
      description: 'Automate repetitive administrative tasks',
      impact: 'medium' as const,
      effort: 'low' as const,
      timeframe: '2-4 weeks'
    });
  }

  // Waste reduction
  if (profitData.cogsBreakdown.actualMaterialUsage) {
    quickWins.push({
      area: 'Waste Reduction',
      description: 'Implement material waste tracking and reduction program',
      impact: 'medium' as const,
      effort: 'low' as const,
      timeframe: '1 month'
    });
  }

  return quickWins;
};

/**
 * Identify investment opportunities (high impact, high effort improvements)
 */
const identifyInvestmentOpportunities = (costAnalysis: any, profitData: ProfitAnalysisResult): Array<{
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  investment: string;
  roi: string;
}> => {
  const investments = [];

  // Automation opportunities
  if (costAnalysis.laborRatio > 20) {
    investments.push({
      area: 'Production Automation',
      description: 'Implement automated production systems',
      impact: 'high' as const,
      effort: 'high' as const,
      investment: 'High capital investment',
      roi: '12-24 months payback'
    });
  }

  // Technology upgrade
  if (profitData.cogsBreakdown.dataSource !== 'actual') {
    investments.push({
      area: 'Data Systems Upgrade',
      description: 'Implement real-time cost tracking system',
      impact: 'high' as const,
      effort: 'high' as const,
      investment: 'Medium technology investment',
      roi: '6-12 months payback'
    });
  }

  return investments;
};