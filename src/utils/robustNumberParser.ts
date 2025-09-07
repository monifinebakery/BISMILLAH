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

  console.log('DEBUG parseRobustNumber: Input:', value, 'Type:', typeof value, 'String:', str);

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

  // Handle different number formats
  if (dotCount === 0 && commaCount === 1) {
    // Format: "1234,56" - Indonesian decimal
    result = cleaned.replace(',', '.');
  } else if (dotCount === 1 && commaCount === 0) {
    // Format: "1234.56" - English decimal (keep as is)
    result = cleaned;
  } else if (dotCount === 1 && commaCount === 1) {
    // Format: "1.234,56" or "1,234.56"
    const dotIndex = cleaned.indexOf('.');
    const commaIndex = cleaned.indexOf(',');
    
    if (dotIndex < commaIndex) {
      // Format: "1.234,56" - dot as thousands, comma as decimal
      result = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Format: "1,234.56" - comma as thousands, dot as decimal
      result = cleaned.replace(/,/g, '');
    }
  } else if (dotCount > 1 && commaCount === 0) {
    // Format: "1.234.567" - multiple dots, assume thousands separators except last
    const parts = cleaned.split('.');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      // If last part has 2 digits, it's likely decimal
      if (lastPart.length === 2) {
        result = parts.slice(0, -1).join('') + '.' + lastPart;
      } else {
        // All are thousands separators
        result = parts.join('');
      }
    }
  } else if (dotCount === 0 && commaCount > 1) {
    // Format: "1,234,567" - multiple commas as thousands separators
    result = cleaned.replace(/,/g, '');
  } else if (dotCount > 1 && commaCount > 0) {
    // Complex format, try to clean up
    // Remove all separators except the last one as decimal
    const lastCommaIndex = cleaned.lastIndexOf(',');
    const lastDotIndex = cleaned.lastIndexOf('.');
    
    if (lastCommaIndex > lastDotIndex) {
      // Last comma is likely decimal
      result = cleaned.replace(/[.,]/g, '');
      result = result.substring(0, lastCommaIndex) + '.' + result.substring(lastCommaIndex + 1);
    } else if (lastDotIndex > lastCommaIndex) {
      // Last dot is likely decimal
      result = cleaned.replace(/[.,]/g, '');
      result = result.substring(0, lastDotIndex) + '.' + result.substring(lastDotIndex + 1);
    } else {
      // Remove all separators
      result = cleaned.replace(/[.,]/g, '');
    }
  }

  // Parse the cleaned number
  const parsedNumber = parseFloat(result);
  const finalResult = isNegative ? -parsedNumber : parsedNumber;

  console.log('DEBUG parseRobustNumber: Result:', {
    input: value,
    cleaned: cleaned,
    processed: result,
    parsed: parsedNumber,
    final: finalResult,
    isFinite: Number.isFinite(finalResult)
  });

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
