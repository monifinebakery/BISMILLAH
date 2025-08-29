// src/utils/userFriendlyDate.ts
// User-friendly date handling that prevents "Format tanggal tidak valid" errors

import { logger } from '@/utils/logger';

/**
 * Enhanced date utilities specifically for user inputs
 * Handles various user input formats gracefully
 */

export interface UserDateParseResult {
  success: boolean;
  date?: Date;
  error?: string;
  originalInput?: any;
}

/**
 * Parse Indonesian date formats like "8 Agustus 2025" or "30 Januari 2024"
 */
function parseIndonesianDate(input: string): Date | null {
  const monthMap: Record<string, number> = {
    'januari': 1, 'jan': 1,
    'februari': 2, 'feb': 2,
    'maret': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'mei': 5,
    'juni': 6, 'jun': 6,
    'juli': 7, 'jul': 7,
    'agustus': 8, 'agu': 8,
    'september': 9, 'sep': 9,
    'oktober': 10, 'okt': 10,
    'november': 11, 'nov': 11,
    'desember': 12, 'des': 12
  };
  
  const normalized = input.toLowerCase().trim();
  
  // Pattern: "8 Agustus 2025" or "30 Januari 2024"
  const match = normalized.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (match) {
    const [, dayStr, monthStr, yearStr] = match;
    const month = monthMap[monthStr];
    
    if (month) {
      const day = parseInt(dayStr, 10);
      const year = parseInt(yearStr, 10);
      
      // Validate day range
      if (day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        // Double-check the date is valid (handles Feb 30, etc)
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date;
        }
      }
    }
  }
  
  // Pattern: "Agustus 8, 2025" (alternative format)
  const altMatch = normalized.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (altMatch) {
    const [, monthStr, dayStr, yearStr] = altMatch;
    const month = monthMap[monthStr];
    
    if (month) {
      const day = parseInt(dayStr, 10);
      const year = parseInt(yearStr, 10);
      
      if (day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date;
        }
      }
    }
  }
  
  return null;
}

/**
 * Parse user input date with maximum flexibility
 * Supports various formats that users might input
 */
export function parseUserDate(input: any): UserDateParseResult {
  const originalInput = input;
  
  // Handle null/undefined/empty
  if (!input || input === '') {
    return {
      success: false,
      error: 'Tanggal tidak boleh kosong',
      originalInput
    };
  }

  try {
    let dateObj: Date;

    // Handle Date object
    if (input instanceof Date) {
      dateObj = new Date(input.getTime()); // Clone to avoid mutation
    }
    // Handle string input
    else if (typeof input === 'string') {
      const trimmed = input.trim();
      
      // Indonesian month names parsing
      const indonesianMonthResult = parseIndonesianDate(trimmed);
      if (indonesianMonthResult) {
        dateObj = indonesianMonthResult;
      }
      // Common Indonesian date formats
      else if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // DD/MM/YYYY or D/M/YYYY
        const [day, month, year] = trimmed.split('/').map(Number);
        dateObj = new Date(year, month - 1, day);
      }
      // ISO date format (YYYY-MM-DD)
      else if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Add time to avoid timezone issues - set to noon UTC
        dateObj = new Date(trimmed + 'T12:00:00.000Z');
      }
      // ISO datetime format
      else if (trimmed.includes('T') && (trimmed.includes('Z') || trimmed.includes('+'))) {
        dateObj = new Date(trimmed);
      }
      // Natural language (let browser parse)
      else {
        dateObj = new Date(trimmed);
      }
    }
    // Handle number (timestamp)
    else if (typeof input === 'number') {
      dateObj = new Date(input);
    }
    // Unknown type
    else {
      return {
        success: false,
        error: `Format tidak didukung: ${typeof input}`,
        originalInput
      };
    }

    // Validate parsed date
    if (isNaN(dateObj.getTime())) {
      return {
        success: false,
        error: 'Format tanggal tidak valid',
        originalInput
      };
    }

    // Check reasonable date range
    const currentYear = new Date().getFullYear();
    const year = dateObj.getFullYear();
    
    if (year < 2020) {
      return {
        success: false,
        error: 'Tanggal tidak boleh sebelum tahun 2020',
        originalInput
      };
    }
    
    if (year > currentYear + 5) {
      return {
        success: false,
        error: `Tanggal tidak boleh lebih dari ${currentYear + 5}`,
        originalInput
      };
    }

    return {
      success: true,
      date: dateObj,
      originalInput
    };

  } catch (error) {
    logger.error('Error parsing user date:', error, input);
    return {
      success: false,
      error: 'Gagal memproses tanggal',
      originalInput
    };
  }
}

/**
 * Format date for user display (Indonesian locale)
 */
export function formatUserDate(input: any): string {
  const parseResult = parseUserDate(input);
  
  if (!parseResult.success || !parseResult.date) {
    return 'Format tidak valid';
  }

  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    }).format(parseResult.date);
  } catch (error) {
    // Fallback to simple format
    return parseResult.date.toLocaleDateString('id-ID');
  }
}

/**
 * Convert user input to database-safe format (YYYY-MM-DD)
 */
export function formatForDatabase(input: any): string | null {
  const parseResult = parseUserDate(input);
  
  if (!parseResult.success || !parseResult.date) {
    return null;
  }

  try {
    // Use UTC date to avoid timezone issues in database
    const year = parseResult.date.getFullYear();
    const month = String(parseResult.date.getMonth() + 1).padStart(2, '0');
    const day = String(parseResult.date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    logger.error('Error formatting date for database:', error, input);
    return null;
  }
}

/**
 * Get user-friendly validation message
 */
export function getDateValidationMessage(input: any): string | null {
  if (!input || input === '') {
    return 'Silakan pilih tanggal';
  }

  const parseResult = parseUserDate(input);
  if (parseResult.success) {
    return null; // Valid, no error message
  }

  // Return user-friendly error message
  return parseResult.error || 'Format tanggal tidak valid';
}

/**
 * Suggest correct format to user based on their input
 */
export function suggestDateFormat(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  
  // If they used DD/MM format, suggest adding year
  if (trimmed.match(/^\d{1,2}\/\d{1,2}$/)) {
    return 'Tambahkan tahun: DD/MM/YYYY (contoh: 30/08/2025)';
  }
  
  // If they used wrong separator
  if (trimmed.includes('.') || trimmed.includes('-')) {
    return 'Gunakan format: DD/MM/YYYY atau pilih dari kalender';
  }
  
  // If only numbers
  if (trimmed.match(/^\d+$/)) {
    return 'Format lengkap: DD/MM/YYYY (contoh: 30/08/2025)';
  }
  
  return 'Gunakan format: DD/MM/YYYY atau pilih dari kalender';
}

/**
 * Create safe date for Calendar component
 */
export function createCalendarDate(input: any): Date | undefined {
  const parseResult = parseUserDate(input);
  return parseResult.success ? parseResult.date : undefined;
}

/**
 * Comprehensive date utilities for purchase forms
 */
export const UserFriendlyDate = {
  parse: parseUserDate,
  format: formatUserDate,
  formatForDB: formatForDatabase,
  validate: getDateValidationMessage,
  suggest: suggestDateFormat,
  forCalendar: createCalendarDate,
  
  // Quick validation check
  isValid: (input: any): boolean => parseUserDate(input).success,
  
  // Safe conversion for forms
  toDate: (input: any): Date => {
    const result = parseUserDate(input);
    return result.success && result.date ? result.date : new Date();
  }
};

export default UserFriendlyDate;
