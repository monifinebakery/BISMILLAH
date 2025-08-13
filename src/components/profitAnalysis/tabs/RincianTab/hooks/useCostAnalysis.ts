// src/components/profitAnalysis/tabs/RincianTab/hooks/useCostAnalysis.ts
// ✅ Updated with robust validation and logger

import { useMemo } from 'react';
import { logger } from '@/utils/logger'; // ✅ Import logger
import { ProfitAnalysisResult } from '../../types';
import { CostAnalysis } from '../types/calculations';
import { calculateCostAnalysis } from '../utils/calculations';
import { validateProfitData } from '../utils/validators'; // ✅ Import validator

/**
 * Hook for cost analysis calculations with validation
 * ✅ ROBUST VALIDATION
 */
export const useCostAnalysis = (profitData: ProfitAnalysisResult | null): CostAnalysis | null => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysis: Data profit tidak valid atau tidak lengkap diterima', { hasProfitData: !!profitData });
      return null;
    }

    const criticalProperties = {
      revenue: profitData.profitMarginData.revenue,
      cogs: profitData.profitMarginData.cogs,
      opex: profitData.profitMarginData.opex,
      totalMaterialCost: profitData.cogsBreakdown.totalMaterialCost,
      totalDirectLaborCost: profitData.cogsBreakdown.totalDirectLaborCost,
      manufacturingOverhead: profitData.cogsBreakdown.manufacturingOverhead,
      totalCOGS: profitData.cogsBreakdown.totalCOGS,
      totalOPEX: profitData.opexBreakdown.totalOPEX
    };

    const invalidValues = Object.entries(criticalProperties).filter(
      ([key, value]) => value == null || (typeof value === 'number' && isNaN(value))
    );

    if (invalidValues.length > 0) {
      logger.warn('useCostAnalysis: Terdapat nilai kritis yang tidak valid sebelum calculateCostAnalysis', { invalidValues, profitData });
    }

    try {
      return calculateCostAnalysis(profitData);
    } catch (error) {
      logger.error('Error in useCostAnalysis:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for cost analysis with additional metadata
 * ✅ ROBUST VALIDATION
 */
export const useCostAnalysisWithMetadata = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysisWithMetadata: Data profit tidak valid atau tidak lengkap diterima', { hasProfitData: !!profitData });
      return null;
    }

    try {
      const criticalProperties = {
        revenue: profitData.profitMarginData.revenue,
        totalCOGS: profitData.cogsBreakdown.totalCOGS,
        totalOPEX: profitData.opexBreakdown.totalOPEX
      };

      const invalidValues = Object.entries(criticalProperties).filter(
        ([key, value]) => value == null || (typeof value === 'number' && isNaN(value))
      );

      if (invalidValues.length > 0) {
        logger.warn('useCostAnalysisWithMetadata: Terdapat nilai kritis yang tidak valid', { invalidValues, profitData });
        return null;
      }

      const costAnalysis = calculateCostAnalysis(profitData);
      
      if (!costAnalysis) {
        logger.warn('useCostAnalysisWithMetadata: calculateCostAnalysis mengembalikan null/undefined');
        return null;
      }

      const totalCosts = profitData.cogsBreakdown.totalCOGS + profitData.opexBreakdown.totalOPEX;
      const revenue = profitData.profitMarginData.revenue;
      
      return {
        ...costAnalysis,
        metadata: {
          totalCosts,
          revenue,
          profitability: revenue > 0 ? ((revenue - totalCosts) / revenue) * 100 : 0,
          costEfficiency: totalCosts > 0 ? revenue / totalCosts : 0,
          breakEvenPoint: totalCosts,
          marginSafety: revenue > totalCosts ? revenue - totalCosts : 0,
          costStructureHealth: {
            isHealthy: costAnalysis.cogsRatio <= 70 && costAnalysis.opexRatio <= 20,
            riskLevel: costAnalysis.cogsRatio > 80 || costAnalysis.opexRatio > 30 ? 'high' : 
                      costAnalysis.cogsRatio > 70 || costAnalysis.opexRatio > 20 ? 'medium' : 'low',
            recommendations: generateQuickRecommendations(costAnalysis)
          }
        }
      };
    } catch (error) {
      logger.error('Error in useCostAnalysisWithMeta', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Generate quick recommendations based on cost analysis
 */
const generateQuickRecommendations = (costAnalysis: CostAnalysis): string[] => {
  const recommendations: string[] = [];

  if (costAnalysis.materialRatio > 50) {
    recommendations.push('Critical: Material costs too high - immediate supplier review needed');
  } else if (costAnalysis.materialRatio > 40) {
    recommendations.push('Warning: Material costs above target - review procurement strategy');
  }

  if (costAnalysis.laborRatio > 25) {
    recommendations.push('Labor costs high - evaluate productivity and automation opportunities');
  }

  if (costAnalysis.opexRatio > 30) {
    recommendations.push('Operational expenses excessive - review non-essential costs');
  }

  if (costAnalysis.cogsRatio > 80) {
    recommendations.push('COGS critically high - comprehensive cost reduction program needed');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cost structure is healthy - focus on continuous improvement');
  }

  return recommendations;
};

/**
 * Hook for comparing cost analysis with industry benchmarks
 */
export const useCostAnalysisComparison = (
  profitData: ProfitAnalysisResult | null,
  industryBenchmarks?: {
    materialRatio: number;
    laborRatio: number;
    cogsRatio: number;
    opexRatio: number;
  }
) => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysisComparison: Data profit tidak valid atau tidak lengkap diterima', { hasProfitData: !!profitData });
      return null;
    }

    if (!industryBenchmarks) {
      logger.warn('useCostAnalysisComparison: Industry benchmarks tidak tersedia');
      return null;
    }

    try {
      const costAnalysis = calculateCostAnalysis(profitData);
      
      if (!costAnalysis) {
        logger.warn('useCostAnalysisComparison: calculateCostAnalysis mengembalikan null/undefined');
        return null;
      }

      return {
        costAnalysis,
        comparison: {
          materialVariance: costAnalysis.materialRatio - industryBenchmarks.materialRatio,
          laborVariance: costAnalysis.laborRatio - industryBenchmarks.laborRatio,
          cogsVariance: costAnalysis.cogsRatio - industryBenchmarks.cogsRatio,
          opexVariance: costAnalysis.opexRatio - industryBenchmarks.opexRatio
        },
        performance: {
          materialPerformance: costAnalysis.materialRatio <= industryBenchmarks.materialRatio ? 'above' : 'below',
          laborPerformance: costAnalysis.laborRatio <= industryBenchmarks.laborRatio ? 'above' : 'below',
          cogsPerformance: costAnalysis.cogsRatio <= industryBenchmarks.cogsRatio ? 'above' : 'below',
          opexPerformance: costAnalysis.opexRatio <= industryBenchmarks.opexRatio ? 'above' : 'below'
        }
      };
    } catch (error) {
      logger.error('Error in useCostAnalysisComparison:', error);
      return null;
    }
  }, [profitData, industryBenchmarks]);
};