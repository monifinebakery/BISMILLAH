// src/components/profitAnalysis/tabs/RincianTab/hooks/useTargetAnalysis.ts

import { useMemo } from 'react';
import { logger } from '@/utils/logger'; // ✅ Import logger
import { ProfitAnalysisResult } from '../../types';
import { CostStructureAnalysis, Recommendation } from '../types/calculations';
import { calculateCostAnalysis } from '../utils/calculations';
import { analyzeCostStructure, generateRecommendations, getTargetStatus } from '../utils/targetAnalysis';
import { validateProfitData } from '../utils/validators'; // ✅ Import validator
import { ANALYSIS_TARGETS } from '../constants/targets';

/**
 * Hook for comprehensive target analysis
 */
export const useTargetAnalysis = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useTargetAnalysis: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
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
      logger.error('Error in useTargetAnalysis:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for individual target status analysis
 */
export const useIndividualTargetAnalysis = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useIndividualTargetAnalysis: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    // ✅ Validasi properti yang dibutuhkan untuk perhitungan target
    if (
      !profitData.profitMarginData ||
      !profitData.cogsBreakdown ||
      !profitData.opexBreakdown
    ) {
       logger.warn('useIndividualTargetAnalysis: Struktur profitData tidak lengkap untuk target analysis', { 
        hasProfitMarginData: !!profitData.profitMarginData,
        hasCogsBreakdown: !!profitData.cogsBreakdown,
        hasOpexBreakdown: !!profitData.opexBreakdown
      });
      return null;
    }

    try {
      const costAnalysis = calculateCostAnalysis(profitData);
      
      if (!costAnalysis) {
        logger.warn('useIndividualTargetAnalysis: calculateCostAnalysis mengembalikan null/undefined');
        return null;
      }

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
    } catch (error) {
      logger.error('Error in useIndividualTargetAnalysis:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for priority-based action planning
 */
export const useActionPlan = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useActionPlan: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    // ✅ Validasi properti yang dibutuhkan untuk perhitungan action plan
    if (
      !profitData.profitMarginData ||
      !profitData.cogsBreakdown ||
      !profitData.opexBreakdown
    ) {
       logger.warn('useActionPlan: Struktur profitData tidak lengkap untuk action plan', { 
        hasProfitMarginData: !!profitData.profitMarginData,
        hasCogsBreakdown: !!profitData.cogsBreakdown,
        hasOpexBreakdown: !!profitData.opexBreakdown
      });
      return null;
    }

    try {
      const costAnalysis = calculateCostAnalysis(profitData);
      
      if (!costAnalysis) {
        logger.warn('useActionPlan: calculateCostAnalysis mengembalikan null/undefined');
        return null;
      }

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
        criticalIssues: (costStructureAnalysis.overall.criticalIssues || [])
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
    } catch (error) {
      logger.error('Error in useActionPlan:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for goal setting and tracking
 */
export const useGoalTracking = (
  profitData: ProfitAnalysisResult | null | undefined,
  customTargets?: {
    materialTarget?: number;
    laborTarget?: number;
    cogsTarget?: number;
    opexTarget?: number;
    marginTarget?: number;
  }
) => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useGoalTracking: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    // ✅ Validasi properti yang dibutuhkan untuk perhitungan goal tracking
    if (
      !profitData.profitMarginData ||
      !profitData.cogsBreakdown ||
      !profitData.opexBreakdown
    ) {
       logger.warn('useGoalTracking: Struktur profitData tidak lengkap untuk goal tracking', { 
        hasProfitMarginData: !!profitData.profitMarginData,
        hasCogsBreakdown: !!profitData.cogsBreakdown,
        hasOpexBreakdown: !!profitData.opexBreakdown
      });
      return null;
    }

    try {
      const costAnalysis = calculateCostAnalysis(profitData);
      
      if (!costAnalysis) {
        logger.warn('useGoalTracking: calculateCostAnalysis mengembalikan null/undefined');
        return null;
      }

      const targets = {
        material: customTargets?.materialTarget ?? ANALYSIS_TARGETS.MATERIAL.target,
        labor: customTargets?.laborTarget ?? ANALYSIS_TARGETS.LABOR.target,
        cogs: customTargets?.cogsTarget ?? ANALYSIS_TARGETS.COGS.target,
        opex: customTargets?.opexTarget ?? ANALYSIS_TARGETS.OPEX.target,
        margin: customTargets?.marginTarget ?? ANALYSIS_TARGETS.NET_MARGIN.target
      };

      // ✅ Validasi nilai-nilai kritis untuk perhitungan goal
      const currentMaterialRatio = costAnalysis.materialRatio;
      const currentLaborRatio = costAnalysis.laborRatio;
      const currentCogsRatio = costAnalysis.cogsRatio;
      const currentOpexRatio = costAnalysis.opexRatio;
      const currentNetMargin = profitData.profitMarginData.netMargin;

      // Pastikan tidak ada pembagian dengan nol atau nilai tidak valid
      const safeTargets = {
        material: targets.material !== 0 ? targets.material : 1,
        labor: targets.labor !== 0 ? targets.labor : 1,
        cogs: targets.cogs !== 0 ? targets.cogs : 1,
        opex: targets.opex !== 0 ? targets.opex : 1,
        margin: targets.margin !== 0 ? targets.margin : 1
      };

      const goalTracking = {
        material: {
          current: currentMaterialRatio,
          target: targets.material,
          gap: currentMaterialRatio - targets.material,
          progress: Math.max(0, Math.min(100, (targets.material / Math.abs(currentMaterialRatio || 1)) * 100)),
          achievable: Math.abs(currentMaterialRatio - targets.material) <= 10
        },
        labor: {
          current: currentLaborRatio,
          target: targets.labor,
          gap: currentLaborRatio - targets.labor,
          progress: Math.max(0, Math.min(100, (targets.labor / Math.abs(currentLaborRatio || 1)) * 100)),
          achievable: Math.abs(currentLaborRatio - targets.labor) <= 5
        },
        cogs: {
          current: currentCogsRatio,
          target: targets.cogs,
          gap: currentCogsRatio - targets.cogs,
          progress: Math.max(0, Math.min(100, (targets.cogs / Math.abs(currentCogsRatio || 1)) * 100)),
          achievable: Math.abs(currentCogsRatio - targets.cogs) <= 15
        },
        opex: {
          current: currentOpexRatio,
          target: targets.opex,
          gap: currentOpexRatio - targets.opex,
          progress: Math.max(0, Math.min(100, (targets.opex / Math.abs(currentOpexRatio || 1)) * 100)),
          achievable: Math.abs(currentOpexRatio - targets.opex) <= 10
        },
        margin: {
          current: currentNetMargin,
          target: targets.margin,
          gap: currentNetMargin - targets.margin,
          progress: Math.max(0, Math.min(100, (currentNetMargin / Math.abs(targets.margin || 1)) * 100)),
          achievable: currentNetMargin >= (targets.margin * 0.7)
        }
      };

      return {
        goals: goalTracking,
        summary: {
          achievableGoals: Object.values(goalTracking).filter(g => g.achievable).length,
          totalGoals: Object.keys(goalTracking).length,
          averageProgress: Object.values(goalTracking).reduce((sum, g) => sum + (g.progress || 0), 0) / Object.keys(goalTracking).length,
          priorityAreas: Object.entries(goalTracking)
            .filter(([, goal]) => Math.abs(goal.gap) > 5)
            .sort(([, a], [, b]) => Math.abs(b.gap) - Math.abs(a.gap))
            .map(([area]) => area)
        }
      };
    } catch (error) {
      logger.error('Error in useGoalTracking:', error);
      return null;
    }
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
  if ((costAnalysis.materialRatio || 0) > 45) {
    quickWins.push({
      area: 'Material Procurement',
      description: 'Renegotiate with top 3 suppliers for better rates',
      impact: 'high' as const,
      effort: 'low' as const,
      timeframe: '1-2 months'
    });
  }

  // Administrative cost reduction
  if ((costAnalysis.opexRatio || 0) > 25) {
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
  if ((costAnalysis.laborRatio || 0) > 20) {
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