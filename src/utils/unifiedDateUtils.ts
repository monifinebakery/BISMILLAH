// utils/unifiedDateUtils.ts - UNIFIED DATE SOLUTION (Clean Version)
// This replaces dashboardUtils, dateUtils, and all other date implementations

import { 
  parseISO, 
  format, 
  isValid, 
  startOfDay, 
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths
} from 'date-fns';
import { id } from 'date-fns/locale';

// ==================== CORE TYPES ====================

export interface DateRange {
  from: Date | string;
  to?: Date | string;
}

export interface DateRangePreset {
  label: string;
  range: {
    from: Date;
    to: Date;
  };
}

// ==================== CORE DATE UTILITIES ====================

/**
 * Ultimate safe date parser - handles all possible inputs
 */
export const safeParseDate = (date: any): Date | null => {
  if (!date) {
    return null;
  }
  
  try {
    // Handle Date objects
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        return null;
      }
      const isDateValid = isValid(date);
      return isDateValid ? date : null;
    }
    
    // Handle string inputs
    if (typeof date === 'string') {
      const cleanDate = date.trim();
      
      // Handle empty or invalid strings
      if (!cleanDate || 
          cleanDate === 'null' || 
          cleanDate === 'undefined' ||
          cleanDate === '0000-00-00' || 
          cleanDate === '0000-00-00T00:00:00.000Z') {
        return null;
      }
      
      // Try parseISO first for ISO strings
      if (cleanDate.includes('T') || cleanDate.includes('-')) {
        try {
          const parsed = parseISO(cleanDate);
          if (isValid(parsed) && !isNaN(parsed.getTime()) && parsed.getTime() > 0) {
            return parsed;
          }
        } catch (parseISOError) {
          // Silent fail, try next method
        }
      }
      
      // Fallback to new Date()
      try {
        const parsed = new Date(cleanDate);
        if (isValid(parsed) && !isNaN(parsed.getTime()) && parsed.getTime() > 0) {
          return parsed;
        }
      } catch (newDateError) {
        // Silent fail
      }
    }
    
    // Handle number inputs (timestamps)
    if (typeof date === 'number') {
      try {
        const parsed = new Date(date);
        if (isValid(parsed) && !isNaN(parsed.getTime()) && parsed.getTime() > 0) {
          return parsed;
        }
      } catch (timestampError) {
        // Silent fail
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Critical error in safeParseDate:', error);
    return null;
  }
};

/**
 * Comprehensive date validation
 */
export const isValidDate = (value: any): value is Date => {
  if (!value) {
    return false;
  }
  
  try {
    // If it's already a Date object, validate directly
    if (value instanceof Date) {
      const valid = isValid(value) && !isNaN(value.getTime()) && value.getTime() > 0;
      return valid;
    }
    
    // Otherwise, try to parse it first
    const date = safeParseDate(value);
    const valid = date !== null && isValid(date) && !isNaN(date.getTime());
    return valid;
  } catch (error) {
    return false;
  }
};

/**
 * Safe ISO string conversion for database storage
 */
export const toSafeISOString = (dateValue: Date | string | null | undefined): string | null => {
  try {
    const dateObj = safeParseDate(dateValue);
    if (!dateObj || !isValidDate(dateObj)) {
      return null;
    }
    
    const isoString = format(dateObj, 'yyyy-MM-dd');
    return isoString;
  } catch (error) {
    console.error('ISO conversion error:', error);
    return null;
  }
};

// ==================== DISPLAY FORMATTING ====================

/**
 * Format date for display in UI
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  try {
    const dateObj = safeParseDate(date);
    if (!dateObj || !isValidDate(dateObj)) {
      return '-';
    }
    
    const formatted = format(dateObj, 'd MMM yyyy', { locale: id });
    return formatted;
  } catch (error) {
    return '-';
  }
};

/**
 * Format date with time for detailed display
 */
export const formatDateTime = (date: any): string => {
  if (!date) {
    return 'Waktu tidak valid';
  }
  
  try {
    const dateObj = safeParseDate(date);
    
    if (!dateObj || !isValidDate(dateObj)) {
      return 'Waktu tidak valid';
    }
    
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
    }).format(dateObj);
    
    return formatted;
  } catch (error) {
    return 'Waktu tidak valid';
  }
};

/**
 * Format date range for UI display
 */
export const formatDateRange = (dateRange: DateRange | undefined): string => {
  try {
    if (!dateRange) {
      return "Pilih rentang tanggal";
    }

    if (!dateRange.from) {
      return "Pilih rentang tanggal";
    }
    
    const fromDate = safeParseDate(dateRange.from);
    if (!fromDate || !isValidDate(fromDate)) {
      return "Tanggal mulai tidak valid";
    }
    
    // Single date case
    if (!dateRange.to) {
      try {
        const formatted = format(fromDate, "d MMMM yyyy", { locale: id });
        return formatted;
      } catch (formatError) {
        return fromDate.toLocaleDateString('id-ID');
      }
    }
    
    const toDate = safeParseDate(dateRange.to);
    if (!toDate || !isValidDate(toDate)) {
      try {
        return format(fromDate, "d MMMM yyyy", { locale: id });
      } catch (formatError) {
        return fromDate.toLocaleDateString('id-ID');
      }
    }
    
    // Date range formatting
    try {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');
      
      if (fromStr === toStr) {
        const formatted = format(fromDate, "d MMMM yyyy", { locale: id });
        return formatted;
      }
      
      const rangeFormatted = `${format(fromDate, "d MMM", { locale: id })} - ${format(toDate, "d MMM yyyy", { locale: id })}`;
      return rangeFormatted;
      
    } catch (formatError) {
      // Ultra-safe fallback
      try {
        const fromNative = fromDate.toLocaleDateString('id-ID');
        const toNative = toDate.toLocaleDateString('id-ID');
        return fromNative === toNative ? fromNative : `${fromNative} - ${toNative}`;
      } catch (nativeError) {
        return "Error formatting tanggal";
      }
    }
    
  } catch (error) {
    console.error('Critical error in formatDateRange:', error);
    return "Error: Tanggal tidak valid";
  }
};

/**
 * Format date for HTML input (YYYY-MM-DD)
 */
export const formatDateToYYYYMMDD = (date: Date | string | null | undefined): string => {
  try {
    const dateObj = safeParseDate(date);
    if (!dateObj || !isValidDate(dateObj)) {
      return '';
    }
    
    const formatted = format(dateObj, 'yyyy-MM-dd');
    return formatted;
  } catch (error) {
    return '';
  }
};

// ==================== DATE RANGE PRESETS ====================

/**
 * Generate date range preset by key
 */
export const getDateRangePreset = (key: string): { from: Date, to: Date } => {
  const today = new Date();
  
  if (!isValidDate(today)) {
    console.error('System date is invalid!');
    const fallbackDate = new Date('2025-01-01');
    return { from: fallbackDate, to: fallbackDate };
  }
  
  try {
    switch (key) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
        
      case 'yesterday': {
        const yesterday = subDays(today, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      }
      
      case 'last7days':
        return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
        
      case 'last30days':
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
        
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
        
      case 'lastMonth': {
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      }
      
      default:
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    }
  } catch (error) {
    console.error('Error creating preset:', error);
    return { from: startOfDay(today), to: endOfDay(today) };
  }
};

/**
 * Get all available date presets
 */
export const getDatePresets = (): DateRangePreset[] => {
  try {
    const presetKeys = ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth'];
    const labels = ["Hari Ini", "Kemarin", "7 Hari Terakhir", "30 Hari Terakhir", "Bulan Ini", "Bulan Lalu"];
    
    return presetKeys.map((key, index) => {
      try {
        return {
          label: labels[index],
          range: getDateRangePreset(key)
        };
      } catch (error) {
        console.error('Error generating preset:', key, error);
        return {
          label: `Error - ${labels[index]}`,
          range: getDateRangePreset('today')
        };
      }
    });
  } catch (error) {
    console.error('Error generating date presets:', error);
    return [{
      label: "Hari Ini",
      range: getDateRangePreset('today')
    }];
  }
};

/**
 * Get date preset by key with fallback
 */
export const getDatePresetByKey = (key: string): { from: Date; to: Date } => {
  try {
    if (!key || typeof key !== 'string') {
      return getDateRangePreset('today');
    }
    return getDateRangePreset(key);
  } catch (error) {
    console.error('Error getting preset:', error);
    return getDateRangePreset('today');
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if date is in range
 */
export const isDateInRange = (
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean => {
  try {
    const targetDate = safeParseDate(date);
    const rangeStart = safeParseDate(startDate);
    const rangeEnd = safeParseDate(endDate);
    
    if (!targetDate || !rangeStart || !rangeEnd) {
      return false;
    }
    
    if (!isValidDate(targetDate) || !isValidDate(rangeStart) || !isValidDate(rangeEnd)) {
      return false;
    }
    
    const result = targetDate >= rangeStart && targetDate <= rangeEnd;
    return result;
  } catch (error) {
    return false;
  }
};

/**
 * Calculate days between dates
 */
export const getDaysBetween = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number => {
  try {
    const start = safeParseDate(startDate);
    const end = safeParseDate(endDate);
    
    if (!start || !end || !isValidDate(start) || !isValidDate(end)) {
      return 0;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days;
  } catch (error) {
    return 0;
  }
};

/**
 * Get start of day
 */
export const getStartOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  try {
    const parsed = safeParseDate(dateObj);
    const result = parsed && isValidDate(parsed) ? startOfDay(parsed) : null;
    return result;
  } catch (error) {
    return null;
  }
};

/**
 * Get end of day
 */
export const getEndOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  try {
    const parsed = safeParseDate(dateObj);
    const result = parsed && isValidDate(parsed) ? endOfDay(parsed) : null;
    return result;
  } catch (error) {
    return null;
  }
};

/**
 * Get relative time description
 */
export const getRelativeTimeDescription = (date: Date | string | null | undefined): string => {
  try {
    const parsedDate = safeParseDate(date);
    if (!parsedDate || !isValidDate(parsedDate)) {
      return 'Tanggal tidak valid';
    }
    
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (format(now, 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Hari ini';
    if (format(subDays(now, 1), 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Kemarin';

    if (diffDays > 1 && diffDays <= 30) return `${diffDays} hari yang lalu`;
    
    return formatDateForDisplay(parsedDate);
  } catch (error) {
    return 'Tanggal tidak valid';
  }
};

// ==================== ALIASES FOR COMPATIBILITY ====================

export const parseDate = safeParseDate;
export const toISOString = toSafeISOString;
export const formatDate = formatDateForDisplay;
export const formatRelativeTime = getRelativeTimeDescription;

// ==================== ORGANIZED EXPORTS ====================

export const DateUtils = {
  safeParseDate,
  parseDate,
  isValidDate,
  toSafeISOString,
  toISOString,
  formatDateForDisplay,
  formatDate,
  formatDateTime,
  formatDateToYYYYMMDD,
  formatDateRange,
  getRelativeTimeDescription,
  formatRelativeTime,
  isDateInRange,
  getDaysBetween,
  getStartOfDay,
  getEndOfDay
};

export const DatePresetUtils = {
  getDateRangePreset,
  getDatePresets,
  getDatePresetByKey
};

// ==================== GLOBAL EXPOSURE FOR DEBUGGING (Optional) ====================

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).unifiedDateUtils = {
    safeParseDate,
    parseDate,
    isValidDate,
    formatDateRange,
    getDateRangePreset,
    getDatePresets,
    formatDateForDisplay,
    isDateInRange,
    getDaysBetween,
    DateUtils,
    DatePresetUtils
  };
}

export default DateUtils;