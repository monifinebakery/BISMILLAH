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
 * Formats a Date object into a readable string for display.
 * @param date - The Date object to format. Can be null or undefined.
 * @returns A formatted date string (e.g., "18 Jul, 13:30") or a fallback if the date is invalid.
 */
export const formatDateForDisplay = (date: Date | null | undefined): string => {
  // Tambahkan pemeriksaan instanceof Date di sini
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date'; // Atau string fallback lain yang sesuai
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateToYYYYMMDD = (date: Date | null | undefined): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};