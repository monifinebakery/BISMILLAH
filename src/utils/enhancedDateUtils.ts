// src/utils/enhancedDateUtils.ts  
// Enhanced date utilities to replace all problematic new Date() calls
// Ensures consistent timezone handling across the entire application

import { parsePostgresTimestamp } from '@/utils/timestampUtils';

/**
 * Enhanced date creation with timezone awareness
 * Replaces all new Date() calls in critical business logic
 */
export class EnhancedDate {
  
  /**
   * Get current date/time with proper timezone handling
   * Replaces: new Date()
   */
  static now(): Date {
    return new Date(); // Will be displayed in local timezone
  }

  /**
   * Get current date/time as timestamptz string for database
   * Use this for database operations
   */
  static nowAsTimestamptz(): string {
    return new Date().toISOString();
  }

  /**
   * Create date from business input (forms, user input)
   * Handles various input formats safely
   */
  static fromInput(input: any): Date | null {
    return parsePostgresTimestamp(input);
  }

  /**
   * Create date for business calculations
   * Ensures consistency for financial, order, and inventory calculations
   */
  static forBusiness(year?: number, month?: number, day?: number): Date {
    if (year !== undefined && month !== undefined && day !== undefined) {
      // Create date at start of day in local timezone
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    return new Date();
  }

  /**
   * Get start of day for date comparisons
   * Replaces: new Date(today.getFullYear(), today.getMonth(), today.getDate())
   */
  static startOfDay(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  /**
   * Get end of day for date comparisons
   */
  static endOfDay(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  /**
   * Get start of week (Sunday = 0)
   * Replaces problematic week calculations
   */
  static startOfWeek(date: Date = new Date()): Date {
    const startOfDay = this.startOfDay(date);
    const dayOfWeek = startOfDay.getDay();
    const daysToSubtract = dayOfWeek;
    return new Date(startOfDay.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
  }

  /**
   * Get start of month
   * Replaces: new Date(today.getFullYear(), today.getMonth(), 1)
   */
  static startOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  /**
   * Get end of month
   */
  static endOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  /**
   * Safe date comparison - handles both Date objects and timestamp strings
   */
  static compare(date1: any, date2: any): number {
    const d1 = this.fromInput(date1);
    const d2 = this.fromInput(date2);
    
    if (!d1 || !d2) return 0;
    
    return d1.getTime() - d2.getTime();
  }

  /**
   * Check if date is today
   */
  static isToday(date: any): boolean {
    const inputDate = this.fromInput(date);
    if (!inputDate) return false;

    const today = this.startOfDay();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    return inputDate >= today && inputDate < tomorrow;
  }

  /**
   * Check if date is within current week
   */
  static isThisWeek(date: any): boolean {
    const inputDate = this.fromInput(date);
    if (!inputDate) return false;

    const startOfWeek = this.startOfWeek();
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return inputDate >= startOfWeek && inputDate < endOfWeek;
  }

  /**
   * Check if date is within current month  
   */
  static isThisMonth(date: any): boolean {
    const inputDate = this.fromInput(date);
    if (!inputDate) return false;

    const startOfMonth = this.startOfMonth();
    const endOfMonth = this.endOfMonth();
    
    return inputDate >= startOfMonth && inputDate <= endOfMonth;
  }

  /**
   * Format for display with consistent timezone handling
   */
  static toDisplayString(date: any, options: {
    includeTime?: boolean;
    locale?: string;
  } = {}): string {
    const parsedDate = this.fromInput(date);
    if (!parsedDate) return '-';

    const {
      includeTime = false,
      locale = 'id-ID'
    } = options;

    try {
      const formatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Jakarta'
      };

      if (includeTime) {
        formatOptions.hour = '2-digit';
        formatOptions.minute = '2-digit';
      }

      return new Intl.DateTimeFormat(locale, formatOptions).format(parsedDate);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return parsedDate.toLocaleDateString();
    }
  }

  /**
   * Format for database storage
   */
  static toDatabaseString(date: any): string | null {
    const parsedDate = this.fromInput(date);
    if (!parsedDate) return null;
    
    return parsedDate.toISOString();
  }

  /**
   * Create date range for queries
   */
  static createRange(from?: any, to?: any): { from: Date; to: Date } {
    const fromDate = from ? this.fromInput(from) : this.startOfMonth();
    const toDate = to ? this.fromInput(to) : this.endOfDay();

    return {
      from: fromDate || this.startOfMonth(),
      to: toDate || this.endOfDay()
    };
  }

  /**
   * Add days to date safely
   */
  static addDays(date: any, days: number): Date {
    const parsedDate = this.fromInput(date) || this.now();
    return new Date(parsedDate.getTime() + (days * 24 * 60 * 60 * 1000));
  }

  /**
   * Add months to date safely
   */
  static addMonths(date: any, months: number): Date {
    const parsedDate = this.fromInput(date) || this.now();
    const result = new Date(parsedDate);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Get relative time description (Indonesian)
   */
  static toRelativeString(date: any): string {
    const parsedDate = this.fromInput(date);
    if (!parsedDate) return 'Tanggal tidak valid';

    const now = this.now();
    const diffInMs = now.getTime() - parsedDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Baru saja';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    } else if (diffInDays === 1) {
      return 'Kemarin';
    } else if (diffInDays < 7) {
      return `${diffInDays} hari yang lalu`;
    } else {
      return this.toDisplayString(parsedDate);
    }
  }

  /**
   * Filter array of objects by date field within range
   */
  static filterByDateRange<T>(
    items: T[], 
    range: { from: Date; to: Date }, 
    dateField: keyof T
  ): T[] {
    return items.filter(item => {
      const itemDate = this.fromInput(item[dateField]);
      if (!itemDate) return false;
      
      return itemDate >= range.from && itemDate <= range.to;
    });
  }

  /**
   * Group items by date period (day, week, month)
   */
  static groupByPeriod<T>(
    items: T[], 
    dateField: keyof T,
    period: 'day' | 'week' | 'month' = 'month'
  ): Record<string, T[]> {
    return items.reduce((groups: Record<string, T[]>, item) => {
      const itemDate = this.fromInput(item[dateField]);
      if (!itemDate) return groups;

      let key: string;
      switch (period) {
        case 'day':
          key = itemDate.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = this.startOfWeek(itemDate);
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
        default:
          key = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);

      return groups;
    }, {});
  }
}

// Export common date utilities as functions for easier migration
export const {
  now: dateNow,
  nowAsTimestamptz: dateNowAsTimestamptz,
  fromInput: dateFromInput,
  forBusiness: dateForBusiness,
  startOfDay: dateStartOfDay,
  endOfDay: dateEndOfDay,
  startOfWeek: dateStartOfWeek,
  startOfMonth: dateStartOfMonth,
  endOfMonth: dateEndOfMonth,
  compare: dateCompare,
  isToday: dateIsToday,
  isThisWeek: dateIsThisWeek,
  isThisMonth: dateIsThisMonth,
  toDisplayString: dateToDisplayString,
  toDatabaseString: dateToDatabaseString,
  createRange: dateCreateRange,
  addDays: dateAddDays,
  addMonths: dateAddMonths,
  toRelativeString: dateToRelativeString,
  filterByDateRange: dateFilterByDateRange,
  groupByPeriod: dateGroupByPeriod
} = EnhancedDate;
