// src/components/profitAnalysis/tabs/RincianTab/hooks/useEfficiencyMetrics.ts

import { useMemo } from 'react';
import { logger } from '@/utils/logger'; // ✅ Import logger
import { ProfitAnalysisResult } from '../../types';
import { EfficiencyMetrics } from '../types/calculations';
import { calculateEfficiencyMetrics } from '../utils/calculations';
import { validateProfitData } from '../utils/validators'; // ✅ Import validator
import { COST_TARGETS } from '../constants/targets';

/**
 * Hook for efficiency metrics calculations
 */
export const useEfficiencyMetrics = (profitData: ProfitAnalysisResult | null | undefined): EfficiencyMetrics | null => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useEfficiencyMetrics: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    try {
      return calculateEfficiencyMetrics(profitData);
    } catch (error) {
      logger.error('Error in useEfficiencyMetrics:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for efficiency metrics with performance scoring
 */
export const useEfficiencyMetricsWithScoring = (profitData: ProfitAnalysisResult | null | undefined) => {
  return useMemo(() => {
    // ✅ VALIDASI DATA YANG DIPERKUAT MENGGUNAKAN VALIDATOR TERPUSAT
    if (!profitData || !validateProfitData(profitData)) {
      logger.warn('useEfficiencyMetricsWithScoring: Data profit tidak valid atau tidak lengkap', { profitData: !!profitData });
      return null;
    }

    // ✅ Validasi properti yang dibutuhkan untuk perhitungan efisiensi
    if (
      !profitData.profitMarginData ||
      !profitData.cogsBreakdown ||
      !profitData.opexBreakdown
    ) {
       logger.warn('useEfficiencyMetricsWithScoring: Struktur profitData tidak lengkap untuk efisiensi', { 
        hasProfitMarginData: !!profitData.profitMarginData,
        hasCogsBreakdown: !!profitData.cogsBreakdown,
        hasOpexBreakdown: !!profitData.opexBreakdown
      });
      return null;
    }

    try {
      const metrics = calculateEfficiencyMetrics(profitData);
      
      if (!metrics) {
        logger.warn('useEfficiencyMetricsWithScoring: calculateEfficiencyMetrics mengembalikan null/undefined');
        return null;
      }

      // Calculate performance scores (0-100 for each metric)
      // ✅ Tambahkan pengecekan nol untuk menghindari NaN/Infinity dan gunakan nilai default yang aman
      const revenuePerCost = metrics.revenuePerCost || 0; // Jika 0, score akan 0
      const cogsEfficiency = metrics.cogsEfficiency || 0.01; // Hindari pembagian dengan nol untuk scoring
      const opexEfficiency = metrics.opexEfficiency || 0.01;
      const materialEfficiency = metrics.materialEfficiency || 0.01;
      const laborEfficiency = metrics.laborEfficiency || 0.01;
      const overheadRate = metrics.overheadRate || 0;

      const scores = {
        revenuePerCostScore: Math.min(100, (revenuePerCost / (COST_TARGETS.MIN_REVENUE_PER_COST || 1)) * 100),
        cogsEfficiencyScore: Math.min(100, (cogsEfficiency / (COST_TARGETS.MIN_COGS_EFFICIENCY || 1)) * 100),
        opexEfficiencyScore: Math.min(100, (opexEfficiency / (COST_TARGETS.MIN_OPEX_EFFICIENCY || 1)) * 100),
        materialEfficiencyScore: Math.min(100, (materialEfficiency / 2.5) * 100), // Target: 2.5x
        laborEfficiencyScore: Math.min(100, (laborEfficiency / 5.0) * 100), // Target: 5.0x
        overheadScore: Math.max(0, 100 - (overheadRate - 15) * 2) // Target: 15%, penalty for excess
      };

      // Calculate overall efficiency score
      const overallScore = Object.values(scores).reduce((sum, score) => {
        // Pastikan score adalah angka yang valid
        const validScore = typeof score === 'number' && !isNaN(score) ? score : 0;
        return sum + validScore;
      }, 0) / Object.keys(scores).length;

      // Efficiency levels
      const getEfficiencyLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        return 'poor';
      };

      // Identify improvement areas
      const improvementAreas = Object.entries(scores)
        .filter(([, score]) => {
          const validScore = typeof score === 'number' && !isNaN(score) ? score : 100; // Default 100 jika tidak valid
          return validScore < 70;
        })
        .map(([metric, score]) => {
          const validScore = typeof score === 'number' && !isNaN(score) ? score : 0;
          return {
            metric: metric.replace('Score', ''),
            score: Math.round(validScore),
            priority: validScore < 50 ? 'high' : 'medium'
          };
        })
        .sort((a, b) => a.score - b.score);

      return {
        metrics,
        scores: {
          ...scores,
          overall: Math.round(overallScore)
        },
        analysis: {
          level: getEfficiencyLevel(overallScore),
          improvementAreas,
          strengths: Object.entries(scores)
            .filter(([, score]) => {
              const validScore = typeof score === 'number' && !isNaN(score) ? score : 0;
              return validScore >= 80;
            })
            .map(([metric]) => metric.replace('Score', '')),
          recommendations: generateEfficiencyRecommendations(metrics, scores)
        }
      };
    } catch (error) {
      logger.error('Error in useEfficiencyMetricsWithScoring:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for tracking efficiency trends (requires historical data)
 */
export const useEfficiencyTrends = (
  currentData: ProfitAnalysisResult | null | undefined,
  historicalData?: ProfitAnalysisResult[]
) => {
  return useMemo(() => {
    // ✅ Validasi data saat ini
    if (!currentData || !validateProfitData(currentData)) {
      logger.warn('useEfficiencyTrends: Data profit saat ini tidak valid atau tidak lengkap', { currentData: !!currentData });
      return {
        current: null,
        trends: null
      };
    }

    const currentMetrics = calculateEfficiencyMetrics(currentData);
    
    if (!currentMetrics) {
      logger.warn('useEfficiencyTrends: Gagal menghitung metrik efisiensi untuk data saat ini');
      return {
        current: null,
        trends: null
      };
    }

    // ✅ Validasi data historis
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
      logger.info('useEfficiencyTrends: Data historis tidak tersedia');
      return {
        current: currentMetrics,
        trends: null
      };
    }

    // Calculate historical metrics
    const historicalMetrics = historicalData
      .map(data => {
        if (!validateProfitData(data)) {
          logger.warn('useEfficiencyTrends: Data historis tidak valid ditemukan', { data });
          return null;
        }
        return calculateEfficiencyMetrics(data);
      })
      .filter(Boolean); // Filter out null/undefined results

    if (historicalMetrics.length === 0) {
      logger.info('useEfficiencyTrends: Tidak ada data historis yang valid untuk dihitung');
      return {
        current: currentMetrics,
        trends: null
      };
    }

    // Calculate trends
    const getAverageMetrics = (metrics: EfficiencyMetrics[]) => {
      const count = metrics.length;
      if (count === 0) return currentMetrics; // Return current if no history

      return {
        revenuePerCost: metrics.reduce((sum, m) => sum + (m.revenuePerCost || 0), 0) / count,
        cogsEfficiency: metrics.reduce((sum, m) => sum + (m.cogsEfficiency || 0), 0) / count,
        opexEfficiency: metrics.reduce((sum, m) => sum + (m.opexEfficiency || 0), 0) / count,
        materialEfficiency: metrics.reduce((sum, m) => sum + (m.materialEfficiency || 0), 0) / count,
        laborEfficiency: metrics.reduce((sum, m) => sum + (m.laborEfficiency || 0), 0) / count,
        overheadRate: metrics.reduce((sum, m) => sum + (m.overheadRate || 0), 0) / count
      };
    };

    const avgHistorical = getAverageMetrics(historicalMetrics as EfficiencyMetrics[]);
    
    const trends = {
      revenuePerCost: {
        change: (currentMetrics.revenuePerCost || 0) - (avgHistorical.revenuePerCost || 0),
        changePercent: avgHistorical.revenuePerCost && avgHistorical.revenuePerCost !== 0 
          ? (((currentMetrics.revenuePerCost || 0) - (avgHistorical.revenuePerCost || 0)) / Math.abs(avgHistorical.revenuePerCost)) * 100 
          : 0,
        trend: (currentMetrics.revenuePerCost || 0) > (avgHistorical.revenuePerCost || 0) ? 'improving' : 'declining'
      },
      cogsEfficiency: {
        change: (currentMetrics.cogsEfficiency || 0) - (avgHistorical.cogsEfficiency || 0),
        changePercent: avgHistorical.cogsEfficiency && avgHistorical.cogsEfficiency !== 0 
          ? (((currentMetrics.cogsEfficiency || 0) - (avgHistorical.cogsEfficiency || 0)) / Math.abs(avgHistorical.cogsEfficiency)) * 100 
          : 0,
        trend: (currentMetrics.cogsEfficiency || 0) > (avgHistorical.cogsEfficiency || 0) ? 'improving' : 'declining'
      },
      opexEfficiency: {
        change: (currentMetrics.opexEfficiency || 0) - (avgHistorical.opexEfficiency || 0),
        changePercent: avgHistorical.opexEfficiency && avgHistorical.opexEfficiency !== 0 
          ? (((currentMetrics.opexEfficiency || 0) - (avgHistorical.opexEfficiency || 0)) / Math.abs(avgHistorical.opexEfficiency)) * 100 
          : 0,
        trend: (currentMetrics.opexEfficiency || 0) > (avgHistorical.opexEfficiency || 0) ? 'improving' : 'declining'
      }
    };

    return {
      current: currentMetrics,
      historical: avgHistorical,
      trends
    };
  }, [currentData, historicalData]);
};

/**
 * Generate efficiency-specific recommendations
 */
const generateEfficiencyRecommendations = (
  metrics: EfficiencyMetrics,
  scores: Record<string, number>
): string[] => {
  const recommendations: string[] = [];

  // Pastikan scores adalah angka yang valid
  const validScores = Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [
      key,
      typeof value === 'number' && !isNaN(value) ? value : 100 // Default 100 jika tidak valid
    ])
  );

  if (validScores.revenuePerCostScore < 70) {
    recommendations.push('Improve overall cost control - revenue per cost is below target');
  }

  if (validScores.cogsEfficiencyScore < 70) {
    recommendations.push('Optimize production efficiency - COGS consuming too much revenue');
  }

  if (validScores.opexEfficiencyScore < 70) {
    recommendations.push('Streamline operations - OPEX efficiency needs improvement');
  }

  if (validScores.materialEfficiencyScore < 70) {
    recommendations.push('Enhance material utilization - review supplier contracts and waste reduction');
  }

  if (validScores.laborEfficiencyScore < 70) {
    recommendations.push('Boost labor productivity - consider automation and training programs');
  }

  if (validScores.overheadScore < 70) {
    recommendations.push('Reduce overhead rate - review indirect costs and allocation methods');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current efficiency levels and focus on continuous improvement');
  }

  return recommendations;
};