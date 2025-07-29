// src/components/purchase/utils/purchaseValidation.ts

import { Purchase, PurchaseItem, PurchaseFormData } from '../types/purchase.types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Field validation result
 */
export interface FieldValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate purchase form data comprehensively
 */
export const validatePurchaseForm = (data: Partial<PurchaseFormData>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Supplier validation
  const supplierValidation = validateSupplier(data.supplier);
  if (!supplierValidation.isValid && supplierValidation.error) {
    errors.push(supplierValidation.error);
  }

  // Date validation
  const dateValidation = validatePurchaseDate(data.tanggal);
  if (!dateValidation.isValid && dateValidation.error) {
    errors.push(dateValidation.error);
  }
  if (dateValidation.warning) {
    warnings.push(dateValidation.warning);
  }

  // Items validation
  const itemsValidation = validatePurchaseItems(data.items || []);
  errors.push(...itemsValidation.errors);
  warnings.push(...itemsValidation.warnings);

  // Calculation method validation
  const methodValidation = validateCalculationMethod(data.metodePerhitungan);
  if (!methodValidation.isValid && methodValidation.error) {
    errors.push(methodValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate supplier field
 */
export const validateSupplier = (supplier?: string): FieldValidation => {
  if (!supplier || typeof supplier !== 'string') {
    return {
      isValid: false,
      error: 'Supplier harus dipilih',
    };
  }

  if (supplier.trim().length === 0) {
    return {
      isValid: false,
      error: 'Supplier tidak boleh kosong',
    };
  }

  if (supplier.length > 255) {
    return {
      isValid: false,
      error: 'Nama supplier terlalu panjang (maksimal 255 karakter)',
    };
  }

  return { isValid: true };
};

/**
 * Validate purchase date
 */
export const validatePurchaseDate = (tanggal?: Date): FieldValidation => {
  if (!tanggal) {
    return {
      isValid: false,
      error: 'Tanggal pembelian harus diisi',
    };
  }

  if (!(tanggal instanceof Date) || isNaN(tanggal.getTime())) {
    return {
      isValid: false,
      error: 'Format tanggal tidak valid',
    };
  }

  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  // Check if date is too far in the future
  if (tanggal > oneYearFromNow) {
    return {
      isValid: false,
      error: 'Tanggal pembelian tidak boleh lebih dari 1 tahun ke depan',
    };
  }

  // Check if date is too far in the past
  if (tanggal < oneYearAgo) {
    return {
      isValid: true,
      warning: 'Tanggal pembelian lebih dari 1 tahun yang lalu',
    };
  }

  // Check if date is in the future
  if (tanggal > now) {
    return {
      isValid: true,
      warning: 'Tanggal pembelian adalah tanggal masa depan',
    };
  }

  return { isValid: true };
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

  // Validate each item
  items.forEach((item, index) => {
    const itemValidation = validatePurchaseItem(item, index + 1);
    errors.push(...itemValidation.errors);
    warnings.push(...itemValidation.warnings);
  });

  // Check for duplicate items
  const duplicateCheck = checkDuplicateItems(items);
  warnings.push(...duplicateCheck);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

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
  if (!item.nama || typeof item.nama !== 'string' || item.nama.trim() === '') {
    errors.push(`${prefix}Nama item harus diisi`);
  } else if (item.nama.length > 255) {
    errors.push(`${prefix}Nama item terlalu panjang (maksimal 255 karakter)`);
  }

  // Quantity validation
  const qtyValidation = validateNumericInput(item.kuantitas, 'Kuantitas', { min: 0.001, max: 999999 });
  if (!qtyValidation.isValid && qtyValidation.error) {
    errors.push(`${prefix}${qtyValidation.error}`);
  }

  // Unit validation
  if (!item.satuan || typeof item.satuan !== 'string' || item.satuan.trim() === '') {
    errors.push(`${prefix}Satuan harus diisi`);
  }

  // Unit price validation
  const priceValidation = validateNumericInput(item.hargaSatuan, 'Harga satuan', { min: 0, max: 999999999 });
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
  if (item.keterangan && item.keterangan.length > 500) {
    warnings.push(`${prefix}Keterangan terlalu panjang (maksimal 500 karakter)`);
  }

  // Price reasonableness check
  if (item.hargaSatuan && item.hargaSatuan > 10000000) {
    warnings.push(`${prefix}Harga satuan sangat tinggi, pastikan sudah benar`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate calculation method
 */
export const validateCalculationMethod = (method?: string): FieldValidation => {
  const validMethods = ['FIFO', 'LIFO', 'AVERAGE'];
  
  if (!method) {
    return { isValid: true }; // Optional field, will default to FIFO
  }

  if (!validMethods.includes(method)) {
    return {
      isValid: false,
      error: 'Metode perhitungan tidak valid',
    };
  }

  return { isValid: true };
};

/**
 * Validate numeric input with constraints
 */
export const validateNumericInput = (
  value: any,
  fieldName: string,
  constraints?: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
  }
): FieldValidation => {
  const { min, max, integer = false, required = true } = constraints || {};

  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      error: `${fieldName} harus diisi`,
    };
  }

  // Allow empty for non-required fields
  if (!required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }

  // Convert to number
  const numValue = Number(value);

  // Check if valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return {
      isValid: false,
      error: `${fieldName} harus berupa angka yang valid`,
    };
  }

  // Check if integer required
  if (integer && !Number.isInteger(numValue)) {
    return {
      isValid: false,
      error: `${fieldName} harus berupa bilangan bulat`,
    };
  }

  // Check minimum value
  if (min !== undefined && numValue < min) {
    return {
      isValid: false,
      error: `${fieldName} tidak boleh kurang dari ${min}`,
    };
  }

  // Check maximum value
  if (max !== undefined && numValue > max) {
    return {
      isValid: false,
      error: `${fieldName} tidak boleh lebih dari ${max}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate?: Date, endDate?: Date): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (startDate && endDate) {
    if (startDate > endDate) {
      errors.push('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
    }

    const diffInDays = Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays > 365) {
      warnings.push('Rentang tanggal lebih dari 1 tahun, data mungkin terlalu banyak');
    }
  }

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
  const seen = new Map<string, number[]>();

  items.forEach((item, index) => {
    const key = `${item.bahanBakuId}-${item.nama}`;
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(index + 1);
  });

  seen.forEach((indices, key) => {
    if (indices.length > 1) {
      warnings.push(`Item duplikat ditemukan pada baris ${indices.join(', ')}`);
    }
  });

  return warnings;
};

/**
 * Sanitize and normalize input values
 */
export const sanitizeInput = (value: any, type: 'string' | 'number' | 'date'): any => {
  switch (type) {
    case 'string':
      return typeof value === 'string' ? value.trim() : String(value || '').trim();
    
    case 'number':
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    
    case 'date':
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
      }
      return new Date();
    
    default:
      return value;
  }
};
  const errors: string[] = [];
  const warnings: string[] = [];

  // Supplier validation
  const supplierValidation = validateSupplier(data.supplier);
  if (!supplierValidation.isValid && supplierValidation.error) {
    errors.push(supplierValidation.error);
  }

  // Date validation
  const dateValidation = validatePurchaseDate(data.tanggal);
  if (!dateValidation.isValid && dateValidation.error) {
    errors.push(dateValidation.error);
  }
  if (dateValidation.warning) {
    warnings.push(dateValidation.warning);
  }

  // Items validation
  const itemsValidation = validatePurchaseItems(data.items || []);
  errors.push(...itemsValidation.errors);
  warnings.push(...itemsValidation.warnings);

  // Calculation method validation
  const methodValidation = validateCalculationMethod(data.metodePerhitungan);
  if (!methodValidation.isValid && methodValidation.error) {
    errors.push(methodValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate supplier field
 */
export const validateSupplier = (supplier?: string): FieldValidation => {
  if (!supplier || typeof supplier !== 'string') {
    return {
      isValid: false,
      error: 'Supplier harus dipilih',
    };
  }

  if (supplier.trim().length === 0) {
    return {
      isValid: false,
      error: 'Supplier tidak boleh kosong',
    };
  }

  if (supplier.length > 255) {
    return {
      isValid: false,
      error: 'Nama supplier terlalu panjang (maksimal 255 karakter)',
    };
  }

  return { isValid: true };
};

/**
 * Validate purchase date
 */
export const validatePurchaseDate = (tanggal?: Date): FieldValidation => {
  if (!tanggal) {
    return {
      isValid: false,
      error: 'Tanggal pembelian harus diisi',
    };
  }

  if (!(tanggal instanceof Date) || isNaN(tanggal.getTime())) {
    return {
      isValid: false,
      error: 'Format tanggal tidak valid',
    };
  }

  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  // Check if date is too far in the future
  if (tanggal > oneYearFromNow) {
    return {
      isValid: false,
      error: 'Tanggal pembelian tidak boleh lebih dari 1 tahun ke depan',
    };
  }

  // Check if date is too far in the past
  if (tanggal < oneYearAgo) {
    return {
      isValid: true,
      warning: 'Tanggal pembelian lebih dari 1 tahun yang lalu',
    };
  }

  // Check if date is in the future
  if (tanggal > now) {
    return {
      isValid: true,
      warning: 'Tanggal pembelian adalah tanggal masa depan',
    };
  }

  return { isValid: true };
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

  // Validate each item
  items.forEach((item, index) => {
    const itemValidation = validatePurchaseItem(item, index + 1);
    errors.push(...itemValidation.errors);
    warnings.push(...itemValidation.warnings);
  });

  // Check for duplicate items
  const duplicateCheck = checkDuplicateItems(items);
  warnings.push(...duplicateCheck);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

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
  if (!item.nama || typeof item.nama !== 'string' || item.nama.trim() === '') {
    errors.push(`${prefix}Nama item harus diisi`);
  } else if (item.nama.length > 255) {
    errors.push(`${prefix}Nama item terlalu panjang (maksimal 255 karakter)`);
  }

  // Quantity validation
  const qtyValidation = validateNumericInput(item.kuantitas, 'Kuantitas', { min: 0.001, max: 999999 });
  if (!qtyValidation.isValid && qtyValidation.error) {
    errors.push(`${prefix}${qtyValidation.error}`);
  }

  // Unit validation
  if (!item.satuan || typeof item.satuan !== 'string' || item.satuan.trim() === '') {
    errors.push(`${prefix}Satuan harus diisi`);
  }

  // Unit price validation
  const priceValidation = validateNumericInput(item.hargaSatuan, 'Harga satuan', { min: 0, max: 999999999 });
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
  if (item.keterangan && item.keterangan.length > 500) {
    warnings.push(`${prefix}Keterangan terlalu panjang (maksimal 500 karakter)`);
  }

  // Price reasonableness check
  if (item.hargaSatuan && item.hargaSatuan > 10000000) {
    warnings.push(`${prefix}Harga satuan sangat tinggi, pastikan sudah benar`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate calculation method
 */
export const validateCalculationMethod = (method?: string): FieldValidation => {
  const validMethods = ['FIFO', 'LIFO', 'AVERAGE'];
  
  if (!method) {
    return { isValid: true }; // Optional field, will default to FIFO
  }

  if (!validMethods.includes(method)) {
    return {
      isValid: false,
      error: 'Metode perhitungan tidak valid',
    };
  }

  return { isValid: true };
};

/**
 * Validate numeric input with constraints
 */
export const validateNumericInput = (
  value: any,
  fieldName: string,
  constraints?: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
  }
): FieldValidation => {
  const { min, max, integer = false, required = true } = constraints || {};

  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      error: `${fieldName} harus diisi`,
    };
  }

  // Allow empty for non-required fields
  if (!required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }

  // Convert to number
  const numValue = Number(value);

  // Check if valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return {
      isValid: false,
      error: `${fieldName} harus berupa angka yang valid`,
    };
  }

  // Check if integer required
  if (integer && !Number.isInteger(numValue)) {
    return {
      isValid: false,
      error: `${fieldName} harus berupa bilangan bulat`,
    };
  }

  // Check minimum value
  if (min !== undefined && numValue < min) {
    return {
      isValid: false,
      error: `${fieldName} tidak boleh kurang dari ${min}`,
    };
  }

  // Check maximum value
  if (max !== undefined && numValue > max) {
    return {
      isValid: false,
      error: `${fieldName} tidak boleh lebih dari ${max}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate?: Date, endDate?: Date): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (startDate && endDate) {
    if (startDate > endDate) {
      errors.push('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
    }

    const diffInDays = Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays > 365) {
      warnings.push('Rentang tanggal lebih dari 1 tahun, data mungkin terlalu banyak');
    }
  }

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
  const seen = new Map<string, number[]>();

  items.forEach((item, index) => {
    const key = `${item.bahanBakuId}-${item.nama}`;
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(index + 1);
  });

  seen.forEach((indices, key) => {
    if (indices.length > 1) {
      warnings.push(`Item duplikat ditemukan pada baris ${indices.join(', ')}`);
    }
  });

  return warnings;
};

/**
 * Sanitize and normalize input values
 */
export const sanitizeInput = (value: any, type: 'string' | 'number' | 'date'): any => {
  switch (type) {
    case 'string':
      return typeof value === 'string' ? value.trim() : String(value || '').trim();
    
    case 'number':
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    
    case 'date':
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
      }
      return new Date();
    
    default:
      return value;
  }
};