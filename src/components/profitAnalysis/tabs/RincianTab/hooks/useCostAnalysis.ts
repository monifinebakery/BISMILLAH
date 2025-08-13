// src/components/profitAnalysis/tabs/RincianTab/hooks/useCostAnalysis.ts

import { useMemo } from 'react';
import { logger } from '@/utils/logger'; // ✅ Import logger
import { ProfitAnalysisResult } from '../../types';
import { CostAnalysis } from '../types/calculations';
import { calculateCostAnalysis } from '../utils/calculations';
import { validateProfitData } from '../utils/validators'; // ✅ Import validator

/**
 * Hook for cost analysis calculations with validation
 */
export const useCostAnalysis = (profitData: ProfitAnalysisResult | null | undefined): CostAnalysis | null => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysis: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
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
 */
export const useCostAnalysisWithMetadata = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysisWithMetadata: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    // ✅ Validasi properti yang dibutuhkan untuk perhitungan metadata
    if (
      !profitData.profitMarginData ||
      !profitData.cogsBreakdown ||
      !profitData.opexBreakdown
    ) {
       logger.warn('useCostAnalysisWithMetadata: Struktur profitData tidak lengkap untuk metadata', { 
        hasProfitMarginData: !!profitData.profitMarginData,
        hasCogsBreakdown: !!profitData.cogsBreakdown,
        hasOpexBreakdown: !!profitData.opexBreakdown
      });
      return null;
    }

    try {
      const costAnalysis = calculateCostAnalysis(profitData);
      
      if (!costAnalysis) { // Tambahkan pengecekan hasil calculateCostAnalysis
        logger.warn('useCostAnalysisWithMetadata: calculateCostAnalysis mengembalikan null/undefined');
        return null;
      }

      // Calculate additional metadata
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
      logger.error('Error in useCostAnalysisWithMetadata:', error);
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
  profitData: ProfitAnalysisResult | null | undefined,
  industryBenchmarks?: {
    materialRatio: number;
    laborRatio: number;
    cogsRatio: number;
    opexRatio: number;
  }
) => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysisComparison: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    // ✅ Validasi benchmarks
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