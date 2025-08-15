// src/components/purchase/utils/validation/itemValidation.ts

import { ValidationResult } from './types';
import { PurchaseItem } from '../../types/purchase.types';
import { validateQuantity, validatePrice, checkPriceReasonableness } from './numericValidation';
import { validateRequiredString, validateUnit, validateItemName, validateDescription } from './fieldValidation';

/**
 * Validate individual purchase item
 */
export const validatePurchaseItem = (item: PurchaseItem, itemNumber?: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = itemNumber ? `Item ${itemNumber}: ` : 'Item: ';

  // Bahan Baku ID validation
  if (!item.bahanBakuId || typeof item.bahanBakuId !== 'string' || item.bahanBakuId.trim() === '') {
    errors.push(`${prefix}Bahan baku harus dipilih`);
  }

  // Name validation
  const nameValidation = validateItemName(item.nama);
  if (!nameValidation.isValid && nameValidation.error) {
    errors.push(`${prefix}${nameValidation.error}`);
  }

  // Quantity validation
  const qtyValidation = validateQuantity(item.kuantitas);
  if (!qtyValidation.isValid && qtyValidation.error) {
    errors.push(`${prefix}${qtyValidation.error}`);
  }

  // Unit validation
  const unitValidation = validateUnit(item.satuan);
  if (!unitValidation.isValid && unitValidation.error) {
    errors.push(`${prefix}${unitValidation.error}`);
  }

  // Unit price validation
  const priceValidation = validatePrice(item.hargaSatuan, 'Harga satuan');
  if (!priceValidation.isValid && priceValidation.error) {
    errors.push(`${prefix}${priceValidation.error}`);
  }

  // Subtotal validation
  const expectedSubtotal = (item.kuantitas || 0) * (item.hargaSatuan || 0);
  const actualSubtotal = item.subtotal || 0;
  
  if (Math.abs(expectedSubtotal - actualSubtotal) > 0.01) {
    warnings.push(`${prefix}Subtotal tidak sesuai dengan kuantitas × harga satuan`);
  }

  // Description validation (optional)
  const descValidation = validateDescription(item.keterangan);
  if (!descValidation.isValid && descValidation.error) {
    warnings.push(`${prefix}${descValidation.error}`);
  }

  // Price reasonableness check
  if (item.hargaSatuan) {
    const priceWarning = checkPriceReasonableness(item.hargaSatuan);
    if (priceWarning) {
      warnings.push(`${prefix}${priceWarning}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate purchase items array
 */
export const validatePurchaseItems = (items: PurchaseItem[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(items)) {
    return {
      isValid: false,
      errors: ['Data items tidak valid'],
      warnings: [],
    };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      errors: ['Minimal satu item harus ditambahkan'],
      warnings: [],
    };
  }

  if (items.length > 50) {
    warnings.push('Terlalu banyak item dalam satu pembelian (lebih dari 50 item)');
  }

  // Validate each item and track duplicates in single pass
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    const itemValidation = validatePurchaseItem(item, index + 1);
    errors.push(...itemValidation.errors);
    warnings.push(...itemValidation.warnings);

    const key = `${item.bahanBakuId}-${item.nama}`.toLowerCase();
    const firstIndex = seen.get(key);
    if (firstIndex !== undefined) {
      warnings.push(`Item duplikat ditemukan pada baris ${firstIndex} dan ${index + 1}`);
    } else {
      seen.set(key, index + 1);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Check for duplicate items in purchase
 */
export const checkDuplicateItems = (items: PurchaseItem[]): string[] => {
  const warnings: string[] = [];
  const seen = new Map<string, number>();

  items.forEach((item, index) => {
    const key = `${item.bahanBakuId}-${item.nama}`.toLowerCase();
    const firstIndex = seen.get(key);
    if (firstIndex !== undefined) {
      warnings.push(`Item duplikat ditemukan pada baris ${firstIndex} dan ${index + 1}`);
    } else {
      seen.set(key, index + 1);
    }
  });

  return warnings;
};