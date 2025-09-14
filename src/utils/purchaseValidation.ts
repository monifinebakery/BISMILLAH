// src/utils/purchaseValidation.ts - Centralized Purchase Validation Utilities

import { logger } from '@/utils/logger';
import type { Purchase, PurchaseItem, PurchaseStatus } from '@/components/purchase/types/purchase.types';

export interface PurchaseValidationRules {
  MIN_ITEM_QUANTITY: number;
  MAX_ITEM_QUANTITY: number;
  MIN_UNIT_PRICE: number;
  MAX_UNIT_PRICE: number;
  MIN_TOTAL_VALUE: number;
  MAX_ITEMS_PER_PURCHASE: number;
  REQUIRED_ITEM_FIELDS: string[];
}

export const PURCHASE_VALIDATION_RULES: PurchaseValidationRules = {
  MIN_ITEM_QUANTITY: 0.001,           // Minimum quantity
  MAX_ITEM_QUANTITY: 999999,          // Maximum quantity
  MIN_UNIT_PRICE: 0,                  // Allow free items
  MAX_UNIT_PRICE: 999999999,          // 999 million max
  MIN_TOTAL_VALUE: 0,                 // Allow zero-value purchases
  MAX_ITEMS_PER_PURCHASE: 100,        // Maximum items per purchase
  REQUIRED_ITEM_FIELDS: ['bahanBakuId', 'namaBarang', 'jumlah', 'satuan', 'hargaSatuan'],
};

export interface PurchaseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrections: {
    totalNilai: number;
    items: PurchaseItem[];
  };
  qualityScore: number; // 0-100
}

/**
 * ✅ STANDARDIZED: Validate purchase data with comprehensive checks
 */
export function validatePurchaseData(
  purchase: Partial<Purchase>,
  rules: Partial<PurchaseValidationRules> = {}
): PurchaseValidationResult {
  const validationRules = { ...PURCHASE_VALIDATION_RULES, ...rules };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Step 1: Basic purchase validation
    if (!purchase.supplier || !purchase.supplier.trim()) {
      errors.push('Supplier is required');
    }

    if (!purchase.tanggal) {
      errors.push('Purchase date is required');
    } else {
      const purchaseDate = new Date(purchase.tanggal);
      if (isNaN(purchaseDate.getTime())) {
        errors.push('Invalid purchase date format');
      }
    }

    // Step 2: Items validation
    const items = purchase.items || [];
    const correctedItems: PurchaseItem[] = [];
    let correctedTotal = 0;

    if (items.length === 0) {
      errors.push('At least one item is required');
    }

    if (items.length > validationRules.MAX_ITEMS_PER_PURCHASE) {
      warnings.push(`Too many items (${items.length}), consider splitting purchase`);
    }

    // Validate each item
    items.forEach((item, index) => {
      const itemErrors: string[] = [];
      const itemWarnings: string[] = [];
      const correctedItem: any = { ...item };
      const itemAny = item as any;

      // Required fields
      validationRules.REQUIRED_ITEM_FIELDS.forEach(field => {
        const value = itemAny[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          itemErrors.push(`Item ${index + 1}: ${field} is required`);
        }
      });

      // Quantity validation (supports jumlah or kuantitas)
      const qty = typeof itemAny.jumlah === 'number' ? itemAny.jumlah : itemAny.kuantitas;
      if (typeof qty === 'number') {
        if (qty < validationRules.MIN_ITEM_QUANTITY) {
          itemErrors.push(`Item ${index + 1}: Quantity must be at least ${validationRules.MIN_ITEM_QUANTITY}`);
          correctedItem.jumlah = validationRules.MIN_ITEM_QUANTITY;
        }
        if (qty > validationRules.MAX_ITEM_QUANTITY) {
          itemWarnings.push(`Item ${index + 1}: Very large quantity (${qty})`);
          correctedItem.jumlah = validationRules.MAX_ITEM_QUANTITY;
        }
      }

      // Price validation
      if (typeof item.hargaSatuan === 'number') {
        if (item.hargaSatuan < validationRules.MIN_UNIT_PRICE) {
          if (item.hargaSatuan < 0) {
            itemErrors.push(`Item ${index + 1}: Unit price cannot be negative`);
            correctedItem.hargaSatuan = 0;
          }
        }
        if (item.hargaSatuan > validationRules.MAX_UNIT_PRICE) {
          itemWarnings.push(`Item ${index + 1}: Very high unit price (${item.hargaSatuan})`);
        }
      }

      // Calculate subtotal
        const quantity = Number((correctedItem as any).jumlah ?? correctedItem.kuantitas) || 0;
        const unitPrice = Number(correctedItem.hargaSatuan) || 0;
        correctedItem.subtotal = quantity * unitPrice;
        correctedTotal += correctedItem.subtotal;

      // Add warnings and errors to main arrays
      itemErrors.forEach(err => errors.push(err));
      itemWarnings.forEach(warn => warnings.push(warn));

      correctedItems.push(correctedItem);
    });

    // Step 3: Total value validation
    const originalTotal = Number(purchase.totalNilai) || 0;
    const calculatedTotal = correctedTotal;

    if (Math.abs(originalTotal - calculatedTotal) > 0.01) {
      warnings.push(`Total value mismatch: ${originalTotal} vs calculated ${calculatedTotal}`);
    }

    // Step 4: Status validation
    if (purchase.status && !['pending', 'completed', 'cancelled'].includes(purchase.status)) {
      errors.push('Invalid purchase status');
    }

    // Step 5: Calculate quality score
    const qualityScore = calculatePurchaseQualityScore(
      purchase,
      items,
      errors.length,
      warnings.length
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections: {
        totalNilai: calculatedTotal,
        items: correctedItems
      },
      qualityScore
    };

  } catch (error) {
    logger.error('Error in purchase data validation:', error);
    return {
      isValid: false,
      errors: ['Validation error occurred'],
      warnings: [],
      corrections: { totalNilai: 0, items: [] },
      qualityScore: 0
    };
  }
}

/**
 * ✅ UTILITY: Calculate purchase data quality score (0-100)
 */
function calculatePurchaseQualityScore(
  purchase: Partial<Purchase>,
  items: PurchaseItem[],
  errorCount: number,
  warningCount: number
): number {
  let score = 100;

  // Deduct for errors and warnings
  score -= errorCount * 20;
  score -= warningCount * 5;

  // Deduct for missing data
  if (!purchase.supplier) score -= 15;
  if (!purchase.tanggal) score -= 15;
  if (!items || items.length === 0) score -= 25;

  // Deduct for incomplete items
  const incompleteItems = items.filter(item => {
    const it: any = item;
    return (
      !it.bahanBakuId ||
      !(it.namaBarang || it.nama) ||
      !(it.jumlah ?? it.kuantitas) ||
      !it.satuan
    );
  });
  score -= incompleteItems.length * 10;

  // Bonus for complete data
  if (purchase.supplier && purchase.tanggal && items.length > 0) {
    const completeItems = items.filter(item => {
      const it: any = item;
      return (
        it.bahanBakuId &&
        (it.namaBarang || it.nama) &&
        (it.jumlah ?? it.kuantitas) &&
        it.satuan &&
        it.hargaSatuan > 0
      );
    });
    score += Math.min(completeItems.length * 2, 10);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * ✅ UTILITY: Validate status change logic
 */
export function validateStatusChange(
  currentStatus: PurchaseStatus,
  newStatus: PurchaseStatus,
  purchase: Purchase
): { canChange: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Basic validation
    if (currentStatus === newStatus) {
      warnings.push('Status is not changing');
    }

    // Validate completion requirements
    if (newStatus === 'completed') {
      if (!purchase.items || purchase.items.length === 0) {
        errors.push('Cannot complete purchase without items');
      }
      
      if (!purchase.totalNilai || purchase.totalNilai <= 0) {
        errors.push('Cannot complete purchase with zero total value');
      }
      
      if (!purchase.supplier) {
        errors.push('Supplier is required to complete purchase');
      }

      // Validate all items have required data
      const invalidItems = purchase.items?.filter(item => {
        const it: any = item;
        return (
          !it.bahanBakuId ||
          !(it.namaBarang || it.nama) ||
          !(it.jumlah ?? it.kuantitas) ||
          !it.satuan
        );
      }) || [];
      
      if (invalidItems.length > 0) {
        errors.push(`${invalidItems.length} items are incomplete`);
      }
    }

    // Warn about reverting completed status
    if (currentStatus === 'completed' && newStatus !== 'completed') {
      warnings.push('Changing from completed status will adjust inventory automatically');
    }

    // Warn about cancelling
    if (newStatus === 'cancelled') {
      warnings.push('Cancelled purchases cannot be easily restored');
    }

    return {
      canChange: errors.length === 0,
      warnings,
      errors
    };

  } catch (error) {
    logger.error('Error validating status change:', error);
    return {
      canChange: false,
      warnings: [],
      errors: ['Status validation failed']
    };
  }
}

/**
 * ✅ UTILITY: Monitor purchase data consistency
 */
export function monitorPurchaseDataQuality(
  context: string,
  purchases: Purchase[]
): void {
  try {
    if (!purchases || purchases.length === 0) return;

    const qualityMetrics = {
      totalPurchases: purchases.length,
      completedPurchases: purchases.filter(p => p.status === 'completed').length,
      pendingPurchases: purchases.filter(p => p.status === 'pending').length,
      cancelledPurchases: purchases.filter(p => p.status === 'cancelled').length,
      withItems: purchases.filter(p => p.items && p.items.length > 0).length,
      totalValue: purchases.reduce((sum, p) => sum + Number(p.totalNilai || 0), 0),
      avgItemsPerPurchase: purchases.reduce((sum, p) => sum + (p.items?.length || 0), 0) / purchases.length,
    };

    // Check for data quality issues
    const issues: string[] = [];
    
    const emptyPurchases = purchases.filter(p => !p.items || p.items.length === 0);
    if (emptyPurchases.length > 0) {
      issues.push(`${emptyPurchases.length} purchases have no items`);
    }

    const missingSuppliers = purchases.filter(p => !p.supplier);
    if (missingSuppliers.length > 0) {
      issues.push(`${missingSuppliers.length} purchases have no supplier`);
    }

    if (issues.length > 0) {
      logger.warn(`🚨 Purchase data quality issues in ${context}:`, {
        issues,
        metrics: qualityMetrics
      });
    } else {
      logger.debug(`📊 Purchase data quality for ${context}:`, qualityMetrics);
    }

  } catch (error) {
    logger.error(`Error monitoring purchase data quality in ${context}:`, error);
  }
}