// src/utils/profitValidation.ts - Centralized Profit Analysis Validation

import { logger } from '@/utils/logger';

export interface ValidationRules {
  MAX_COGS_RATIO: number;      // Maximum COGS as % of revenue
  MAX_OPEX_RATIO: number;      // Maximum OpEx as % of revenue  
  ALERT_COGS_RATIO: number;    // Alert threshold for COGS
  ALERT_OPEX_RATIO: number;    // Alert threshold for OpEx
  MIN_REVENUE: number;         // Minimum revenue for valid analysis
  MAX_MARGIN: number;          // Maximum realistic margin %
  MIN_MARGIN: number;          // Minimum realistic margin %
}

export const VALIDATION_RULES: ValidationRules = {
  MAX_COGS_RATIO: 0.95,        // 95% of revenue
  MAX_OPEX_RATIO: 2.5,         // 250% of revenue (for startups)
  ALERT_COGS_RATIO: 0.8,       // 80% alert threshold
  ALERT_OPEX_RATIO: 1.0,       // 100% alert threshold
  MIN_REVENUE: 1,              // Minimum 1 for calculations
  MAX_MARGIN: 95,              // 95% max realistic margin
  MIN_MARGIN: -200             // -200% min realistic margin
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrections: {
    revenue: number;
    cogs: number;
    opex: number;
  };
  metrics: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
  qualityScore: number; // 0-100
}

/**
 * ✅ STANDARDIZED: Validate financial data with consistent rules
 */
export function validateFinancialData(
  revenue: number,
  cogs: number,
  opex: number,
  rules: Partial<ValidationRules> = {}
): ValidationResult {
  const validationRules = { ...VALIDATION_RULES, ...rules };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Step 1: Sanitize inputs
    const safeRevenue = Math.max(0, Number(revenue) || 0);
    const safeCogs = Math.max(0, Number(cogs) || 0);
    const safeOpex = Math.max(0, Number(opex) || 0);

    // Step 2: Apply corrections
    let correctedRevenue = safeRevenue;
    let correctedCogs = safeCogs;
    let correctedOpex = safeOpex;

    // Revenue validation
    if (safeRevenue < 0) {
      errors.push('Revenue cannot be negative');
      correctedRevenue = 0;
    }

    // COGS validation and capping
    if (safeCogs < 0) {
      errors.push('COGS cannot be negative');
      correctedCogs = 0;
    }

    if (safeCogs > safeRevenue * validationRules.MAX_COGS_RATIO && safeRevenue > validationRules.MIN_REVENUE) {
      const ratio = (safeCogs / safeRevenue) * 100;
      correctedCogs = safeRevenue * validationRules.MAX_COGS_RATIO;
      warnings.push(`COGS capped from ${ratio.toFixed(1)}% to ${(validationRules.MAX_COGS_RATIO * 100)}% of revenue`);
    } else if (safeCogs > safeRevenue * validationRules.ALERT_COGS_RATIO && safeRevenue > validationRules.MIN_REVENUE) {
      const ratio = (safeCogs / safeRevenue) * 100;
      warnings.push(`High COGS ratio: ${ratio.toFixed(1)}% of revenue`);
    }

    // OpEx validation and capping
    if (safeOpex < 0) {
      errors.push('OpEx cannot be negative');
      correctedOpex = 0;
    }

    if (safeOpex > safeRevenue * validationRules.MAX_OPEX_RATIO && safeRevenue > validationRules.MIN_REVENUE) {
      const ratio = (safeOpex / safeRevenue) * 100;
      correctedOpex = safeRevenue * validationRules.MAX_OPEX_RATIO;
      warnings.push(`OpEx capped from ${ratio.toFixed(1)}% to ${(validationRules.MAX_OPEX_RATIO * 100)}% of revenue`);
    } else if (safeOpex > safeRevenue * validationRules.ALERT_OPEX_RATIO && safeRevenue > validationRules.MIN_REVENUE) {
      const ratio = (safeOpex / safeRevenue) * 100;
      warnings.push(`High OpEx ratio: ${ratio.toFixed(1)}% of revenue`);
    }

    // Step 3: Calculate metrics with corrected values
    const grossProfit = correctedRevenue - correctedCogs;
    const netProfit = grossProfit - correctedOpex;
    const grossMargin = correctedRevenue > validationRules.MIN_REVENUE ? (grossProfit / correctedRevenue) * 100 : 0;
    const netMargin = correctedRevenue > validationRules.MIN_REVENUE ? (netProfit / correctedRevenue) * 100 : 0;

    // Step 4: Margin validation
    if (grossMargin > validationRules.MAX_MARGIN) {
      warnings.push(`Unusually high gross margin: ${grossMargin.toFixed(1)}%`);
    }
    if (grossMargin < validationRules.MIN_MARGIN) {
      warnings.push(`Extremely low gross margin: ${grossMargin.toFixed(1)}%`);
    }
    if (netMargin > validationRules.MAX_MARGIN) {
      warnings.push(`Unusually high net margin: ${netMargin.toFixed(1)}%`);
    }
    if (netMargin < validationRules.MIN_MARGIN) {
      warnings.push(`Extremely low net margin: ${netMargin.toFixed(1)}%`);
    }

    // Step 5: Calculate quality score
    const qualityScore = calculateQualityScore(
      correctedRevenue,
      correctedCogs,
      correctedOpex,
      errors.length,
      warnings.length
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections: {
        revenue: correctedRevenue,
        cogs: correctedCogs,
        opex: correctedOpex
      },
      metrics: {
        grossProfit,
        netProfit,
        grossMargin,
        netMargin
      },
      qualityScore
    };

  } catch (error) {
    logger.error('Error in financial data validation:', error);
    return {
      isValid: false,
      errors: ['Validation error occurred'],
      warnings: [],
      corrections: { revenue: 0, cogs: 0, opex: 0 },
      metrics: { grossProfit: 0, netProfit: 0, grossMargin: 0, netMargin: 0 },
      qualityScore: 0
    };
  }
}

/**
 * ✅ UTILITY: Calculate data quality score (0-100)
 */
function calculateQualityScore(
  revenue: number,
  cogs: number,
  opex: number,
  errorCount: number,
  warningCount: number
): number {
  let score = 100;

  // Deduct for errors and warnings
  score -= errorCount * 30;
  score -= warningCount * 10;

  // Deduct for missing data
  if (revenue <= 0) score -= 25;
  if (cogs <= 0 && revenue > 0) score -= 15;
  if (opex <= 0 && revenue > 0) score -= 10;

  // Deduct for unusual ratios
  if (revenue > 0) {
    const cogsRatio = (cogs / revenue) * 100;
    const opexRatio = (opex / revenue) * 100;
    
    if (cogsRatio > 90) score -= 15;
    if (opexRatio > 150) score -= 10;
    if (cogsRatio + opexRatio > 110) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * ✅ UTILITY: Safe margin calculation with validation
 */
export function safeCalculateMargins(revenue: number, cogs: number, opex: number) {
  const validation = validateFinancialData(revenue, cogs, opex);
  
  if (!validation.isValid) {
    logger.warn('Invalid financial data for margin calculation:', {
      revenue,
      cogs,
      opex,
      errors: validation.errors
    });
  }

  return {
    ...validation.metrics,
    isValid: validation.isValid,
    qualityScore: validation.qualityScore,
    warnings: validation.warnings,
    errors: validation.errors
  };
}

/**
 * ✅ UTILITY: Validate period data consistency
 */
export function validatePeriodData(periodData: {
  period: string;
  revenue: number;
  cogs: number;
  opex: number;
}[]): {
  isValid: boolean;
  issues: string[];
  qualityScores: Map<string, number>;
} {
  const issues: string[] = [];
  const qualityScores = new Map<string, number>();

  periodData.forEach(data => {
    const validation = validateFinancialData(data.revenue, data.cogs, data.opex);
    qualityScores.set(data.period, validation.qualityScore);
    
    if (!validation.isValid) {
      issues.push(`Period ${data.period}: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      issues.push(`Period ${data.period}: ${validation.warnings.join(', ')}`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    qualityScores
  };
}

/**
 * ✅ UTILITY: Monitor data quality over time
 */
export function monitorDataQuality(
  currentData: { revenue: number; cogs: number; opex: number },
  period: string
): void {
  const validation = validateFinancialData(currentData.revenue, currentData.cogs, currentData.opex);
  
  if (validation.qualityScore < 70) {
    logger.warn('Low data quality detected:', {
      period,
      score: validation.qualityScore,
      issues: [...validation.errors, ...validation.warnings]
    });
  }
  
  if (validation.qualityScore >= 90) {
    logger.info('High quality data:', {
      period,
      score: validation.qualityScore
    });
  }
}