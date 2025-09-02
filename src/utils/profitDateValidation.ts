// src/utils/profitDateValidation.ts
// Date validation utility specifically for profit analysis
// Ensures date consistency between UI selection and database queries

import { logger } from '@/utils/logger';
import { normalizeDateForDatabase } from '@/utils/dateNormalization';
import { safeParseDate, isValidDate, formatDateToYYYYMMDD } from '@/utils/unifiedDateUtils';

export interface DateValidationResult {
  isValid: boolean;
  normalizedDate?: string;
  originalInput?: any;
  issues: string[];
  suggestions: string[];
}

export interface DateRangeValidationResult {
  isValid: boolean;
  startDate?: string;
  endDate?: string;
  dayCount?: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Validate and normalize a single date for profit analysis
 */
export function validateProfitAnalysisDate(
  dateInput: any,
  context: string = 'unknown'
): DateValidationResult {
  const result: DateValidationResult = {
    isValid: false,
    originalInput: dateInput,
    issues: [],
    suggestions: []
  };

  try {
    // Check if input exists
    if (dateInput === null || dateInput === undefined) {
      result.issues.push('Tanggal tidak boleh kosong');
      result.suggestions.push('Pilih tanggal yang valid');
      return result;
    }

    // Parse the date safely
    const parsedDate = safeParseDate(dateInput);
    if (!parsedDate || !isValidDate(parsedDate)) {
      result.issues.push('Format tanggal tidak valid');
      result.suggestions.push('Gunakan format DD/MM/YYYY atau pilih dari calendar');
      return result;
    }

    // Check date range (business logic)
    const currentYear = new Date().getFullYear();
    const minYear = 2020; // Business start year
    const maxYear = currentYear + 1;

    const dateYear = parsedDate.getFullYear();
    if (dateYear < minYear) {
      result.issues.push(`Tanggal terlalu lama (sebelum ${minYear})`);
      result.suggestions.push(`Pilih tanggal dari tahun ${minYear} atau setelahnya`);
      return result;
    }

    if (dateYear > maxYear) {
      result.issues.push(`Tanggal terlalu jauh ke depan (setelah ${maxYear})`);
      result.suggestions.push(`Pilih tanggal maksimal hingga tahun ${maxYear}`);
      return result;
    }

    // Normalize for database storage
    const normalizedDate = formatDateToYYYYMMDD(parsedDate);
    if (!normalizedDate) {
      result.issues.push('Gagal normalisasi tanggal untuk database');
      result.suggestions.push('Coba pilih tanggal lain');
      return result;
    }

    // Success
    result.isValid = true;
    result.normalizedDate = normalizedDate;

    logger.debug(`✅ Date validation success (${context}): ${dateInput} -> ${normalizedDate}`);

    return result;

  } catch (error) {
    result.issues.push('Error validasi tanggal');
    result.suggestions.push('Coba refresh halaman dan pilih tanggal lagi');
    logger.error(`❌ Date validation error (${context}):`, error);
    return result;
  }
}

/**
 * Validate date range for profit analysis
 */
export function validateProfitAnalysisDateRange(
  fromDate: any,
  toDate: any,
  context: string = 'profit-analysis'
): DateRangeValidationResult {
  const result: DateRangeValidationResult = {
    isValid: false,
    issues: [],
    suggestions: []
  };

  try {
    // Validate start date
    const fromValidation = validateProfitAnalysisDate(fromDate, `${context}-start`);
    if (!fromValidation.isValid) {
      result.issues.push(`Tanggal mulai: ${fromValidation.issues.join(', ')}`);
      result.suggestions.push(...fromValidation.suggestions);
      return result;
    }

    // Validate end date
    const toValidation = validateProfitAnalysisDate(toDate, `${context}-end`);
    if (!toValidation.isValid) {
      result.issues.push(`Tanggal selesai: ${toValidation.issues.join(', ')}`);
      result.suggestions.push(...toValidation.suggestions);
      return result;
    }

    const startDate = fromValidation.normalizedDate!;
    const endDate = toValidation.normalizedDate!;

    // Check date order
    if (startDate > endDate) {
      result.issues.push('Tanggal mulai tidak boleh setelah tanggal selesai');
      result.suggestions.push('Tukar tanggal mulai dan selesai, atau pilih ulang');
      return result;
    }

    // Calculate day count
    const startDateObj = safeParseDate(startDate);
    const endDateObj = safeParseDate(endDate);
    const dayCount = startDateObj && endDateObj 
      ? Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    // Check reasonable range (max 1 year for daily analysis)
    if (dayCount > 365) {
      result.issues.push('Rentang tanggal terlalu panjang (maksimal 1 tahun)');
      result.suggestions.push('Pilih rentang tanggal yang lebih pendek untuk analisis harian');
      return result;
    }

    // Success
    result.isValid = true;
    result.startDate = startDate;
    result.endDate = endDate;
    result.dayCount = dayCount;

    logger.info(`✅ Date range validation success (${context}): ${startDate} to ${endDate} (${dayCount} days)`);

    return result;

  } catch (error) {
    result.issues.push('Error validasi rentang tanggal');
    result.suggestions.push('Coba refresh halaman dan pilih tanggal lagi');
    logger.error(`❌ Date range validation error (${context}):`, error);
    return result;
  }
}

/**
 * Helper function to check if date matches selected range
 * Used to verify that data fetched matches user selection
 */
export function verifyDataMatchesDateSelection(
  selectedFromDate: any,
  selectedToDate: any,
  actualDataDates: string[],
  context: string = 'data-verification'
): {
  isMatching: boolean;
  expectedDays: string[];
  actualDays: string[];
  missingDays: string[];
  extraDays: string[];
  summary: string;
} {
  try {
    const rangeValidation = validateProfitAnalysisDateRange(selectedFromDate, selectedToDate, context);
    
    if (!rangeValidation.isValid) {
      return {
        isMatching: false,
        expectedDays: [],
        actualDays: actualDataDates.sort(),
        missingDays: [],
        extraDays: [],
        summary: `Invalid date range: ${rangeValidation.issues.join(', ')}`
      };
    }

    // Generate expected days
    const expectedDays: string[] = [];
    const startDate = safeParseDate(rangeValidation.startDate!);
    const endDate = safeParseDate(rangeValidation.endDate!);
    
    if (startDate && endDate) {
      const current = new Date(startDate);
      while (current <= endDate) {
        expectedDays.push(formatDateToYYYYMMDD(current));
        current.setDate(current.getDate() + 1);
      }
    }

    const actualDays = [...new Set(actualDataDates)].sort();
    const expectedSet = new Set(expectedDays);
    const actualSet = new Set(actualDays);

    const missingDays = expectedDays.filter(day => !actualSet.has(day));
    const extraDays = actualDays.filter(day => !expectedSet.has(day));

    const isMatching = missingDays.length === 0 && extraDays.length === 0;

    const summary = isMatching 
      ? `✅ Data sesuai dengan rentang tanggal (${expectedDays.length} hari)`
      : `⚠️ Data tidak sesuai: ${missingDays.length} hari hilang, ${extraDays.length} hari ekstra`;

    logger.info(`📊 Data-date verification (${context}):`, {
      isMatching,
      expectedCount: expectedDays.length,
      actualCount: actualDays.length,
      missingCount: missingDays.length,
      extraCount: extraDays.length,
      summary
    });

    return {
      isMatching,
      expectedDays,
      actualDays,
      missingDays,
      extraDays,
      summary
    };

  } catch (error) {
    logger.error(`❌ Date verification error (${context}):`, error);
    return {
      isMatching: false,
      expectedDays: [],
      actualDays: actualDataDates.sort(),
      missingDays: [],
      extraDays: [],
      summary: `Error verification: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Quick utility to check if user-selected date matches displayed data
 */
export function validateSelectedDateVsDisplayedData(
  userSelectedDate: any,
  displayedPeriod: string,
  context: string = 'ui-consistency'
): boolean {
  try {
    const validation = validateProfitAnalysisDate(userSelectedDate, context);
    if (!validation.isValid || !validation.normalizedDate) {
      return false;
    }

    const normalizedUserDate = validation.normalizedDate;
    const isMatching = normalizedUserDate === displayedPeriod;

    logger.debug(`🔍 UI consistency check (${context}): user=${normalizedUserDate}, displayed=${displayedPeriod}, match=${isMatching}`);

    return isMatching;

  } catch (error) {
    logger.error(`❌ UI consistency check error (${context}):`, error);
    return false;
  }
}

export default {
  validateProfitAnalysisDate,
  validateProfitAnalysisDateRange,
  verifyDataMatchesDateSelection,
  validateSelectedDateVsDisplayedData
};
