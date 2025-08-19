// src/components/purchase/utils/purchaseValidation.ts
// Enhanced validation utilities to prevent warehouse calculation errors

import { logger } from '@/utils/logger';
import type { Purchase, PurchaseItem } from '../types/purchase.types';
import type { BahanBakuFrontend } from '@/components/warehouse/types';

export interface ValidationError {
  type: 'error' | 'warning';
  field: string;
  message: string;
  itemIndex?: number;
}

export interface PurchaseValidationResult {
  isValid: boolean;
  canComplete: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  totalErrors: number;
  totalWarnings: number;
}

export interface ValidationContext {
  warehouseItems?: BahanBakuFrontend[];
  enableStrictValidation?: boolean;
  checkWarehouseConsistency?: boolean;
}

/**
 * Validates a purchase item for accurate warehouse calculations
 */
export const validatePurchaseItem = (
  item: PurchaseItem, 
  index: number, 
  context?: ValidationContext
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Essential data validation
  if (!item.bahanBakuId?.trim()) {
    errors.push({
      type: 'error',
      field: 'bahanBakuId',
      message: 'ID bahan baku tidak boleh kosong',
      itemIndex: index
    });
    // Tanpa ID bahan baku, validasi lain tidak relevan
    return errors;
  }

  if (!item.nama?.trim()) {
    errors.push({
      type: 'error',
      field: 'nama',
      message: 'Nama bahan tidak boleh kosong',
      itemIndex: index
    });
  }

  // Quantity validation - critical for stock calculations
  const quantity = Number(item.kuantitas);
  if (!quantity || quantity <= 0) {
    errors.push({
      type: 'error',
      field: 'kuantitas',
      message: 'Kuantitas harus lebih dari 0',
      itemIndex: index
    });
  } else if (quantity > 1000000) {
    errors.push({
      type: 'warning',
      field: 'kuantitas',
      message: 'Kuantitas sangat besar, pastikan data sudah benar',
      itemIndex: index
    });
  }

  // Unit price validation - critical for WAC calculations
  const unitPrice = Number(item.hargaSatuan);
  if (!unitPrice || unitPrice <= 0) {
    errors.push({
      type: 'error',
      field: 'hargaSatuan',
      message: 'Harga satuan harus lebih dari 0',
      itemIndex: index
    });
  } else if (unitPrice > 10000000) {
    errors.push({
      type: 'warning',
      field: 'hargaSatuan',
      message: 'Harga satuan sangat tinggi, pastikan data sudah benar',
      itemIndex: index
    });
  }

  if (!item.satuan?.trim()) {
    errors.push({
      type: 'error',
      field: 'satuan',
      message: 'Satuan tidak boleh kosong',
      itemIndex: index
    });
  }

  // Subtotal consistency check
  const calculatedSubtotal = quantity * unitPrice;
  const actualSubtotal = Number(item.subtotal || calculatedSubtotal);
  const subtotalDifference = Math.abs(actualSubtotal - calculatedSubtotal);
  
  if (subtotalDifference > 1 && subtotalDifference > calculatedSubtotal * 0.01) {
    errors.push({
      type: 'warning',
      field: 'subtotal',
      message: `Subtotal tidak sesuai perhitungan (${calculatedSubtotal.toLocaleString('id-ID')})`,
      itemIndex: index
    });
  }

  // Warehouse consistency checks if available
  if (context?.warehouseItems && context.checkWarehouseConsistency) {
    const warehouseItem = context.warehouseItems.find(w => 
      w.id === item.bahanBakuId || 
      w.nama.toLowerCase().trim() === item.nama.toLowerCase().trim()
    );

    if (warehouseItem) {
      // Check unit consistency
      if (warehouseItem.satuan !== item.satuan) {
        errors.push({
          type: 'warning',
          field: 'satuan',
          message: `Satuan berbeda dengan data gudang (${warehouseItem.satuan})`,
          itemIndex: index
        });
      }

      // Check significant price difference with existing warehouse price
      const existingPrice = warehouseItem.hargaRataRata || warehouseItem.harga;
      if (existingPrice && unitPrice > 0) {
        const priceDifference = Math.abs(unitPrice - existingPrice) / existingPrice;
        if (priceDifference > 0.5) { // > 50% difference
          errors.push({
            type: 'warning',
            field: 'hargaSatuan',
            message: `Harga sangat berbeda dari data gudang (${existingPrice.toLocaleString('id-ID')})`,
            itemIndex: index
          });
        }
      }
    } else {
      errors.push({
        type: 'warning',
        field: 'bahanBakuId',
        message: 'Bahan baku belum terdaftar di gudang',
        itemIndex: index
      });
    }
  }

  return errors;
};

/**
 * Validates a complete purchase before completion
 * This prevents warehouse calculation errors by ensuring data quality
 */
export const validatePurchaseForCompletion = (
  purchase: Purchase,
  context?: ValidationContext
): PurchaseValidationResult => {
  const allErrors: ValidationError[] = [];

  try {
    // Basic purchase validation
    if (!purchase.supplier?.trim()) {
      allErrors.push({
        type: 'error',
        field: 'supplier',
        message: 'Supplier harus dipilih'
      });
    }

    if (!purchase.items || purchase.items.length === 0) {
      allErrors.push({
        type: 'error',
        field: 'items',
        message: 'Purchase harus memiliki minimal 1 item'
      });
    }

    const totalNilai = Number(purchase.totalNilai);
    if (!totalNilai || totalNilai <= 0) {
      allErrors.push({
        type: 'error',
        field: 'totalNilai',
        message: 'Total nilai purchase harus lebih dari 0'
      });
    }

    // Validate each item
    if (purchase.items && purchase.items.length > 0) {
      purchase.items.forEach((item, index) => {
        const itemErrors = validatePurchaseItem(item, index, context);
        allErrors.push(...itemErrors);
      });

      // Check for duplicate items
      const itemIds = purchase.items.map(item => item.bahanBakuId).filter(Boolean);
      const duplicateIds = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        allErrors.push({
          type: 'warning',
          field: 'items',
          message: `Terdapat item duplikat: ${duplicateIds.join(', ')}`
        });
      }

      // Check total calculation consistency
      const calculatedTotal = purchase.items.reduce((sum, item) => {
        const itemSubtotal = Number(item.subtotal) || (Number(item.kuantitas) * Number(item.hargaSatuan));
        return sum + itemSubtotal;
      }, 0);

      const totalDifference = Math.abs(totalNilai - calculatedTotal);
      if (totalDifference > 1 && totalDifference > calculatedTotal * 0.01) {
        allErrors.push({
          type: 'warning',
          field: 'totalNilai',
          message: `Total tidak sesuai perhitungan item (${calculatedTotal.toLocaleString('id-ID')})`
        });
      }
    }

    // Strict validation checks
    if (context?.enableStrictValidation) {
      if (purchase.items && purchase.items.length > 100) {
        allErrors.push({
          type: 'warning',
          field: 'items',
          message: 'Purchase memiliki banyak item, pastikan data sudah benar'
        });
      }

      if (totalNilai > 100000000) { // > 100 million
        allErrors.push({
          type: 'warning',
          field: 'totalNilai',
          message: 'Nilai purchase sangat besar, pastikan data sudah benar'
        });
      }
    }

  } catch (error) {
    logger.error('Error during purchase validation:', error);
    allErrors.push({
      type: 'error',
      field: 'general',
      message: 'Terjadi kesalahan saat validasi data'
    });
  }

  const errors = allErrors.filter(e => e.type === 'error');
  const warnings = allErrors.filter(e => e.type === 'warning');
  const canComplete = errors.length === 0;

  const result: PurchaseValidationResult = {
    isValid: allErrors.length === 0,
    canComplete,
    errors,
    warnings,
    totalErrors: errors.length,
    totalWarnings: warnings.length
  };

  // Log validation results for debugging
  if (errors.length > 0 || warnings.length > 0) {
    logger.debug('Purchase validation completed', {
      purchaseId: purchase.id,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      canComplete,
      errors: errors.map(e => e.message),
      warnings: warnings.map(w => w.message)
    });
  }

  return result;
};

/**
 * Quick validation for item before adding to purchase
 */
export const validateNewPurchaseItem = (item: Partial<PurchaseItem>): string[] => {
  const errors: string[] = [];

  if (!item.bahanBakuId?.trim()) {
    errors.push('Pilih bahan baku');
  }

  if (!item.kuantitas || Number(item.kuantitas) <= 0) {
    errors.push('Kuantitas harus lebih dari 0');
  }

  if (!item.hargaSatuan || Number(item.hargaSatuan) <= 0) {
    errors.push('Harga satuan harus lebih dari 0');
  }

  if (!item.satuan?.trim()) {
    errors.push('Satuan harus diisi');
  }

  return errors;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (
  errors: ValidationError[], 
  includeItemIndex: boolean = true
): string[] => {
  return errors.map(error => {
    let message = error.message;
    if (includeItemIndex && error.itemIndex !== undefined) {
      message = `Item #${error.itemIndex + 1}: ${message}`;
    }
    return message;
  });
};

/**
 * Check if purchase data would cause warehouse calculation issues
 */
export const checkWarehouseCalculationRisks = (purchase: Purchase): ValidationError[] => {
  const risks: ValidationError[] = [];

  if (!purchase.items || purchase.items.length === 0) {
    return risks;
  }

  purchase.items.forEach((item, index) => {
    const quantity = Number(item.kuantitas);
    const unitPrice = Number(item.hargaSatuan);
    
    // Very small quantities might cause rounding issues
    if (quantity > 0 && quantity < 0.001) {
      risks.push({
        type: 'warning',
        field: 'kuantitas',
        message: 'Kuantitas sangat kecil, mungkin menyebabkan masalah pembulatan',
        itemIndex: index
      });
    }

    // Very small prices might cause precision issues
    if (unitPrice > 0 && unitPrice < 0.01) {
      risks.push({
        type: 'warning',
        field: 'hargaSatuan',
        message: 'Harga sangat kecil, mungkin menyebabkan masalah presisi',
        itemIndex: index
      });
    }

    // Extreme values that might overflow calculations
    if (quantity * unitPrice > 1000000000) { // > 1 billion
      risks.push({
        type: 'warning',
        field: 'subtotal',
        message: 'Nilai total item sangat besar, periksa perhitungan',
        itemIndex: index
      });
    }
  });

  return risks;
};

export default {
  validatePurchaseItem,
  validatePurchaseForCompletion,
  validateNewPurchaseItem,
  formatValidationErrors,
  checkWarehouseCalculationRisks
};
