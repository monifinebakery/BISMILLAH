// src/components/warehouse/services/core/wacCalculationService.ts
// WAC (Weighted Average Cost) calculation service

import { logger } from '@/utils/logger';
import { toNumber } from '../../utils/typeUtils';

export interface WACCalculationResult {
  newWac: number;
  newStock: number;
  preservedPrice?: number; // Last known price when stock hits zero
  validationWarnings: string[];
}

/**
 * Enhanced Weighted Average Cost (WAC) calculation
 * Handles edge cases: negative values, zero stock scenarios, price preservation
 */
export const calculateNewWac = (
  oldWac: number = 0,
  oldStock: number = 0,
  qty: number = 0,
  unitPrice: number = 0
): number => {
  // Input validation and normalization
  const safeOldWac = Math.max(0, toNumber(oldWac));
  const safeOldStock = Math.max(0, toNumber(oldStock));
  const safeQty = toNumber(qty);
  const safeUnitPrice = Math.max(0, toNumber(unitPrice));
  
  // Calculate new stock first
  const newStock = safeOldStock + safeQty;
  
  // EDGE CASE: Negative or zero stock handling
  if (newStock <= 0) {
    // Preserve the last known price if we had valid pricing before
    return safeOldWac > 0 ? safeOldWac : safeUnitPrice;
  }
  
  // EDGE CASE: Initial stock with no previous WAC
  if (safeOldStock <= 0) {
    return safeUnitPrice;
  }
  
  // EDGE CASE: Adding stock with zero unit price
  if (safeQty > 0 && safeUnitPrice <= 0) {
    // Don't change WAC if adding stock with no valid price
    return safeOldWac;
  }
  
  // STANDARD WAC CALCULATION
  const previousValue = safeOldStock * safeOldWac;
  const deltaValue = safeQty * safeUnitPrice;
  const newWac = (previousValue + deltaValue) / newStock;
  
  // VALIDATION: Ensure result is reasonable
  if (!isFinite(newWac) || newWac < 0) {
    logger.warn('⚠️ WAC calculation resulted in invalid value:', {
      oldWac: safeOldWac,
      oldStock: safeOldStock,
      qty: safeQty,
      unitPrice: safeUnitPrice,
      result: newWac
    });
    return safeOldWac > 0 ? safeOldWac : safeUnitPrice;
  }
  
  return newWac;
};

/**
 * Enhanced WAC calculation with detailed results
 */
export const calculateEnhancedWac = (
  oldWac: number = 0,
  oldStock: number = 0,
  qty: number = 0,
  unitPrice: number = 0
): WACCalculationResult => {
  const warnings: string[] = [];
  
  // Input validation
  const safeOldWac = Math.max(0, toNumber(oldWac));
  const safeOldStock = Math.max(0, toNumber(oldStock));
  const safeQty = toNumber(qty);
  const safeUnitPrice = Math.max(0, toNumber(unitPrice));
  
  if (oldWac < 0 || oldStock < 0 || unitPrice < 0) {
    warnings.push('Negative values detected and normalized');
  }
  
  const newStock = safeOldStock + safeQty;
  let newWac: number;
  let preservedPrice: number | undefined;
  
  if (newStock <= 0) {
    preservedPrice = safeOldWac > 0 ? safeOldWac : safeUnitPrice;
    newWac = preservedPrice;
    warnings.push('Stock reached zero or negative, price preserved');
  } else if (safeOldStock <= 0) {
    newWac = safeUnitPrice;
    warnings.push('Initial stock entry');
  } else if (safeQty > 0 && safeUnitPrice <= 0) {
    newWac = safeOldWac;
    warnings.push('Stock added with zero price, WAC unchanged');
  } else {
    const previousValue = safeOldStock * safeOldWac;
    const deltaValue = safeQty * safeUnitPrice;
    newWac = (previousValue + deltaValue) / newStock;
    
    if (!isFinite(newWac) || newWac < 0) {
      newWac = safeOldWac > 0 ? safeOldWac : safeUnitPrice;
      warnings.push('Invalid calculation result, fallback applied');
    }
  }
  
  return {
    newWac,
    newStock,
    preservedPrice,
    validationWarnings: warnings
  };
};

/**
 * Validate WAC calculation result for consistency
 */
export const validateWacCalculation = (
  oldStock: number,
  oldWac: number,
  qty: number,
  unitPrice: number,
  calculatedWac: number,
  itemName: string
): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  let isValid = true;
  
  // Check for mathematical consistency
  const newStock = oldStock + qty;
  const expectedValue = (oldStock * oldWac) + (qty * unitPrice);
  const calculatedValue = newStock * calculatedWac;
  
  if (newStock > 0) {
    const valueDiff = Math.abs(expectedValue - calculatedValue);
    const tolerance = Math.max(0.01, Math.min(expectedValue, calculatedValue) * 0.0001); // 0.01% tolerance
    
    if (valueDiff > tolerance) {
      warnings.push(`Value mismatch: expected ${expectedValue.toFixed(4)}, got ${calculatedValue.toFixed(4)}`);
      isValid = false;
    }
  }
  
  // Check for reasonable WAC bounds
  if (oldWac > 0 && unitPrice > 0) {
    const minExpected = Math.min(oldWac, unitPrice);
    const maxExpected = Math.max(oldWac, unitPrice);
    
    if (calculatedWac < minExpected * 0.9 || calculatedWac > maxExpected * 1.1) {
      warnings.push(`WAC ${calculatedWac.toFixed(4)} outside reasonable bounds [${(minExpected * 0.9).toFixed(4)}, ${(maxExpected * 1.1).toFixed(4)}]`);
    }
  }
  
  // Log validation results
  if (warnings.length > 0) {
    logger.warn(`⚠️ [WAC VALIDATION] ${itemName}:`, {
      oldStock,
      oldWac: oldWac.toFixed(4),
      qty,
      unitPrice: unitPrice.toFixed(4),
      calculatedWac: calculatedWac.toFixed(4),
      warnings
    });
  }
  
  return { isValid, warnings };
};