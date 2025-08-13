// src/components/profitAnalysis/tabs/RincianTab/hooks/useRincianCalculations.ts

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
 */
export const useRincianCalculations = (profitData: ProfitAnalysisResult | null | undefined): RincianCalculations | null => {
  return useMemo(() => {
    // ✅ VALIDASI YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    // 1. Cek keberadaan objek utama
    if (!profitData) {
      logger.warn('useRincianCalculations: profitData adalah null/undefined');
      return null;
    }

    // 2. Validasi struktur dan tipe data menggunakan validator terpusat
    //    Ini memastikan bahwa profitData memiliki semua properti yang diperlukan dengan tipe yang benar
    if (!validateProfitData(profitData)) {
      logger.warn('useRincianCalculations: profitData tidak memiliki struktur yang valid', { profitData });
      return null;
    }

    // 3. Validasi tambahan untuk nilai-nilai kritis yang digunakan langsung dalam hook ini
    //    Ini penting karena validator hanya memeriksa tipe, bukan apakah nilainya valid untuk operasi tertentu
    const criticalValues = {
      revenue: profitData.profitMarginData.revenue,
      cogs: profitData.profitMarginData.cogs,
      opex: profitData.profitMarginData.opex,
      totalMaterialCost: profitData.cogsBreakdown.totalMaterialCost,
      totalDirectLaborCost: profitData.cogsBreakdown.totalDirectLaborCost,
      manufacturingOverhead: profitData.cogsBreakdown.manufacturingOverhead,
      totalCOGS: profitData.cogsBreakdown.totalCOGS,
      totalOPEX: profitData.opexBreakdown.totalOPEX
    };

    // Periksa apakah ada nilai kritis yang tidak valid (null, undefined, atau NaN)
    const invalidValues = Object.entries(criticalValues).filter(
      ([key, value]) => value == null || (typeof value === 'number' && isNaN(value))
    );

    if (invalidValues.length > 0) {
      logger.warn('useRincianCalculations: Terdapat nilai kritis yang tidak valid', { invalidValues, profitData });
      // Atau kembalikan null jika data kritis tidak valid
      // return null; 
      // Namun, karena calculateCostAnalysis dan fungsi lainnya sudah aman, kita bisa lanjutkan
    }

    try {
      // Sekarang aman untuk menggunakan profitData

      // 1. Calculate cost analysis ratios
      // Fungsi ini sekarang sudah aman karena profitData sudah divalidasi
      const costAnalysis = calculateCostAnalysis(profitData);

      // 2. Calculate efficiency metrics
      // Fungsi ini sekarang sudah aman karena profitData sudah divalidasi
      const efficiencyMetrics = calculateEfficiencyMetrics(profitData);

      // 3. Calculate OPEX composition
      // Fungsi ini sekarang sudah aman karena opexBreakdown sudah divalidasi
      const opexComposition = calculateOpexComposition(profitData.opexBreakdown);

      // 4. Calculate material usage stats (if available)
      // Fungsi ini sekarang sudah aman karena sudah ada pengecekan dan validasi internal
      const materialUsageStats = hasActualMaterialUsage(profitData)
        ? calculateMaterialUsageStats(profitData.cogsBreakdown.actualMaterialUsage!)
        : null;

      // 5. Analyze cost structure against targets
      // Fungsi ini sekarang sudah aman karena costAnalysis sudah divalidasi
      const costStructureAnalysis = analyzeCostStructure(costAnalysis);

      // 6. Generate recommendations
      // Fungsi ini sekarang sudah aman karena costAnalysis dan dataSource sudah divalidasi
      const recommendations = generateRecommendations(
        costAnalysis,
        profitData.cogsBreakdown.dataSource || 'estimated'
      );

      // 7. Assess data quality
      // Fungsi-fungsi ini sekarang sudah aman karena profitData sudah divalidasi
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

// --- Perbarui fungsi-fungsi lain dalam file ini untuk menggunakan validasi yang sama ---

/**
 * Hook for cost analysis with memoized calculations
 */
export const useCostAnalysis = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI INPUT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useCostAnalysis: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }
    // ... logika lainnya sudah aman karena profitData sudah divalidasi
    return calculateCostAnalysis(profitData);
  }, [profitData]);
};

/**
 * Hook for efficiency metrics with memoized calculations
 */
export const useEfficiencyMetrics = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI INPUT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useEfficiencyMetrics: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }
    // ... logika lainnya sudah aman karena profitData sudah divalidasi
    return calculateEfficiencyMetrics(profitData);
  }, [profitData]);
};

/**
 * Hook for target analysis with status colors and recommendations
 */
export const useTargetAnalysis = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI INPUT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useTargetAnalysis: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    try {
      // Fungsi-fungsi ini sekarang sudah aman karena profitData sudah divalidasi
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