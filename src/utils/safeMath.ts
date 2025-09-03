// src/utils/safeMath.ts
// Safe math operations to prevent NaN values

/**
 * Safe number conversion - converts any input to a valid number
 */
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
  }
  
  return 0;
};

/**
 * Safe division - prevents division by zero and returns 0 instead of NaN
 */
export const safeDivide = (dividend: any, divisor: any): number => {
  const safeDividend = safeNumber(dividend);
  const safeDivisor = safeNumber(divisor);
  
  if (safeDivisor === 0) {
    return 0;
  }
  
  const result = safeDividend / safeDivisor;
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe multiplication
 */
export const safeMultiply = (a: any, b: any): number => {
  const safeA = safeNumber(a);
  const safeB = safeNumber(b);
  
  const result = safeA * safeB;
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe addition
 */
export const safeAdd = (a: any, b: any): number => {
  const safeA = safeNumber(a);
  const safeB = safeNumber(b);
  
  const result = safeA + safeB;
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe subtraction
 */
export const safeSubtract = (a: any, b: any): number => {
  const safeA = safeNumber(a);
  const safeB = safeNumber(b);
  
  const result = safeA - safeB;
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe percentage calculation
 */
export const safePercentage = (value: any, total: any): number => {
  const safeValue = safeNumber(value);
  const safeTotal = safeNumber(total);
  
  if (safeTotal === 0) {
    return 0;
  }
  
  const result = (safeValue / safeTotal) * 100;
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe average calculation
 */
export const safeAverage = (values: any[]): number => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const safeValues = values.map(safeNumber);
  const sum = safeValues.reduce((acc, val) => safeAdd(acc, val), 0);
  
  return safeDivide(sum, safeValues.length);
};

/**
 * Safe minimum value
 */
export const safeMin = (...values: any[]): number => {
  if (values.length === 0) {
    return 0;
  }
  
  const safeValues = values.map(safeNumber);
  const result = Math.min(...safeValues);
  
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe maximum value
 */
export const safeMax = (...values: any[]): number => {
  if (values.length === 0) {
    return 0;
  }
  
  const safeValues = values.map(safeNumber);
  const result = Math.max(...safeValues);
  
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe power calculation
 */
export const safePower = (base: any, exponent: any): number => {
  const safeBase = safeNumber(base);
  const safeExponent = safeNumber(exponent);
  
  const result = Math.pow(safeBase, safeExponent);
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe square root calculation
 */
export const safeSqrt = (value: any): number => {
  const safeValue = safeNumber(value);
  
  if (safeValue < 0) {
    return 0;
  }
  
  const result = Math.sqrt(safeValue);
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Safe rounding
 */
export const safeRound = (value: any, decimals: number = 0): number => {
  const safeValue = safeNumber(value);
  const multiplier = Math.pow(10, decimals);
  
  const result = Math.round(safeValue * multiplier) / multiplier;
  return isNaN(result) || !isFinite(result) ? 0 : result;
};

/**
 * Check if a value is a valid number (not NaN, null, undefined, or Infinity)
 */
export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Safe format for display - returns a fallback string if value is invalid
 */
export const safeFormat = (value: any, formatter: (num: number) => string, fallback: string = '0'): string => {
  const safeValue = safeNumber(value);
  
  try {
    return formatter(safeValue);
  } catch (error) {
    return fallback;
  }
};

// Export all functions as a namespace for easier importing
export const SafeMath = {
  safeNumber,
  safeDivide,
  safeMultiply,
  safeAdd,
  safeSubtract,
  safePercentage,
  safeAverage,
  safeMin,
  safeMax,
  safePower,
  safeSqrt,
  safeRound,
  isValidNumber,
  safeFormat
};
