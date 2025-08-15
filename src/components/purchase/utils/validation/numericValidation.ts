// src/components/purchase/utils/validation/numericValidation.ts

import { FieldValidation, NumericConstraints } from './types';

/** Locale‑friendly number parser:
 * - Hilangkan spasi/karakter non angka.
 * - Jika ada '.' dan ',' → anggap '.' ribuan, ',' desimal → remove '.' lalu ganti ',' → '.'
 * - Jika hanya ada ',' → ganti ke '.'
 * - Jika hanya '.' → biarkan.
 */
const parseFlexibleNumber = (raw: any): number => {
  if (raw === null || raw === undefined || raw === '') return NaN;
  if (typeof raw === 'number') return raw;
  const s = String(raw).trim().replace(/[^\d.,+-]/g, '');
  if (!s) return NaN;

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  let normalized = s;
  if (hasDot && hasComma) {
    // "1.234,56" -> "1234.56"
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (!hasDot && hasComma) {
    // "1234,56" -> "1234.56"
    normalized = s.replace(',', '.');
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Validate numeric input with constraints (locale‑friendly)
 */
export const validateNumericInput = (
  value: any,
  fieldName: string,
  constraints?: NumericConstraints
): FieldValidation => {
  const { min, max, integer = false, required = true } = constraints || {};

  // Required check
  if (required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: `${fieldName} harus diisi` };
  }

  // Allow empty for non-required
  if (!required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }

  // Parse number toleran terhadap koma/titik
  const numValue = parseFlexibleNumber(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} harus berupa angka yang valid` };
  }

  if (integer && !Number.isInteger(numValue)) {
    return { isValid: false, error: `${fieldName} harus berupa bilangan bulat` };
  }

  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `${fieldName} tidak boleh kurang dari ${min}` };
  }

  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `${fieldName} tidak boleh lebih dari ${max}` };
  }

  return { isValid: true };
};

/**
 * Validate quantity field specifically
 */
export const validateQuantity = (quantity: any): FieldValidation => {
  return validateNumericInput(quantity, 'Kuantitas', {
    min: 0.001,
    max: 999999,
    required: true,
  });
};

/**
 * Validate price field specifically
 * (Kita butuh > 0 agar konsisten dengan form submit)
 */
export const validatePrice = (price: any, fieldName: string = 'Harga'): FieldValidation => {
  return validateNumericInput(price, fieldName, {
    min: 0.01,
    max: 999999999,
    required: true,
  });
};

/**
 * Check if price is reasonable (warning for very high prices)
 */
export const checkPriceReasonableness = (price: number, threshold: number = 10000000): string | null => {
  if (price > threshold) {
    return `Harga sangat tinggi (${price.toLocaleString('id-ID')}), pastikan sudah benar`;
  }
  return null;
};
