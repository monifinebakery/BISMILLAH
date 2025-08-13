// src/components/profitAnalysis/tabs/RincianTab/hooks/useEfficiencyMetrics.ts

import { useMemo } from 'react';
import { ProfitAnalysisResult } from '../../types';
import { EfficiencyMetrics } from '../types/calculations';
import { calculateEfficiencyMetrics } from '../utils/calculations';
import { validateProfitData } from '../utils/validators';
import { COST_TARGETS } from '../constants/targets';

/**
 * Hook for efficiency metrics calculations
 */
export const useEfficiencyMetrics = (profitData: ProfitAnalysisResult | null): EfficiencyMetrics | null => {
  return useMemo(() => {
    if (!profitData || !validateProfitData(profitData)) {
      return null;
    }

    try {
      return calculateEfficiencyMetrics(profitData);
    } catch (error) {
      console.error('Error in useEfficiencyMetrics:', error);
      return null;
    }
  }, [profitData]);
};

/**
 * Hook for efficiency metrics with performance scoring
 */
export const useEfficiencyMetricsWithScoring = (profitData: ProfitAnalysisResult | null) => {
  return useMemo(() => {
    const metrics = calculateEfficiencyMetrics(profitData);
    
    if (!metrics || !profitData) {
      return null;
    }

    // Calculate performance scores (0-100 for each metric)
    const scores = {
      revenuePerCostScore: Math.min(100, (metrics.revenuePerCost / COST_TARGETS.MIN_REVENUE_PER_COST) * 100),
      cogsEfficiencyScore: Math.min(100, (metrics.cogsEfficiency / COST_TARGETS.MIN_COGS_EFFICIENCY) * 100),
      opexEfficiencyScore: Math.min(100, (metrics.opexEfficiency / COST_TARGETS.MIN_OPEX_EFFICIENCY) * 100),
      materialEfficiencyScore: Math.min(100, (metrics.materialEfficiency / 2.5) * 100), // Target: 2.5x
      laborEfficiencyScore: Math.min(100, (metrics.laborEfficiency / 5.0) * 100), // Target: 5.0x
      overheadScore: Math.max(0, 100 - (metrics.overheadRate - 15) * 2) // Target: 15%, penalty for excess
    };

    // Calculate overall efficiency score
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    // Efficiency levels
    const getEfficiencyLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
      if (score >= 90) return 'excellent';
      if (score >= 75) return 'good';
      if (score >= 60) return 'fair';
      return 'poor';
    };

    // Identify improvement areas
    const improvementAreas = Object.entries(scores)
      .filter(([, score]) => score < 70)
      .map(([metric, score]) => ({
        metric: metric.replace('Score', ''),
        score: Math.round(score),
        priority: score < 50 ? 'high' : 'medium'
      }))
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
          .filter(([, score]) => score >= 80)
          .map(([metric]) => metric.replace('Score', '')),
        recommendations: generateEfficiencyRecommendations(metrics, scores)
      }
    };
  }, [profitData]);
};

/**
 * Hook for tracking efficiency trends (requires historical data)
 */
export const useEfficiencyTrends = (
  currentData: ProfitAnalysisResult | null,
  historicalData?: ProfitAnalysisResult[]
) => {
  return useMemo(() => {
    const currentMetrics = calculateEfficiencyMetrics(currentData);
    
    if (!currentMetrics || !historicalData || historicalData.length === 0) {
      return {
        current: currentMetrics,
        trends: null
      };
    }

    // Calculate historical metrics
    const historicalMetrics = historicalData
      .map(data => calculateEfficiencyMetrics(data))
      .filter(Boolean);

    if (historicalMetrics.length === 0) {
      return {
        current: currentMetrics,
        trends: null
      };
    }

    // Calculate trends
    const getAverageMetrics = (metrics: EfficiencyMetrics[]) => ({
      revenuePerCost: metrics.reduce((sum, m) => sum + m.revenuePerCost, 0) / metrics.length,
      cogsEfficiency: metrics.reduce((sum, m) => sum + m.cogsEfficiency, 0) / metrics.length,
      opexEfficiency: metrics.reduce((sum, m) => sum + m.opexEfficiency, 0) / metrics.length,
      materialEfficiency: metrics.reduce((sum, m) => sum + m.materialEfficiency, 0) / metrics.length,
      laborEfficiency: metrics.reduce((sum, m) => sum + m.laborEfficiency, 0) / metrics.length,
      overheadRate: metrics.reduce((sum, m) => sum + m.overheadRate, 0) / metrics.length
    });

    const avgHistorical = getAverageMetrics(historicalMetrics);
    
    const trends = {
      revenuePerCost: {
        change: currentMetrics.revenuePerCost - avgHistorical.revenuePerCost,
        changePercent: ((currentMetrics.revenuePerCost - avgHistorical.revenuePerCost) / avgHistorical.revenuePerCost) * 100,
        trend: currentMetrics.revenuePerCost > avgHistorical.revenuePerCost ? 'improving' : 'declining'
      },
      cogsEfficiency: {
        change: currentMetrics.cogsEfficiency - avgHistorical.cogsEfficiency,
        changePercent: ((currentMetrics.cogsEfficiency - avgHistorical.cogsEfficiency) / avgHistorical.cogsEfficiency) * 100,
        trend: currentMetrics.cogsEfficiency > avgHistorical.cogsEfficiency ? 'improving' : 'declining'
      },
      opexEfficiency: {
        change: currentMetrics.opexEfficiency - avgHistorical.opexEfficiency,
        changePercent: ((currentMetrics.opexEfficiency - avgHistorical.opexEfficiency) / avgHistorical.opexEfficiency) * 100,
        trend: currentMetrics.opexEfficiency > avgHistorical.opexEfficiency ? 'improving' : 'declining'
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

  if (scores.revenuePerCostScore < 70) {
    recommendations.push('Improve overall cost control - revenue per cost is below target');
  }

  if (scores.cogsEfficiencyScore < 70) {
    recommendations.push('Optimize production efficiency - COGS consuming too much revenue');
  }

  if (scores.opexEfficiencyScore < 70) {
    recommendations.push('Streamline operations - OPEX efficiency needs improvement');
  }

  if (scores.materialEfficiencyScore < 70) {
    recommendations.push('Enhance material utilization - review supplier contracts and waste reduction');
  }

  if (scores.laborEfficiencyScore < 70) {
    recommendations.push('Boost labor productivity - consider automation and training programs');
  }

  if (scores.overheadScore < 70) {
    recommendations.push('Reduce overhead rate - review indirect costs and allocation methods');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current efficiency levels and focus on continuous improvement');
  }

  return recommendations;
};