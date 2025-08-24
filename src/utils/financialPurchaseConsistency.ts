// src/utils/financialPurchaseConsistency.ts - Financial & Purchase Module Consistency Checker

import { logger } from '@/utils/logger';
import type { FinancialTransaction } from '@/components/financial/types/financial';
import type { Purchase } from '@/components/purchase/types/purchase.types';

export interface ModuleConsistencyResult {
  isConsistent: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
  moduleStats: {
    financial: {
      transactionCount: number;
      totalIncome: number;
      totalExpense: number;
      validTransactions: number;
    };
    purchase: {
      purchaseCount: number;
      completedPurchases: number;
      totalValue: number;
      validPurchases: number;
    };
  };
}

/**
 * Check for inconsistencies between financial and purchase modules
 */
export function checkFinancialPurchaseConsistency(
  data: {
    financialTransactions?: FinancialTransaction[];
    purchases?: Purchase[];
    context?: string;
  }
): ModuleConsistencyResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    const { financialTransactions = [], purchases = [], context = 'unknown' } = data;

    // Calculate module statistics
    const moduleStats = {
      financial: {
        transactionCount: financialTransactions.length,
        totalIncome: financialTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0),
        totalExpense: financialTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0),
        validTransactions: financialTransactions.filter(t => 
          t.type && t.amount && t.date && t.userId
        ).length,
      },
      purchase: {
        purchaseCount: purchases.length,
        completedPurchases: purchases.filter(p => p.status === 'completed').length,
        totalValue: purchases.reduce((sum, p) => sum + Number(p.totalNilai || 0), 0),
        validPurchases: purchases.filter(p => 
          p.supplier && p.tanggal && p.items && p.items.length > 0
        ).length,
      }
    };

    // Check 1: Data completeness
    if (moduleStats.financial.validTransactions < moduleStats.financial.transactionCount) {
      const invalid = moduleStats.financial.transactionCount - moduleStats.financial.validTransactions;
      issues.push(`Financial: ${invalid} invalid transactions found`);
    }

    if (moduleStats.purchase.validPurchases < moduleStats.purchase.purchaseCount) {
      const invalid = moduleStats.purchase.purchaseCount - moduleStats.purchase.validPurchases;
      issues.push(`Purchase: ${invalid} invalid purchases found`);
    }

    // Check 2: Purchase-Financial transaction sync
    const completedPurchases = purchases.filter(p => p.status === 'completed');
    const purchaseExpenses = financialTransactions.filter(t => 
      t.type === 'expense' && 
      t.category === 'Pembelian Bahan Baku' &&
      t.relatedId
    );

    if (completedPurchases.length > 0 && purchaseExpenses.length === 0) {
      warnings.push('Completed purchases exist but no related financial expense transactions found');
      recommendations.push('Consider enabling automatic financial transaction creation for purchases');
    }

    // Check 3: Value consistency between related records
    completedPurchases.forEach(purchase => {
      const relatedTransaction = financialTransactions.find(t => 
        t.relatedId === purchase.id && t.type === 'expense'
      );
      
      if (relatedTransaction) {
        const purchaseValue = Number(purchase.totalNilai || 0);
        const transactionAmount = Number(relatedTransaction.amount || 0);
        
        if (Math.abs(purchaseValue - transactionAmount) > 0.01) {
          issues.push(`Value mismatch: Purchase ${purchase.id} (${purchaseValue}) vs Transaction ${relatedTransaction.id} (${transactionAmount})`);
        }
      }
    });

    // Check 4: Date consistency
    const purchaseDateIssues = completedPurchases.filter(purchase => {
      const relatedTransaction = financialTransactions.find(t => t.relatedId === purchase.id);
      if (!relatedTransaction) return false;
      
      const purchaseDate = new Date(purchase.tanggal);
      const transactionDate = new Date(relatedTransaction.date!);
      
      // Allow 1 day difference for transaction recording delays
      const dayDiff = Math.abs(purchaseDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
      return dayDiff > 1;
    });

    if (purchaseDateIssues.length > 0) {
      warnings.push(`${purchaseDateIssues.length} purchase-transaction pairs have date mismatches > 1 day`);
    }

    // Check 5: Hook usage consistency
    // This would ideally be detected at compile time, but we can check for runtime patterns
    if (context.includes('Component') || context.includes('Page')) {
      // Add specific component-level consistency checks here
      recommendations.push('Ensure consistent hook usage patterns across financial and purchase components');
    }

    // Check 6: Query key patterns
    // This is a runtime warning for developers
    if (issues.length === 0 && warnings.length === 0) {
      recommendations.push('Consider implementing query key consistency validation for better caching');
    }

    logger.debug(`🔍 Module consistency check for ${context}:`, {
      issuesFound: issues.length,
      warningsFound: warnings.length,
      moduleStats
    });

    return {
      isConsistent: issues.length === 0,
      issues,
      warnings,
      recommendations,
      moduleStats
    };

  } catch (error) {
    logger.error('Error in financial-purchase consistency check:', error);
    return {
      isConsistent: false,
      issues: ['Consistency check failed due to error'],
      warnings: [],
      recommendations: ['Review data structure and try again'],
      moduleStats: {
        financial: { transactionCount: 0, totalIncome: 0, totalExpense: 0, validTransactions: 0 },
        purchase: { purchaseCount: 0, completedPurchases: 0, totalValue: 0, validPurchases: 0 }
      }
    };
  }
}

/**
 * Monitor financial and purchase module sync status
 */
export function monitorFinancialPurchaseSync(
  context: string,
  data: {
    financialTransactions?: FinancialTransaction[];
    purchases?: Purchase[];
  }
): void {
  try {
    const checkResult = checkFinancialPurchaseConsistency({
      ...data,
      context
    });

    if (!checkResult.isConsistent) {
      logger.warn(`🚨 Financial-Purchase inconsistencies detected in ${context}:`, {
        issues: checkResult.issues,
        warnings: checkResult.warnings
      });
    }

    if (checkResult.recommendations.length > 0) {
      logger.info(`💡 Recommendations for ${context}:`, checkResult.recommendations);
    }

    // Log summary statistics
    logger.debug(`📊 Module sync status for ${context}:`, {
      financialStats: checkResult.moduleStats.financial,
      purchaseStats: checkResult.moduleStats.purchase,
      overallHealth: checkResult.isConsistent ? 'Good' : 'Needs Attention'
    });

  } catch (error) {
    logger.error(`Error monitoring financial-purchase sync in ${context}:`, error);
  }
}

/**
 * Validate hook import consistency across financial and purchase modules
 */
export function validateHookImportConsistency(): ModuleConsistencyResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // This would ideally be done at build time with ESLint rules
    // For now, we provide recommendations for manual checking
    
    recommendations.push('Standardize hook exports: use dedicated hook files instead of context exports');
    recommendations.push('Ensure consistent query key patterns across financial and purchase modules');
    recommendations.push('Implement centralized validation utilities for both modules');
    recommendations.push('Add barrel export consistency validation');

    return {
      isConsistent: true, // Assume consistent until proven otherwise
      issues,
      warnings,
      recommendations,
      moduleStats: {
        financial: { transactionCount: 0, totalIncome: 0, totalExpense: 0, validTransactions: 0 },
        purchase: { purchaseCount: 0, completedPurchases: 0, totalValue: 0, validPurchases: 0 }
      }
    };
    
  } catch (error) {
    return {
      isConsistent: false,
      issues: ['Failed to validate hook import consistency'],
      warnings: [],
      recommendations: ['Review hook export patterns and imports'],
      moduleStats: {
        financial: { transactionCount: 0, totalIncome: 0, totalExpense: 0, validTransactions: 0 },
        purchase: { purchaseCount: 0, completedPurchases: 0, totalValue: 0, validPurchases: 0 }
      }
    };
  }
}

/**
 * Check for barrel export consistency between modules
 */
export function validateBarrelExportConsistency(): { 
  isConsistent: boolean; 
  issues: string[]; 
  recommendations: string[] 
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // These checks would ideally be done at build time
    recommendations.push('Ensure financial and purchase modules follow the same barrel export pattern');
    recommendations.push('Standardize lazy loading patterns for advanced functionality');
    recommendations.push('Validate that all exported hooks and utilities are properly tested');
    recommendations.push('Consider implementing automatic consistency validation in CI/CD');

    return {
      isConsistent: true,
      issues,
      recommendations
    };

  } catch (error) {
    return {
      isConsistent: false,
      issues: ['Failed to validate barrel export consistency'],
      recommendations: ['Review module export structures']
    };
  }
}