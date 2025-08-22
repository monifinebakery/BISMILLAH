// src/utils/cogsCalculation.ts - Centralized COGS Calculation Utilities

import type { RealTimeProfitCalculation } from '@/components/profitAnalysis/types/profitAnalysis.types';
import { logger } from '@/utils/logger';

export interface COGSCalculationOptions {
  preferWAC: boolean;
  validateRange: boolean;
  maxRatio: number; // Maximum COGS as percentage of revenue
}

export interface COGSCalculationResult {
  value: number;
  source: 'WAC' | 'transaction' | 'fallback' | 'capped';
  isValid: boolean;
  warnings: string[];
}

const DEFAULT_OPTIONS: COGSCalculationOptions = {
  preferWAC: true,
  validateRange: true,
  maxRatio: 0.95 // 95% of revenue maximum
};

/**
 * ✅ STANDARDIZED: Get effective COGS with consistent logic across all components
 */
export function getEffectiveCogs(
  analysis: RealTimeProfitCalculation,
  wacCogs?: number,
  revenue?: number,
  options: Partial<COGSCalculationOptions> = {}
): COGSCalculationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];
  let value = 0;
  let source: COGSCalculationResult['source'] = 'fallback';

  try {
    // Get base values
    const transactionCogs = analysis?.cogs_data?.total || 0;
    const effectiveRevenue = revenue || analysis?.revenue_data?.total || 0;

    // Priority 1: WAC COGS (if available and valid)
    if (opts.preferWAC && typeof wacCogs === 'number' && wacCogs >= 0) {
      value = wacCogs;
      source = 'WAC';
      logger.debug('Using WAC COGS:', { wacCogs, period: analysis.period });
    }
    // Priority 2: Transaction-based COGS
    else if (transactionCogs > 0) {
      value = transactionCogs;
      source = 'transaction';
      logger.debug('Using transaction COGS:', { transactionCogs, period: analysis.period });
    }
    // Priority 3: Zero fallback
    else {
      value = 0;
      source = 'fallback';
      if (effectiveRevenue > 0) {
        warnings.push('No COGS data available despite having revenue');
      }
    }

    // Validation and capping
    if (opts.validateRange && effectiveRevenue > 0 && value > effectiveRevenue * opts.maxRatio) {
      const originalValue = value;
      value = effectiveRevenue * opts.maxRatio;
      source = 'capped';
      warnings.push(`COGS capped from ${originalValue} to ${value} (${opts.maxRatio * 100}% of revenue)`);
      logger.warn(`Period ${analysis.period}: COGS capped`, {
        original: originalValue,
        capped: value,
        revenue: effectiveRevenue,
        ratio: (originalValue / effectiveRevenue) * 100
      });
    }

    return {
      value: Math.max(0, value), // Ensure non-negative
      source,
      isValid: true,
      warnings
    };

  } catch (error) {
    logger.error('Error in COGS calculation:', error);
    return {
      value: 0,
      source: 'fallback',
      isValid: false,
      warnings: ['Error in COGS calculation']
    };
  }
}

/**
 * ✅ STANDARDIZED: Calculate effective COGS for multiple periods (for charts)
 */
export function calculateHistoricalCOGS(
  profitHistory: RealTimeProfitCalculation[],
  wacCogs?: number, // WAC for current period only
  options: Partial<COGSCalculationOptions> = {}
): Map<string, COGSCalculationResult> {
  const results = new Map<string, COGSCalculationResult>();

  profitHistory.forEach((analysis, index) => {
    // Only apply WAC to the latest period (index === length - 1)
    const applicableWacCogs = (index === profitHistory.length - 1) ? wacCogs : undefined;
    
    const result = getEffectiveCogs(
      analysis,
      applicableWacCogs,
      analysis.revenue_data?.total,
      options
    );

    results.set(analysis.period, result);
  });

  return results;
}

/**
 * ✅ UTILITY: Check if WAC data is available and should be used
 */
export function shouldUseWAC(wacCogs?: number): boolean {
  return typeof wacCogs === 'number' && wacCogs >= 0;
}

/**
 * ✅ UTILITY: Get COGS source label for UI display
 */
export function getCOGSSourceLabel(source: COGSCalculationResult['source']): string {
  const labels = {
    WAC: 'WAC (Weighted Average Cost)',
    transaction: 'Transaction-based',
    fallback: 'No data',
    capped: 'Validated & Capped'
  };
  return labels[source];
}

/**
 * ✅ UTILITY: Validate COGS calculation consistency across components
 */
export function validateCOGSConsistency(
  calculations: { component: string; value: number; source: string }[]
): { isConsistent: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (calculations.length < 2) {
    return { isConsistent: true, issues: [] };
  }

  const baseValue = calculations[0].value;
  const tolerance = Math.max(1, baseValue * 0.01); // 1% tolerance or minimum 1

  calculations.forEach((calc, index) => {
    if (index > 0 && Math.abs(calc.value - baseValue) > tolerance) {
      issues.push(`${calc.component}: Value ${calc.value} differs from base ${baseValue} (source: ${calc.source})`);
    }
  });

  return {
    isConsistent: issues.length === 0,
    issues
  };
}