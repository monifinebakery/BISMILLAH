// src/components/purchase/utils/validation/numericValidation.ts

import { FieldValidation, NumericConstraints } from './types';

/**
 * Validate numeric input with constraints
 */
export const validateNumericInput = (
  value: any,
  fieldName: string,
  constraints?: NumericConstraints
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
 */
export const validatePrice = (price: any, fieldName: string = 'Harga'): FieldValidation => {
  return validateNumericInput(price, fieldName, {
    min: 0,
    max: 999999999,
    required: true,
  });
};

/**
 * Check if price is reasonable (warning for very high prices)
 */
export const checkPriceReasonableness = (price: number, threshold: number = 10000000): string | null => {
  if (price > threshold) {
    return `Harga sangat tinggi (${price.toLocaleString()}), pastikan sudah benar`;
  }
  return null;
};