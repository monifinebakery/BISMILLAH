// src/utils/robustNumberParser.ts
// Robust number parser for Indonesian locale

/**
 * Parse number with Indonesian locale support
 * Handles various formats: "1.234,56", "1234,56", "1234.56", "1,234.56"
 */
export const parseRobustNumber = (value: any, defaultValue: number = 0): number => {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  // If already a valid number
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : defaultValue;
  }

  // Convert to string and clean
  const str = String(value).trim();
  if (str === '') return defaultValue;

  // Remove all non-numeric characters except dot, comma, and minus
  let cleaned = str.replace(/[^\d.,\-]/g, '');
  
  if (cleaned === '' || cleaned === '-') return defaultValue;

  // Handle negative numbers
  const isNegative = cleaned.startsWith('-');
  if (isNegative) {
    cleaned = cleaned.substring(1);
  }

  // Count dots and commas
  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  let result: string = cleaned;

  // Simplified and more robust parsing logic
  if (dotCount === 0 && commaCount === 1) {
    // Format: "1234,56" - Indonesian decimal (comma as decimal separator)
    result = cleaned.replace(',', '.');
  } else if (dotCount === 1 && commaCount === 0) {
    // Format: "1234.56" - English decimal (dot as decimal separator)
    result = cleaned;
  } else if (dotCount === 1 && commaCount === 1) {
    // Format: "1.234,56" (Indonesian) or "1,234.56" (English)
    const dotIndex = cleaned.indexOf('.');
    const commaIndex = cleaned.indexOf(',');
    
    if (dotIndex < commaIndex) {
      // Format: "1.234,56" - dot as thousands separator, comma as decimal
      result = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Format: "1,234.56" - comma as thousands separator, dot as decimal
      result = cleaned.replace(/,/g, '');
    }
  } else if (dotCount > 1 || commaCount > 1) {
    // Multiple separators - assume the rightmost one is decimal if it has 1-3 digits after it
    const lastDotIndex = cleaned.lastIndexOf('.');
    const lastCommaIndex = cleaned.lastIndexOf(',');
    
    // Determine which is the decimal separator based on position and context
    if (lastCommaIndex > lastDotIndex && lastCommaIndex !== -1) {
      // Comma is rightmost and likely decimal separator
      const afterComma = cleaned.substring(lastCommaIndex + 1);
      if (afterComma.length <= 3 && /^\d+$/.test(afterComma)) {
        // Valid decimal part after comma
        result = cleaned.replace(/[.,]/g, '');
        result = result.substring(0, result.length - afterComma.length) + '.' + afterComma;
      } else {
        // Remove all separators
        result = cleaned.replace(/[.,]/g, '');
      }
    } else if (lastDotIndex > lastCommaIndex && lastDotIndex !== -1) {
      // Dot is rightmost and likely decimal separator
      const afterDot = cleaned.substring(lastDotIndex + 1);
      if (afterDot.length <= 3 && /^\d+$/.test(afterDot)) {
        // Valid decimal part after dot
        result = cleaned.replace(/[.,]/g, '');
        result = result.substring(0, result.length - afterDot.length) + '.' + afterDot;
      } else {
        // Remove all separators
        result = cleaned.replace(/[.,]/g, '');
      }
    } else {
      // Remove all separators as thousands separators
      result = cleaned.replace(/[.,]/g, '');
    }
  }

  // Parse the cleaned number
  const parsedNumber = parseFloat(result);
  const finalResult = isNegative ? -parsedNumber : parsedNumber;

  // Return the result or default if not finite
  return Number.isFinite(finalResult) ? finalResult : defaultValue;
};

/**
 * Ensure a value is a positive number greater than zero
 */
export const ensurePositiveNumber = (value: any, defaultValue: number = 0): number => {
  const parsed = parseRobustNumber(value, defaultValue);
  return Math.max(0, parsed);
};

/**
 * Parse quantity specifically (must be positive)
 */
export const parseQuantity = (value: any): number => {
  const parsed = parseRobustNumber(value, 0);
  return parsed > 0 ? parsed : 0;
};

/**
 * Parse price (can be zero for free items)
 */
export const parsePrice = (value: any): number => {
  return ensurePositiveNumber(value, 0);
};

/**
 * Format number for display in Indonesian locale
 */
export const formatNumberID = (value: number, decimals: number = 0): string => {
  if (!Number.isFinite(value)) return '0';
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
