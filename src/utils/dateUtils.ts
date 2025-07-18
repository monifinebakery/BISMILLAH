// src/utils/dateUtils.ts

/**
 * Parses a date value (Date object, string, or null/undefined) into a valid Date object or null.
 * @param dateValue The date value to parse.
 * @returns A Date object if valid, otherwise null.
 */
export const safeParseDate = (dateValue: any): Date | null => {
  try {
    if (dateValue === null || dateValue === undefined || (typeof dateValue === 'string' && dateValue.trim() === '')) {
      return null;
    }

    let parsedDate: Date;

    if (dateValue instanceof Date) {
      parsedDate = dateValue;
    } else {
      parsedDate = new Date(dateValue);
    }

    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  } catch (error) {
    console.error('DEBUG safeParseDate: CRITICAL ERROR during parsing for value:', dateValue, error);
    return null;
  }
};

/**
 * Formats a Date object into a readable date string (without time) for display.
 * @param date - The Date object to format. Can be null or undefined.
 * @returns A formatted date string (e.g., "18 Jul 2025") or 'N/A' if the date is invalid.
 */
export const formatDateForDisplay = (date: Date | null | undefined): string => {
  if (!date || (date instanceof Date && isNaN(date.getTime()))) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats a Date object into a "yyyy-MM-dd" string required by <input type="date">.
 * @param date - The Date object or string to format. Can be null or undefined.
 * @returns A string in "yyyy-MM-dd" format (e.g., "2025-07-18") or an empty string if the date is invalid/null.
 */
export const formatDateToYYYYMMDD = (date: Date | string | null | undefined): string => {
  if (!date) {
    return '';
  }
  // Jika sudah string dan sudah dalam format YYYY-MM-DD, gunakan langsung
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  // Jika bukan Date instance, coba parse dulu
  if (!(date instanceof Date)) {
    date = safeParseDate(date);
    if (!date) return '';
  }
  
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};

/**
 * Safely converts a Date object or date-like string/null to an ISO 8601 string or null for database storage.
 * @param dateValue The date value to convert.
 * @returns An ISO 8601 string (e.g., "2025-07-18T00:00:00.000Z") or null.
 */
export const toSafeISOString = (dateValue: Date | string | null | undefined): string | null => {
  if (!dateValue) return null;

  let dateObj: Date;
  if (dateValue instanceof Date) {
    dateObj = dateValue;
  } else if (typeof dateValue === 'string') {
    dateObj = new Date(dateValue);
  } else {
    console.warn('toSafeISOString received unexpected type:', typeof dateValue, dateValue);
    return null;
  }

  if (isNaN(dateObj.getTime())) {
    return null;
  }
  return dateObj.toISOString();
};