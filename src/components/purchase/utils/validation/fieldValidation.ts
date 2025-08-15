// src/components/purchase/utils/validation/fieldValidation.ts

import { FieldValidation } from './types';

/**
 * Validate supplier field (expects supplier ID string)
 */
export const validateSupplier = (supplier?: string): FieldValidation => {
  if (!supplier || typeof supplier !== 'string') {
    return { isValid: false, error: 'Supplier harus dipilih' };
  }

  if (supplier.trim().length === 0) {
    return { isValid: false, error: 'Supplier tidak boleh kosong' };
  }

  if (supplier.length > 255) {
    return { isValid: false, error: 'Nama supplier terlalu panjang (maksimal 255 karakter)' };
  }

  return { isValid: true };
};

/**
 * Validate calculation method
 * (Optional; default aplikasi adalah 'AVERAGE' bila kosong)
 */
export const validateCalculationMethod = (method?: string): FieldValidation => {
  const validMethods = ['FIFO', 'LIFO', 'AVERAGE'];

  if (!method) {
    // biarkan kosong: akan di-default-kan ke 'AVERAGE' di layer lain
    return { isValid: true };
  }

  if (!validMethods.includes(method)) {
    return { isValid: false, error: 'Metode perhitungan tidak valid' };
  }

  return { isValid: true };
};

/**
 * Validate required string field
 */
export const validateRequiredString = (
  value?: string,
  fieldName: string = 'Field',
  maxLength?: number
): FieldValidation => {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} harus diisi` };
  }

  if (value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} tidak boleh kosong` };
  }

  if (maxLength && value.length > maxLength) {
    return { isValid: false, error: `${fieldName} terlalu panjang (maksimal ${maxLength} karakter)` };
  }

  return { isValid: true };
};

/**
 * Validate optional string field
 */
export const validateOptionalString = (
  value?: string,
  fieldName: string = 'Field',
  maxLength?: number
): FieldValidation => {
  if (!value) return { isValid: true };

  if (typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} harus berupa teks` };
  }

  if (maxLength && value.length > maxLength) {
    return { isValid: false, error: `${fieldName} terlalu panjang (maksimal ${maxLength} karakter)` };
  }

  return { isValid: true };
};

/**
 * Validate unit field
 */
export const validateUnit = (unit?: string): FieldValidation => {
  return validateRequiredString(unit, 'Satuan', 50);
};

/**
 * Validate item name field
 */
export const validateItemName = (name?: string): FieldValidation => {
  return validateRequiredString(name, 'Nama item', 255);
};

/**
 * Validate description field
 */
export const validateDescription = (description?: string): FieldValidation => {
  return validateOptionalString(description, 'Keterangan', 500);
};
