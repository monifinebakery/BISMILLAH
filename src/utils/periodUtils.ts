// src/utils/periodUtils.ts - Centralized Period Handling Utilities

import { logger } from '@/utils/logger';

export type PeriodFormat = 'daily' | 'monthly' | 'yearly' | 'invalid';

export interface PeriodInfo {
  period: string;
  format: PeriodFormat;
  year: number;
  month?: number;
  day?: number;
  isValid: boolean;
}

/**
 * ✅ UTILITY: Detect period format safely
 */
export function detectPeriodFormat(period: string): PeriodFormat {
  if (!period || typeof period !== 'string') return 'invalid';
  
  try {
    const parts = period.split('-');
    
    if (parts.length === 1 && /^\d{4}$/.test(period)) {
      return 'yearly';
    }
    
    if (parts.length === 2 && /^\d{4}-\d{2}$/.test(period)) {
      return 'monthly';
    }
    
    if (parts.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(period)) {
      return 'daily';
    }
    
    return 'invalid';
  } catch (error) {
    return 'invalid';
  }
}

/**
 * ✅ UTILITY: Parse period with comprehensive validation
 */
export function parsePeriod(period: string): PeriodInfo {
  const format = detectPeriodFormat(period);
  
  if (format === 'invalid') {
    return {
      period,
      format: 'invalid',
      year: 0,
      isValid: false
    };
  }
  
  try {
    const parts = period.split('-').map(p => parseInt(p, 10));
    
    switch (format) {
      case 'yearly':
        return {
          period,
          format,
          year: parts[0],
          isValid: parts[0] >= 2000 && parts[0] <= 2100
        };
        
      case 'monthly':
        return {
          period,
          format,
          year: parts[0],
          month: parts[1],
          isValid: parts[0] >= 2000 && parts[0] <= 2100 && 
                  parts[1] >= 1 && parts[1] <= 12
        };
        
      case 'daily': {
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        const isValidDate = date.getFullYear() === parts[0] &&
                           date.getMonth() === parts[1] - 1 &&
                           date.getDate() === parts[2];

        return {
          period,
          format,
          year: parts[0],
          month: parts[1],
          day: parts[2],
          isValid: isValidDate && parts[0] >= 2000 && parts[0] <= 2100
        };
      }
        
      default:
        return {
          period,
          format: 'invalid',
          year: 0,
          isValid: false
        };
    }
  } catch (error) {
    logger.warn('Error parsing period:', period, error);
    return {
      period,
      format: 'invalid',
      year: 0,
      isValid: false
    };
  }
}

/**
 * ✅ STANDARDIZED: Safe period sorting with robust error handling
 */
export function safeSortPeriods(periods: string[]): string[] {
  if (!Array.isArray(periods)) return [];
  
  return periods.sort((a, b) => {
    try {
      const periodA = parsePeriod(a);
      const periodB = parsePeriod(b);
      
      // Handle invalid periods - put them at the end
      if (!periodA.isValid && !periodB.isValid) {
        return a.localeCompare(b);
      }
      if (!periodA.isValid) return 1;
      if (!periodB.isValid) return -1;
      
      // Handle different formats - prioritize by format hierarchy
      const formatPriority = { daily: 3, monthly: 2, yearly: 1, invalid: 0 };
      const priorityDiff = formatPriority[periodA.format] - formatPriority[periodB.format];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Same format - compare chronologically
      if (periodA.format === 'daily' && periodB.format === 'daily') {
        // Use Date object for accurate daily comparison
        const dateA = new Date(periodA.year, (periodA.month || 1) - 1, periodA.day || 1);
        const dateB = new Date(periodB.year, (periodB.month || 1) - 1, periodB.day || 1);
        return dateA.getTime() - dateB.getTime();
      }
      
      // Year comparison first
      if (periodA.year !== periodB.year) {
        return periodA.year - periodB.year;
      }
      
      // Month comparison (if applicable)
      if (periodA.month && periodB.month && periodA.month !== periodB.month) {
        return periodA.month - periodB.month;
      }
      
      // Day comparison (if applicable)
      if (periodA.day && periodB.day) {
        return periodA.day - periodB.day;
      }
      
      return 0;
      
    } catch (error) {
      logger.warn('Period sorting fallback for:', a, b, error);
      return a.localeCompare(b);
    }
  });
}

/**
 * ✅ UTILITY: Validate period sequence for data consistency
 */
export function validatePeriodSequence(periods: string[]): {
  isValid: boolean;
  issues: string[];
  sortedPeriods: string[];
} {
  const issues: string[] = [];
  const sortedPeriods = safeSortPeriods(periods);
  
  // Check for format consistency
  const formats = periods.map(p => detectPeriodFormat(p));
  const uniqueFormats = [...new Set(formats)];
  
  if (uniqueFormats.length > 1) {
    issues.push(`Mixed period formats detected: ${uniqueFormats.join(', ')}`);
  }
  
  if (uniqueFormats.includes('invalid')) {
    const invalidPeriods = periods.filter(p => detectPeriodFormat(p) === 'invalid');
    issues.push(`Invalid period formats: ${invalidPeriods.join(', ')}`);
  }
  
  // Check for chronological order
  const originalOrder = periods.join(',');
  const sortedOrder = sortedPeriods.join(',');
  
  if (originalOrder !== sortedOrder) {
    issues.push('Periods are not in chronological order');
  }
  
  // Check for gaps in sequence (for monthly/daily data)
  if (uniqueFormats.length === 1 && uniqueFormats[0] === 'monthly') {
    const gaps = findMonthlyGaps(sortedPeriods);
    if (gaps.length > 0) {
      issues.push(`Missing periods: ${gaps.join(', ')}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    sortedPeriods
  };
}

/**
 * ✅ UTILITY: Find gaps in monthly period sequence
 */
function findMonthlyGaps(sortedPeriods: string[]): string[] {
  const gaps: string[] = [];
  
  if (sortedPeriods.length < 2) return gaps;
  
  for (let i = 1; i < sortedPeriods.length; i++) {
    const prevPeriod = parsePeriod(sortedPeriods[i - 1]);
    const currPeriod = parsePeriod(sortedPeriods[i]);
    
    if (prevPeriod.isValid && currPeriod.isValid && 
        prevPeriod.format === 'monthly' && currPeriod.format === 'monthly') {
      
      const prevDate = new Date(prevPeriod.year, (prevPeriod.month || 1) - 1);
      const currDate = new Date(currPeriod.year, (currPeriod.month || 1) - 1);
      
      // Calculate expected next month
      const expectedDate = new Date(prevDate);
      expectedDate.setMonth(expectedDate.getMonth() + 1);
      
      while (expectedDate < currDate) {
        const year = expectedDate.getFullYear();
        const month = String(expectedDate.getMonth() + 1).padStart(2, '0');
        gaps.push(`${year}-${month}`);
        expectedDate.setMonth(expectedDate.getMonth() + 1);
      }
    }
  }
  
  return gaps;
}

/**
 * ✅ UTILITY: Format period for display with proper localization
 */
export function formatPeriodForDisplay(period: string): string {
  const periodInfo = parsePeriod(period);
  
  if (!periodInfo.isValid) return period;
  
  try {
    switch (periodInfo.format) {
      case 'yearly':
        return `Tahun ${periodInfo.year}`;
        
      case 'monthly': {
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const monthName = monthNames[(periodInfo.month || 1) - 1];
        return `${monthName} ${periodInfo.year}`;
      }
        
      case 'daily': {
        const date = new Date(periodInfo.year, (periodInfo.month || 1) - 1, periodInfo.day || 1);
        return date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
        
      default:
        return period;
    }
  } catch (error) {
    logger.warn('Error formatting period for display:', period, error);
    return period;
  }
}

/**
 * ✅ UTILITY: Check if period is within date range
 */
export function isPeriodInRange(
  period: string,
  startDate: Date,
  endDate: Date
): boolean {
  const periodInfo = parsePeriod(period);
  
  if (!periodInfo.isValid) return false;
  
  try {
    let periodDate: Date;
    
    switch (periodInfo.format) {
      case 'yearly':
        periodDate = new Date(periodInfo.year, 0, 1);
        break;
      case 'monthly':
        periodDate = new Date(periodInfo.year, (periodInfo.month || 1) - 1, 1);
        break;
      case 'daily':
        periodDate = new Date(periodInfo.year, (periodInfo.month || 1) - 1, periodInfo.day || 1);
        break;
      default:
        return false;
    }
    
    return periodDate >= startDate && periodDate <= endDate;
  } catch (error) {
    logger.warn('Error checking period range:', period, error);
    return false;
  }
}