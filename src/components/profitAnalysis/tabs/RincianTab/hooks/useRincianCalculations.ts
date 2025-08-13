// src/components/profitAnalysis/tabs/rincianTab/hooks/useRincianCalculations.ts

import { useMemo } from 'react';
import { ProfitAnalysisResult } from '../../types';
import { RincianCalculations } from '../types/calculations';
import { 
  calculateCostAnalysis,
  calculateEfficiencyMetrics,
  calculateOpexComposition,
  calculateMaterialUsageStats
} from '../utils/calculations';
import { 
  analyzeCostStructure,
  generateRecommendations
} from '../utils/targetAnalysis';
import { 
  calculateDataQualityScore,
  validateDataConsistency,
  hasActualMaterialUsage
} from '../utils/validators';

/**
 * Main hook for all rincian calculations
 */
export const useRincianCalculations = (profitData: ProfitAnalysisResult | null): RincianCalculations | null => {
  return useMemo(() => {
    if (!profitData) return null;

    try {
      // 1. Calculate cost analysis ratios
      const costAnalysis = calculateCostAnalysis(profitData);

      // 2. Calculate efficiency metrics
      const efficiencyMetrics = calculateEfficiencyMetrics(profitData);

      // 3. Calculate OPEX composition
      const opexComposition = calculateOpexComposition(profitData.opexBreakdown);

      // 4. Calculate material usage stats (if available)
      const materialUsageStats = hasActualMaterialUsage(profitData)
        ? calculateMaterialUsageStats(profitData.cogsBreakdown.actualMaterialUsage!)
        : null;

      // 5. Analyze cost structure against targets
      const costStructureAnalysis = analyzeCostStructure(costAnalysis);

      // 6. Generate recommendations
      const recommendations = generateRecommendations(
        costAnalysis,
        profitData.cogsBreakdown.dataSource || 'estimated'
      );

      // 7. Assess data quality
      const dataQualityScore = calculateDataQualityScore(profitData);
      const consistencyWarnings = validateDataConsistency(profitData);
      
      const dataQuality = {
        ...dataQualityScore,
        warnings: consistencyWarnings
      };

      return {
        costAnalysis,
        efficiencyMetrics,
        opexComposition,
        materialUsageStats,
        costStructureAnalysis,
        recommendations,
        dataQuality
      };

    } catch (error) {
      console.error('Error in useRincianCalculations:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for cost analysis with memoized calculations
 */
export const useCostAnalysis = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData) return null;
    return calculateCostAnalysis(profitData);
  }, [profitData]);
};

/**
 * Hook for efficiency metrics with memoized calculations
 */
export const useEfficiencyMetrics = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData) return null;
    return calculateEfficiencyMetrics(profitData);
  }, [profitData]);
};

/**
 * Hook for target analysis with status colors and recommendations
 */
export const useTargetAnalysis = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData) return null;

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
  }, [profitData]);
};