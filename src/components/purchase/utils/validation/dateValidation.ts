// src/components/purchase/utils/validation/dateValidation.ts

import { FieldValidation, ValidationResult, DateConstraints } from './types';

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
 * Generic date validation with constraints
 */
export const validateDate = (
  date: any,
  fieldName: string,
  constraints?: DateConstraints
): FieldValidation => {
  const {
    required = true,
    allowFuture = true,
    allowPast = true,
    maxYearsInFuture = 1,
    maxYearsInPast = 10,
  } = constraints || {};

  // Check if required
  if (required && !date) {
    return {
      isValid: false,
      error: `${fieldName} harus diisi`,
    };
  }

  // Allow empty for non-required fields
  if (!required && !date) {
    return { isValid: true };
  }

  // Enhanced date validation to handle various formats
  let parsedDate: Date;
  
  try {
    if (date instanceof Date) {
      parsedDate = new Date(date);
    } else if (typeof date === 'string') {
      // Handle timestamp with timezone (PostgreSQL timestamptz format)
      if (date.includes('T') && (date.includes('Z') || date.includes('+') || date.endsWith('00'))) {
        parsedDate = new Date(date);
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Handle YYYY-MM-DD format
        parsedDate = new Date(date + 'T00:00:00.000Z');
      } else {
        parsedDate = new Date(date);
      }
    } else if (typeof date === 'number') {
      parsedDate = new Date(date);
    } else {
      return {
        isValid: false,
        error: `Format ${fieldName.toLowerCase()} tidak valid - tipe data tidak didukung`,
      };
    }
    
    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      return {
        isValid: false,
        error: `Format ${fieldName.toLowerCase()} tidak valid - tidak dapat diparse sebagai tanggal`,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Format ${fieldName.toLowerCase()} tidak valid - error parsing: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }

  const now = new Date();
  
  // Check future dates
  if (!allowFuture && date > now) {
    return {
      isValid: false,
      error: `${fieldName} tidak boleh di masa depan`,
    };
  }

  // Check past dates
  if (!allowPast && date < now) {
    return {
      isValid: false,
      error: `${fieldName} tidak boleh di masa lalu`,
    };
  }

  // Check max years in future
  if (maxYearsInFuture) {
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(now.getFullYear() + maxYearsInFuture);
    
    if (date > maxFutureDate) {
      return {
        isValid: false,
        error: `${fieldName} tidak boleh lebih dari ${maxYearsInFuture} tahun ke depan`,
      };
    }
  }

  // Check max years in past
  if (maxYearsInPast) {
    const maxPastDate = new Date();
    maxPastDate.setFullYear(now.getFullYear() - maxYearsInPast);
    
    if (date < maxPastDate) {
      return {
        isValid: true,
        warning: `${fieldName} lebih dari ${maxYearsInPast} tahun yang lalu`,
      };
    }
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