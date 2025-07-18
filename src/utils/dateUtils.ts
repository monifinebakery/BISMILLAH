// src/utils/dateUtils.ts

/**
 * Parses a date value (Date object, string, or null/undefined) into a valid Date object or null.
 * @param dateValue The date value to parse.
 * @returns A Date object if valid, otherwise null.
 */
export const safeParseDate = (dateValue: any): Date | null => {
  try {
    if (!dateValue || (typeof dateValue === 'string' && dateValue.trim() === '')) {
      return null;
    }

    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;

  } catch (error) {
    console.error('Error in safeParseDate for value:', dateValue, error);
    return null;
  }
};


/**
 * Formats a Date object into a readable date string (without time) for display.
 * @param date - The Date object to format. Can be null or undefined.
 * @returns A formatted date string (e.g., "18 Jul 2025") or a fallback if the date is invalid.
 */
export const formatDateForDisplay = (date: Date | null | undefined): string => {
  // MODIFIKASI DISINI: Perkuat pengecekan Invalid Date
  if (!date || (date instanceof Date && isNaN(date.getTime()))) {
    return 'Invalid Date'; // Pastikan ini menangkap semua kasus Invalid Date
  }

  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats a Date object into a "yyyy-MM-dd" string required by <input type="date">.
 * @param date - The Date object to format. Can be null or undefined.
 * @returns A string in "yyyy-MM-dd" format (e.g., "2025-07-18") or an empty string if the date is invalid/null.
 */
export const formatDateToYYYYMMDD = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};