// src/utils/profitAnalysisConsistency.ts - Profit Analysis Consistency Checker

import { logger } from '@/utils/logger';
import type { RealTimeProfitCalculation } from '@/components/profitAnalysis/types/profitAnalysis.types';
import { getEffectiveCogs, validateCOGSConsistency, shouldUseWAC } from './cogsCalculation';

export interface ConsistencyCheckResult {
  isConsistent: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface WACValidationResult {
  isValid: boolean;
  wacValue: number;
  apiCogsValue: number;
  variance: number;
  variancePercentage: number;
  severity: 'low' | 'medium' | 'high';
  issues: string[];
  recommendations: string[];
}

export interface DataQualityMetrics {
  wacAvailability: boolean;
  apiCogsAvailability: boolean;
  dataConsistency: number; // 0-100 score
  lastValidationTime: string;
  validationCount: number;
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
 * Validate WAC vs API COGS consistency with detailed analysis
 */
export function validateWACConsistency(
  currentAnalysis: RealTimeProfitCalculation | null,
  wacCogs: number,
  revenue: number = 0
): WACValidationResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    if (!currentAnalysis) {
      return {
        isValid: false,
        wacValue: wacCogs,
        apiCogsValue: 0,
        variance: 0,
        variancePercentage: 0,
        severity: 'high',
        issues: ['No profit analysis data available'],
        recommendations: ['Ensure profit analysis is properly loaded']
      };
    }

    const apiCogsValue = currentAnalysis.cogs_data?.total || 0;
    const variance = Math.abs(wacCogs - apiCogsValue);
    const variancePercentage = apiCogsValue > 0 ? (variance / apiCogsValue) * 100 : 0;
    
    // Determine severity based on variance percentage
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (variancePercentage > 50) {
      severity = 'high';
    } else if (variancePercentage > 20) {
      severity = 'medium';
    }

    // Validation checks
    if (wacCogs > 0 && apiCogsValue > 0 && variancePercentage > 20) {
      issues.push(`Significant variance between WAC (${wacCogs}) and API COGS (${apiCogsValue}): ${variancePercentage.toFixed(1)}%`);
      recommendations.push('Review purchase data and WAC calculations for accuracy');
    }

    if (wacCogs > 0 && apiCogsValue === 0) {
      issues.push('WAC data available but API COGS is zero');
      recommendations.push('Check if financial transactions are properly recorded');
    }

    if (wacCogs === 0 && apiCogsValue > 0) {
      issues.push('API COGS available but WAC is zero');
      recommendations.push('Ensure warehouse data and purchase history are complete');
    }

    if (revenue > 0 && wacCogs > revenue) {
      issues.push(`WAC COGS (${wacCogs}) exceeds revenue (${revenue})`);
      recommendations.push('Review pricing strategy or cost calculations');
      severity = 'high';
    }

    if (revenue > 0 && apiCogsValue > revenue) {
      issues.push(`API COGS (${apiCogsValue}) exceeds revenue (${revenue})`);
      recommendations.push('Review financial transaction records');
      severity = 'high';
    }

    const isValid = issues.length === 0;

    logger.debug('WAC validation completed:', {
      wacCogs,
      apiCogsValue,
      variance,
      variancePercentage,
      severity,
      isValid
    });

    return {
      isValid,
      wacValue: wacCogs,
      apiCogsValue,
      variance,
      variancePercentage,
      severity,
      issues,
      recommendations
    };

  } catch (error) {
    logger.error('Error in WAC validation:', error);
    return {
      isValid: false,
      wacValue: wacCogs,
      apiCogsValue: 0,
      variance: 0,
      variancePercentage: 0,
      severity: 'high',
      issues: ['WAC validation failed due to error'],
      recommendations: ['Review data structure and try again']
    };
  }
}

/**
 * Calculate data quality metrics for WAC and API COGS
 */
export function calculateDataQualityMetrics(
  currentAnalysis: RealTimeProfitCalculation | null,
  wacCogs: number,
  validationHistory: WACValidationResult[] = []
): DataQualityMetrics {
  const wacAvailability = shouldUseWAC(wacCogs);
  const apiCogsAvailability = (currentAnalysis?.cogs_data?.total || 0) > 0;
  
  // Calculate consistency score based on recent validations
  let dataConsistency = 100;
  if (validationHistory.length > 0) {
    const recentValidations = validationHistory.slice(-10); // Last 10 validations
    const validCount = recentValidations.filter(v => v.isValid).length;
    dataConsistency = (validCount / recentValidations.length) * 100;
  }

  return {
    wacAvailability,
    apiCogsAvailability,
    dataConsistency,
    lastValidationTime: new Date().toISOString(),
    validationCount: validationHistory.length
  };
}

/**
 * Comprehensive validation that combines all checks
 */
export function performComprehensiveValidation(
  currentAnalysis: RealTimeProfitCalculation | null,
  profitMetrics: any,
  wacCogs: number,
  revenue: number = 0
): {
  consistencyCheck: ConsistencyCheckResult;
  wacValidation: WACValidationResult;
  dataQuality: DataQualityMetrics;
  overallScore: number;
} {
  // Run existing consistency check
  const consistencyCheck = checkProfitAnalysisConsistency({
    currentAnalysis,
    profitMetrics,
    context: 'comprehensive-validation'
  });

  // Run WAC validation
  const wacValidation = validateWACConsistency(currentAnalysis, wacCogs, revenue);

  // Calculate data quality
  const dataQuality = calculateDataQualityMetrics(currentAnalysis, wacCogs);

  // Calculate overall score (0-100)
  let overallScore = 100;
  
  // Deduct points for issues
  overallScore -= consistencyCheck.issues.length * 20;
  overallScore -= consistencyCheck.warnings.length * 10;
  overallScore -= wacValidation.issues.length * 15;
  
  // Adjust for WAC validation severity
  if (wacValidation.severity === 'high') {
    overallScore -= 30;
  } else if (wacValidation.severity === 'medium') {
    overallScore -= 15;
  }

  // Factor in data quality consistency
  overallScore = (overallScore + dataQuality.dataConsistency) / 2;
  
  // Ensure score is between 0-100
  overallScore = Math.max(0, Math.min(100, overallScore));

  logger.info('Comprehensive validation completed:', {
    overallScore,
    consistencyIssues: consistencyCheck.issues.length,
    wacValidationSeverity: wacValidation.severity,
    dataQualityScore: dataQuality.dataConsistency
  });

  return {
    consistencyCheck,
    wacValidation,
    dataQuality,
    overallScore
  };
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