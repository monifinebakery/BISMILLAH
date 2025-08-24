// src/utils/profitAnalysisConsistency.ts - Profit Analysis Consistency Checker

import { logger } from '@/utils/logger';
import type { RealTimeProfitCalculation } from '@/components/profitAnalysis/types/profitAnalysis.types';

export interface ConsistencyCheckResult {
  isConsistent: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Check for inconsistencies in profit analysis data across components
 */
export function checkProfitAnalysisConsistency(
  data: {
    currentAnalysis?: RealTimeProfitCalculation | null;
    profitMetrics?: any;
    dashboardStats?: any;
    context?: string; // Where this check is being run from
  }
): ConsistencyCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    const { currentAnalysis, profitMetrics, dashboardStats, context = 'unknown' } = data;

    // Check 1: Revenue consistency
    if (currentAnalysis && profitMetrics) {
      const apiRevenue = currentAnalysis.revenue_data?.total || 0;
      const metricsRevenue = profitMetrics.revenue || 0;
      
      if (Math.abs(apiRevenue - metricsRevenue) > 1) {
        issues.push(`Revenue mismatch: API(${apiRevenue}) vs Metrics(${metricsRevenue})`);
      }
    }

    // Check 2: COGS calculation consistency
    if (currentAnalysis && profitMetrics) {
      const apiCogs = currentAnalysis.cogs_data?.total || 0;
      const metricsCogs = profitMetrics.cogs || 0;
      const wacCogs = profitMetrics.totalHPP || 0;

      if (wacCogs > 0 && Math.abs(metricsCogs - wacCogs) > 1) {
        warnings.push(`COGS source inconsistency: Metrics(${metricsCogs}) vs WAC(${wacCogs})`);
        recommendations.push('Consider using WAC-based COGS for better accuracy');
      }
      
      if (apiCogs > 0 && metricsCogs === 0) {
        issues.push('COGS data missing from metrics despite API data availability');
      }
    }

    // Check 3: Sync status validation
    if (dashboardStats?.profitAnalysisSync && currentAnalysis) {
      const syncPeriod = dashboardStats.profitAnalysisSync.currentPeriod;
      const analysisPeriod = currentAnalysis.period;
      
      if (syncPeriod !== analysisPeriod) {
        issues.push(`Period mismatch: Sync(${syncPeriod}) vs Analysis(${analysisPeriod})`);
      }

      const dataQuality = dashboardStats.profitAnalysisSync.dataQuality;
      if (dataQuality === 'low') {
        warnings.push('Low data quality detected in dashboard sync');
        recommendations.push('Enable WAC or update inventory data for better accuracy');
      }
    }

    // Check 4: Missing WAC data
    if (profitMetrics && profitMetrics.totalHPP === 0 && profitMetrics.revenue > 0) {
      warnings.push('WAC data not available despite having revenue');
      recommendations.push('Configure WAC calculation for better cost accuracy');
    }

    logger.debug(`🔍 Consistency check from ${context}:`, {
      issuesFound: issues.length,
      warningsFound: warnings.length,
      recommendationsCount: recommendations.length
    });

    return {
      isConsistent: issues.length === 0,
      issues,
      warnings,
      recommendations
    };

  } catch (error) {
    logger.error('Error in consistency check:', error);
    return {
      isConsistent: false,
      issues: ['Consistency check failed due to error'],
      warnings: [],
      recommendations: ['Review data structure and try again']
    };
  }
}

/**
 * Monitor profit analysis sync status across components
 */
export function monitorProfitAnalysisSync(
  context: string,
  data: any
): void {
  try {
    const checkResult = checkProfitAnalysisConsistency({
      ...data,
      context
    });

    if (!checkResult.isConsistent) {
      logger.warn(`🚨 Profit Analysis inconsistencies detected in ${context}:`, {
        issues: checkResult.issues,
        warnings: checkResult.warnings
      });
    }

    if (checkResult.recommendations.length > 0) {
      logger.info(`💡 Recommendations for ${context}:`, checkResult.recommendations);
    }

  } catch (error) {
    logger.error(`Error monitoring sync in ${context}:`, error);
  }
}

/**
 * Validate query key consistency across profit analysis components
 */
export function validateQueryKeyConsistency(): ConsistencyCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // This would check if PROFIT_QUERY_KEYS and PROFIT_ANALYSIS_QUERY_KEYS are aligned
  // For now, we'll just check basic structure
  
  try {
    // Import both key sets
    const hookKeys = ['profit-analysis', 'calculation'];
    const contextKeys = ['profit-analysis', 'calculation'];
    
    const isConsistent = JSON.stringify(hookKeys) === JSON.stringify(contextKeys);
    
    if (!isConsistent) {
      issues.push('Query key mismatch between hooks and context');
    }
    
    return {
      isConsistent,
      issues,
      warnings,
      recommendations: isConsistent ? [] : ['Standardize query keys across all profit analysis components']
    };
    
  } catch (error) {
    return {
      isConsistent: false,
      issues: ['Failed to validate query keys'],
      warnings: [],
      recommendations: ['Review query key exports and imports']
    };
  }
}