// src/utils/timestampUtils.ts
// Robust timestamp handling utilities for PostgreSQL timestamptz format

/**
 * Safely parse PostgreSQL timestamp with timezone
 * Handles various PostgreSQL timestamp formats including timestamptz
 */
export const parsePostgresTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) {
    return null;
  }

  try {
    // If already a Date object
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : new Date(timestamp);
    }

    // If it's a string, handle various PostgreSQL formats
    if (typeof timestamp === 'string') {
      // Handle ISO string with Z (UTC)
      if (timestamp.includes('T') && timestamp.includes('Z')) {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }

      // Handle timestamptz format like "2025-08-29 15:30:45.123456+07"
      if (timestamp.includes('+') || timestamp.includes('-')) {
        // PostgreSQL timestamptz format with timezone
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }

      // Handle timestamp without timezone (assume local)
      if (timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        // Format: "2025-08-29 15:30:45" or "2025-08-29 15:30:45.123456"
        const date = new Date(timestamp + (timestamp.includes('+') ? '' : 'Z'));
        return isNaN(date.getTime()) ? null : date;
      }

      // Handle date only format
      if (timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Format: "2025-08-29"
        const date = new Date(timestamp + 'T00:00:00.000Z');
        return isNaN(date.getTime()) ? null : date;
      }

      // Try generic Date parsing as fallback
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    // Handle numeric timestamps (milliseconds since epoch)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch (error) {
    console.warn('Error parsing timestamp:', error, 'Input:', timestamp);
    return null;
  }
};

/**
 * Format date for display with error handling
 */
export const formatDisplayDate = (
  timestamp: any,
  options: {
    includeTime?: boolean;
    fallback?: string;
    locale?: string;
  } = {}
): string => {
  const {
    includeTime = false,
    fallback = '-',
    locale = 'id-ID'
  } = options;

  const date = parsePostgresTimestamp(timestamp);
  if (!date) {
    return fallback;
  }

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

    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toLocaleDateString();
  }
};

/**
 * Validate if timestamp is in reasonable range for business operations
 */
export const validateBusinessTimestamp = (timestamp: any): {
  isValid: boolean;
  error?: string;
  date?: Date;
} => {
  const date = parsePostgresTimestamp(timestamp);
  
  if (!date) {
    return {
      isValid: false,
      error: 'Format tanggal tidak valid'
    };
  }

  const now = new Date();
  const minBusinessYear = 2020; // Assuming business started in 2020
  const maxFutureYear = now.getFullYear() + 5; // Allow up to 5 years in future

  if (date.getFullYear() < minBusinessYear) {
    return {
      isValid: false,
      error: `Tanggal tidak boleh sebelum tahun ${minBusinessYear}`,
      date
    };
  }

  if (date.getFullYear() > maxFutureYear) {
    return {
      isValid: false,
      error: `Tanggal tidak boleh lebih dari tahun ${maxFutureYear}`,
      date
    };
  }

  return {
    isValid: true,
    date
  };
};

/**
 * Convert date to PostgreSQL timestamp format
 */
export const toPostgresTimestamp = (date: Date | string | null): string | null => {
  const parsedDate = parsePostgresTimestamp(date);
  return parsedDate ? parsedDate.toISOString() : null;
};

/**
 * Get relative time description (e.g., "2 jam yang lalu", "kemarin")
 */
export const getRelativeTime = (timestamp: any, locale: string = 'id'): string => {
  const date = parsePostgresTimestamp(timestamp);
  if (!date) {
    return 'Tanggal tidak valid';
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
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
    // For older dates, show formatted date
    return formatDisplayDate(date, { includeTime: false });
  }
};
