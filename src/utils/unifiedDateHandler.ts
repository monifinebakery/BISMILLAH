// ✅ UNIFIED DATE HANDLER - Consistent date handling across all modules
// src/utils/unifiedDateHandler.ts

import { logger } from '@/utils/logger';

/**
 * Comprehensive date handling utilities for BISMILLAH project
 * Ensures consistency across Recipe, Purchase, Warehouse, and Profit Analysis modules
 */

// ✅ STANDARD DATE FORMAT CONSTANTS
export const DATE_FORMATS = {
  DATABASE: 'YYYY-MM-DD',           // For database storage
  DATABASE_TIMESTAMP: 'YYYY-MM-DDTHH:mm:ss.sssZ', // Full timestamp
  DISPLAY: 'DD/MM/YYYY',           // For UI display
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm', // UI with time
  API: 'YYYY-MM-DD',               // For API calls
  PERIOD: 'YYYY-MM',               // For period analysis (profit, reports)
  FILENAME: 'YYYY-MM-DD_HH-mm-ss' // For file exports
} as const;

// ✅ TIMEZONE CONFIGURATION
export const TIMEZONE_CONFIG = {
  DEFAULT: 'Asia/Jakarta',         // Default timezone for Indonesia
  UTC: 'UTC'                      // For database storage
} as const;

/**
 * Enhanced date validation with detailed error reporting
 */
export interface DateValidationResult {
  isValid: boolean;
  date?: Date;
  error?: string;
  warnings: string[];
}

/**
 * Date range interface for consistent period handling
 */
export interface DateRange {
  start: Date;
  end: Date;
  period?: string; // For caching/identification
}

/**
 * ✅ CORE DATE UTILITIES
 */
export class UnifiedDateHandler {
  /**
   * Safe date parsing with comprehensive validation
   */
  static parseDate(input: any): DateValidationResult {
    const warnings: string[] = [];
    
    if (!input) {
      return {
        isValid: false,
        error: 'Date input is null or undefined',
        warnings
      };
    }

    try {
      let date: Date;
      
      if (input instanceof Date) {
        date = new Date(input);
      } else if (typeof input === 'string') {
        // Handle various string formats
        if (input.includes('T') && input.includes('Z')) {
          // ISO string format
          date = new Date(input);
        } else if (input.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // YYYY-MM-DD format
          date = new Date(input + 'T00:00:00.000Z');
        } else if (input.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // DD/MM/YYYY format
          const [day, month, year] = input.split('/');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Let Date constructor handle it
          date = new Date(input);
          warnings.push('Non-standard date format detected');
        }
      } else if (typeof input === 'number') {
        date = new Date(input);
      } else {
        return {
          isValid: false,
          error: `Unsupported date type: ${typeof input}`,
          warnings
        };
      }

      // Validate the parsed date
      if (isNaN(date.getTime())) {
        return {
          isValid: false,
          error: 'Invalid date value',
          warnings
        };
      }

      // Check for reasonable date ranges
      const minYear = 2020; // Business started
      const maxYear = new Date().getFullYear() + 10;
      
      if (date.getFullYear() < minYear) {
        warnings.push(`Date is before business start year (${minYear})`);
      } else if (date.getFullYear() > maxYear) {
        warnings.push(`Date is too far in the future (>${maxYear})`);
      }

      return {
        isValid: true,
        date,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        warnings
      };
    }
  }

  /**
   * Format date for database storage (consistent UTC)
   */
  static toDatabaseString(date: Date | string | null): string | null {
    if (!date) return null;
    
    const parseResult = this.parseDate(date);
    if (!parseResult.isValid || !parseResult.date) {
      logger.warn('Failed to format date for database:', parseResult.error);
      return null;
    }

    return parseResult.date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Format date for database timestamp (full ISO string)
   */
  static toDatabaseTimestamp(date: Date | string | null): string | null {
    if (!date) return null;
    
    const parseResult = this.parseDate(date);
    if (!parseResult.isValid || !parseResult.date) {
      logger.warn('Failed to format timestamp for database:', parseResult.error);
      return null;
    }

    return parseResult.date.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ
  }

  /**
   * Format date for UI display (localized)
   */
  static toDisplayString(date: Date | string | null, includeTime: boolean = false): string {
    if (!date) return '-';
    
    const parseResult = this.parseDate(date);
    if (!parseResult.isValid || !parseResult.date) {
      logger.warn('Failed to format date for display:', parseResult.error);
      return 'Invalid Date';
    }

    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: TIMEZONE_CONFIG.DEFAULT
      };

      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }

      return new Intl.DateTimeFormat('id-ID', options)
        .format(parseResult.date);
    } catch (error) {
      logger.error('Error formatting date for display:', error);
      return parseResult.date.toLocaleDateString();
    }
  }

  /**
   * Format date for period analysis (YYYY-MM)
   */
  static toPeriodString(date: Date | string | null): string | null {
    if (!date) return null;
    
    const parseResult = this.parseDate(date);
    if (!parseResult.isValid || !parseResult.date) {
      logger.warn('Failed to format date for period:', parseResult.error);
      return null;
    }

    const year = parseResult.date.getFullYear();
    const month = String(parseResult.date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Format date for filename (safe characters)
   */
  static toFilenameString(date: Date | string | null): string {
    if (!date) return 'unknown-date';
    
    const parseResult = this.parseDate(date);
    if (!parseResult.isValid || !parseResult.date) {
      return 'invalid-date';
    }

    return parseResult.date.toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .split('T')[0] + '_' + 
      parseResult.date.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  }

  /**
   * Create date range for period analysis
   */
  static createDateRange(
    start: Date | string | null, 
    end: Date | string | null
  ): DateRange | null {
    const startResult = this.parseDate(start);
    const endResult = this.parseDate(end);

    if (!startResult.isValid || !endResult.isValid) {
      logger.warn('Failed to create date range:', {
        startError: startResult.error,
        endError: endResult.error
      });
      return null;
    }

    if (!startResult.date || !endResult.date) return null;

    // Ensure start is before end
    if (startResult.date > endResult.date) {
      logger.warn('Date range: start is after end, swapping dates');
      [startResult.date, endResult.date] = [endResult.date, startResult.date];
    }

    const period = `${this.toDatabaseString(startResult.date)}_${this.toDatabaseString(endResult.date)}`;

    return {
      start: startResult.date,
      end: endResult.date,
      period
    };
  }

  /**
   * Get current period string (for profit analysis, reports)
   */
  static getCurrentPeriod(): string {
    const now = new Date();
    return this.toPeriodString(now) || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get start and end of current month
   */
  static getCurrentMonthRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return {
      start,
      end,
      period: this.getCurrentPeriod()
    };
  }

  /**
   * Get start and end of specific period
   */
  static getPeriodRange(period: string): DateRange | null {
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      logger.warn('Invalid period format:', period);
      return null;
    }

    const [, year, month] = match;
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    return {
      start,
      end,
      period
    };
  }

  /**
   * Compare two dates safely
   */
  static compareDates(
    date1: Date | string | null, 
    date2: Date | string | null
  ): number {
    const result1 = this.parseDate(date1);
    const result2 = this.parseDate(date2);

    if (!result1.isValid && !result2.isValid) return 0;
    if (!result1.isValid) return -1;
    if (!result2.isValid) return 1;

    if (!result1.date || !result2.date) return 0;

    return result1.date.getTime() - result2.date.getTime();
  }

  /**
   * Check if date is in range
   */
  static isDateInRange(
    date: Date | string | null,
    range: DateRange
  ): boolean {
    const dateResult = this.parseDate(date);
    if (!dateResult.isValid || !dateResult.date) return false;

    return dateResult.date >= range.start && dateResult.date <= range.end;
  }

  /**
   * Generate date list for a range (useful for charts, analysis)
   */
  static generateDateList(
    start: Date | string | null,
    end: Date | string | null,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Date[] {
    const range = this.createDateRange(start, end);
    if (!range) return [];

    const dates: Date[] = [];
    const current = new Date(range.start);

    while (current <= range.end) {
      dates.push(new Date(current));
      
      switch (granularity) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return dates;
  }

  /**
   * Calculate age/duration from date
   */
  static calculateAge(
    fromDate: Date | string | null,
    toDate: Date | string | null = new Date()
  ): {
    days: number;
    weeks: number;
    months: number;
    years: number;
  } {
    const range = this.createDateRange(fromDate, toDate);
    if (!range) {
      return { days: 0, weeks: 0, months: 0, years: 0 };
    }

    const diffMs = range.end.getTime() - range.start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    return { days, weeks, months, years };
  }

  /**
   * Validate date range for business logic
   */
  static validateDateRange(
    start: Date | string | null,
    end: Date | string | null,
    maxRangeDays: number = 365
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const range = this.createDateRange(start, end);
    if (!range) {
      errors.push('Invalid date range');
      return { isValid: false, errors, warnings };
    }

    // Check range duration
    const duration = this.calculateAge(range.start, range.end);
    if (duration.days > maxRangeDays) {
      warnings.push(`Date range is longer than ${maxRangeDays} days`);
    }

    // Check if dates are in future
    const now = new Date();
    if (range.start > now) {
      warnings.push('Start date is in the future');
    }
    if (range.end > now) {
      warnings.push('End date is in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ✅ CONVENIENCE FUNCTIONS FOR BACKWARD COMPATIBILITY
export const parseDate = UnifiedDateHandler.parseDate;
export const formatDateForDB = UnifiedDateHandler.toDatabaseString;
export const formatDateForDisplay = UnifiedDateHandler.toDisplayString;
export const getCurrentPeriod = UnifiedDateHandler.getCurrentPeriod;
export const createDateRange = UnifiedDateHandler.createDateRange;
export const compareDates = UnifiedDateHandler.compareDates;

// ✅ LEGACY COMPATIBILITY - map to existing functions where used
export const safeParseDate = (input: any): Date | null => {
  const result = UnifiedDateHandler.parseDate(input);
  return result.isValid ? result.date || null : null;
};

export const normalizeDateForDatabase = (input: any): string => {
  return UnifiedDateHandler.toDatabaseString(input) || new Date().toISOString().split('T')[0];
};

export const normalizeDateRange = (start: any, end: any) => {
  return UnifiedDateHandler.createDateRange(start, end);
};

// ✅ SPECIALIZED FUNCTIONS FOR MODULES

/**
 * Recipe module date utilities
 */
export const RecipeDateUtils = {
  formatCreatedAt: (date: Date | string | null) => 
    UnifiedDateHandler.toDisplayString(date, true),
  
  formatUpdatedAt: (date: Date | string | null) => 
    UnifiedDateHandler.toDisplayString(date, true),
    
  isRecipeRecent: (createdAt: Date | string | null, days: number = 7) => {
    const age = UnifiedDateHandler.calculateAge(createdAt);
    return age.days <= days;
  }
};

/**
 * Purchase module date utilities
 */
export const PurchaseDateUtils = {
  formatPurchaseDate: (date: Date | string | null) =>
    UnifiedDateHandler.toDisplayString(date),
    
  toPurchaseTimestamp: (date: Date | string | null) =>
    UnifiedDateHandler.toDatabaseTimestamp(date),
    
  isPurchaseInPeriod: (purchaseDate: Date | string | null, period: string) => {
    const range = UnifiedDateHandler.getPeriodRange(period);
    return range ? UnifiedDateHandler.isDateInRange(purchaseDate, range) : false;
  }
};

/**
 * Warehouse module date utilities
 */
export const WarehouseDateUtils = {
  formatExpiryDate: (date: Date | string | null) =>
    UnifiedDateHandler.toDisplayString(date),
    
  checkExpiry: (expiryDate: Date | string | null, warningDays: number = 30) => {
    if (!expiryDate) return { isExpired: false, willExpire: false, daysUntilExpiry: null };
    
    const now = new Date();
    const age = UnifiedDateHandler.calculateAge(now, expiryDate);
    
    return {
      isExpired: age.days < 0,
      willExpire: age.days <= warningDays && age.days >= 0,
      daysUntilExpiry: age.days
    };
  },
  
  formatLastUpdated: (date: Date | string | null) =>
    UnifiedDateHandler.toDisplayString(date, true)
};

/**
 * Profit Analysis module date utilities
 */
export const ProfitAnalysisDateUtils = {
  formatAnalysisDate: (date: Date | string | null) =>
    UnifiedDateHandler.toDisplayString(date),
    
  createAnalysisPeriod: (date: Date | string | null) =>
    UnifiedDateHandler.toPeriodString(date),
    
  getMonthlyRange: (year: number, month: number): DateRange => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const period = `${year}-${String(month).padStart(2, '0')}`;
    
    return { start, end, period };
  },
  
  getQuarterlyRange: (year: number, quarter: number): DateRange => {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    const period = `${year}-Q${quarter}`;
    
    return { start, end, period };
  },
  
  /**
   * Normalize date range for profit analysis (compatible with legacy format)
   * Returns format expected by profit analysis calculations
   */
  normalizeDateRange: (from: Date, to: Date) => {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    
    return {
      startDate,
      endDate,
      startYMD: UnifiedDateHandler.toDatabaseString(startDate) || '',
      endYMD: UnifiedDateHandler.toDatabaseString(endDate) || ''
    };
  }
};

export default UnifiedDateHandler;
