// src/components/profitAnalysis/tabs/RincianTab/hooks/useRincianCalculations.ts
// ✅ Updated with robust validation and logger

import { useMemo } from 'react';
import { logger } from '@/utils/logger'; // ✅ Import logger
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
  hasActualMaterialUsage,
  validateProfitData // ✅ Import validator
} from '../utils/validators';

/**
 * Main hook for all rincian calculations
 * ✅ ROBUST VALIDATION
 */
export const useRincianCalculations = (profitData: ProfitAnalysisResult | null): RincianCalculations | null => {
  return useMemo(() => {
    // 1. ✅ Validasi awal menggunakan validator terpusat
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useRincianCalculations: Data profit tidak valid atau tidak lengkap diterima', { hasProfitData: !!profitData });
      return null;
    }

    // 2. ✅ Validasi tambahan untuk properti kritis yang digunakan langsung dalam hook ini
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
      logger.warn('useRincianCalculations: Terdapat nilai kritis yang tidak valid sebelum perhitungan', { invalidValues, profitData });
    }

    try {
      // Sekarang aman untuk menggunakan profitData

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
      logger.error('Error in useRincianCalculations:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for cost analysis with memoized calculations
 * ✅ ROBUST VALIDATION
 */
export const useCostAnalysisMemo = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysisMemo: Data profit tidak valid atau tidak lengkap', { hasProfitData: !!profitData });
      return null;
    }
    return calculateCostAnalysis(profitData);
  }, [profitData]);
};

/**
 * Hook for efficiency metrics with memoized calculations
 * ✅ ROBUST VALIDATION
 */
export const useEfficiencyMetricsMemo = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useEfficiencyMetricsMemo: Data profit tidak valid atau tidak lengkap', { hasProfitData: !!profitData });
      return null;
    }
    return calculateEfficiencyMetrics(profitData);
  }, [profitData]);
};

/**
 * Hook for target analysis with status colors and recommendations
 * ✅ ROBUST VALIDATION
 */
export const useTargetAnalysisMemo = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useTargetAnalysisMemo: Data profit tidak valid atau tidak lengkap', { hasProfitData: !!profitData });
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
      logger.error('Error in useTargetAnalysisMemo:', error);
      return null;
    }
  }, [profitData]);
};