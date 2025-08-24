// src/utils/financialValidation.ts - Centralized Financial Transaction Validation

import { logger } from '@/utils/logger';
import type { FinancialTransaction, CreateTransactionData, UpdateTransactionData } from '@/components/financial/types/financial';

export interface FinancialValidationRules {
  MIN_AMOUNT: number;
  MAX_AMOUNT: number;
  MAX_DESCRIPTION_LENGTH: number;
  REQUIRED_FIELDS: (keyof CreateTransactionData)[];
}

export const FINANCIAL_VALIDATION_RULES: FinancialValidationRules = {
  MIN_AMOUNT: 0.01,                    // Minimum 1 cent
  MAX_AMOUNT: 999999999999,            // 999 billion max
  MAX_DESCRIPTION_LENGTH: 500,         // Character limit
  REQUIRED_FIELDS: ['type', 'amount', 'date'],
};

export interface FinancialValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrections: {
    amount: number;
    description: string | null;
  };
  qualityScore: number; // 0-100
}

/**
 * ✅ STANDARDIZED: Validate financial transaction data
 */
export function validateFinancialTransaction(
  data: CreateTransactionData | UpdateTransactionData,
  rules: Partial<FinancialValidationRules> = {}
): FinancialValidationResult {
  const validationRules = { ...FINANCIAL_VALIDATION_RULES, ...rules };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Step 1: Required fields validation
    if ('type' in data && !data.type) {
      errors.push('Transaction type is required');
    }
    
    if ('type' in data && !['income', 'expense'].includes(data.type as string)) {
      errors.push('Transaction type must be income or expense');
    }

    // Step 2: Amount validation
    let correctedAmount = Number(data.amount) || 0;
    
    if (data.amount === undefined || data.amount === null) {
      errors.push('Amount is required');
      correctedAmount = 0;
    }
    
    if (correctedAmount < validationRules.MIN_AMOUNT) {
      errors.push(`Amount must be at least ${validationRules.MIN_AMOUNT}`);
      correctedAmount = validationRules.MIN_AMOUNT;
    }
    
    if (correctedAmount > validationRules.MAX_AMOUNT) {
      warnings.push(`Amount capped from ${correctedAmount} to ${validationRules.MAX_AMOUNT}`);
      correctedAmount = validationRules.MAX_AMOUNT;
    }

    // Step 3: Description validation
    let correctedDescription = data.description || null;
    
    if (correctedDescription && correctedDescription.length > validationRules.MAX_DESCRIPTION_LENGTH) {
      warnings.push(`Description truncated to ${validationRules.MAX_DESCRIPTION_LENGTH} characters`);
      correctedDescription = correctedDescription.substring(0, validationRules.MAX_DESCRIPTION_LENGTH);
    }

    // Step 4: Date validation
    if ('date' in data && data.date) {
      const transactionDate = new Date(data.date);
      if (isNaN(transactionDate.getTime())) {
        errors.push('Invalid date format');
      }
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      if (transactionDate > futureDate) {
        warnings.push('Transaction date is more than 1 year in the future');
      }
    } else if ('date' in data) {
      errors.push('Transaction date is required');
    }

    // Step 5: Category validation
    if (data.category && typeof data.category === 'string') {
      if (data.category.length > 100) {
        warnings.push('Category name is very long');
      }
    }

    // Step 6: Calculate quality score
    const qualityScore = calculateFinancialQualityScore(
      data,
      errors.length,
      warnings.length
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections: {
        amount: correctedAmount,
        description: correctedDescription
      },
      qualityScore
    };

  } catch (error) {
    logger.error('Error in financial transaction validation:', error);
    return {
      isValid: false,
      errors: ['Validation error occurred'],
      warnings: [],
      corrections: { amount: 0, description: null },
      qualityScore: 0
    };
  }
}

/**
 * ✅ UTILITY: Calculate financial data quality score (0-100)
 */
function calculateFinancialQualityScore(
  data: CreateTransactionData | UpdateTransactionData,
  errorCount: number,
  warningCount: number
): number {
  let score = 100;

  // Deduct for errors and warnings
  score -= errorCount * 25;
  score -= warningCount * 10;

  // Deduct for missing optional but important data
  if (!data.category) score -= 10;
  if (!data.description) score -= 5;

  // Bonus for complete data
  if (data.category && data.description && data.amount && data.type) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * ✅ UTILITY: Validate transaction consistency across financial operations
 */
export function validateTransactionConsistency(
  transactions: FinancialTransaction[]
): { isConsistent: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!transactions || transactions.length === 0) {
    return { isConsistent: true, issues: [] };
  }

  try {
    // Check for duplicate IDs
    const ids = transactions.map(t => t.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      issues.push('Duplicate transaction IDs found');
    }

    // Check for invalid amounts
    const invalidAmounts = transactions.filter(t => 
      !t.amount || t.amount < 0 || isNaN(Number(t.amount))
    );
    if (invalidAmounts.length > 0) {
      issues.push(`${invalidAmounts.length} transactions have invalid amounts`);
    }

    // Check for missing required fields
    const missingData = transactions.filter(t => 
      !t.type || !t.date || !t.userId
    );
    if (missingData.length > 0) {
      issues.push(`${missingData.length} transactions have missing required data`);
    }

    // Check for future dates (beyond reasonable range)
    const futureLimit = new Date();
    futureLimit.setFullYear(futureLimit.getFullYear() + 1);
    const futureDates = transactions.filter(t => 
      t.date && new Date(t.date) > futureLimit
    );
    if (futureDates.length > 0) {
      issues.push(`${futureDates.length} transactions have unrealistic future dates`);
    }

    return {
      isConsistent: issues.length === 0,
      issues
    };

  } catch (error) {
    logger.error('Error in transaction consistency validation:', error);
    return {
      isConsistent: false,
      issues: ['Consistency validation failed']
    };
  }
}

/**
 * ✅ UTILITY: Monitor financial data quality
 */
export function monitorFinancialDataQuality(
  context: string,
  transactions: FinancialTransaction[]
): void {
  try {
    const consistencyResult = validateTransactionConsistency(transactions);
    
    if (!consistencyResult.isConsistent) {
      logger.warn(`🚨 Financial data quality issues in ${context}:`, {
        issues: consistencyResult.issues,
        transactionCount: transactions.length
      });
    }

    // Additional quality metrics
    const qualityMetrics = {
      totalTransactions: transactions.length,
      withCategories: transactions.filter(t => t.category).length,
      withDescriptions: transactions.filter(t => t.description).length,
      avgAmount: transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0) / transactions.length,
    };

    logger.debug(`📊 Financial data quality for ${context}:`, qualityMetrics);

  } catch (error) {
    logger.error(`Error monitoring financial data quality in ${context}:`, error);
  }
}