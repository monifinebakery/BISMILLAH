/**
 * =================================================================
 * GENERAL FORMATTING UTILITIES
 * =================================================================
 * A collection of utility functions for formatting various data types
 * such as currency, numbers, dates, and text for display purposes.
 */

/**
 * Formats a number as Indonesian Rupiah (IDR) currency.
 * @param amount - The number to format.
 * @returns A string representing the formatted currency (e.g., "Rp 10.000").
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats a number with Indonesian locale-specific thousand separators.
 * @param value - The number to format.
 * @returns A string with thousand separators (e.g., "1.234.567").
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

/**
 * Formats a number into a compact representation (K, M, B).
 * @param num The number to format.
 * @returns A compact string representation (e.g., "1.2K", "5.M").
 */
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
};

/**
 * Formats a number as a percentage.
 * @param value - The value to format (e.g., 0.75 for 75%).
 * @param decimals - The number of decimal places to show.
 * @returns A formatted percentage string (e.g., "75,1%").
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};


/**
 * =================================================================
 * DATE & TIME UTILITIES
 * =================================================================
 */

/**
 * Formats a Date object or a date string into a readable format.
 * Includes error handling for invalid date inputs.
 * @param date - The date to format (Date object or string).
 * @returns A formatted date string (e.g., "24 Jul 2025") or '-' if invalid.
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '-';
  }
};


/**
 * =================================================================
 * TEXT & STRING UTILITIES
 * =================================================================
 */

/**
 * Truncates a string to a specified maximum length and appends '...'.
 * @param text - The string to truncate.
 * @param maxLength - The maximum length before truncating.
 * @returns The truncated string or the original string if it's shorter than maxLength.
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Capitalizes the first letter of each word in a string.
 * @param text - The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


/**
 * =================================================================
 * DOMAIN-SPECIFIC UTILITIES (ORDERS)
 * =================================================================
 */

/**
 * Formats an order status string into a human-readable Indonesian format.
 * @param status - The raw status string (e.g., 'pending').
 * @returns The formatted status (e.g., "Menunggu Konfirmasi").
 */
export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Menunggu Konfirmasi',
    'confirmed': 'Dikonfirmasi',
    'processing': 'Diproses',
    'ready': 'Siap Diantar',
    'delivered': 'Diantar',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return statusMap[status.toLowerCase()] || capitalizeWords(status);
};

/**
 * Generates a random order number with the format ORDYYMMDDXXX.
 * @returns A unique order number string.
 */
export const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${year}${month}${day}${random}`;
};

/**
 * Generates a random order number including time, ORDYYMMDDHHMMXX.
 * @returns A unique order number string with time.
 */
export const generateOrderNumberWithTime = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `ORD${year}${month}${day}${hour}${minute}${random}`;
};

/**
 * Generates a sequential order number for the current date.
 * Resets to 1 for a new day.
 * @param lastOrderNumber - The last order number (e.g., "ORD250724001").
 * @returns The next sequential order number.
 */
export const generateOrderNumberSequential = (lastOrderNumber?: string): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const currentDatePrefix = `${year}${month}${day}`;

  let sequence = 1;
  if (lastOrderNumber) {
    const lastDatePrefix = lastOrderNumber.substring(3, 9); // Extracts YYMMDD
    const lastSequenceStr = lastOrderNumber.substring(9);   // Extracts sequence part

    if (lastDatePrefix === currentDatePrefix && /^\d+$/.test(lastSequenceStr)) {
      sequence = parseInt(lastSequenceStr, 10) + 1;
    }
  }

  const sequenceStr = sequence.toString().padStart(3, '0');
  return `ORD${currentDatePrefix}${sequenceStr}`;
};


/**
 * =================================================================
 * INPUT SANITIZATION & VALIDATION
 * =================================================================
 */

/**
 * Trims whitespace and collapses multiple spaces into one.
 * @param input - The string to sanitize.
 * @returns The sanitized string.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Removes non-digit characters from a phone number string, except for a leading '+'.
 * @param phone - The phone number string to clean.
 * @returns The sanitized phone number.
 */
export const sanitizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    // Allow digits and a leading plus sign
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (phone.startsWith('+')) {
        return '+' + cleaned.replace(/\+/g, ''); // Keep only the first '+'
    }
    return cleaned.replace(/\+/g, '');
};

/**
 * Formats a phone number to the international +62 standard.
 * @param phone - The raw phone number.
 * @returns The formatted phone number (e.g., "+6281234567890").
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('08')) {
    return `+62${cleaned.substring(1)}`;
  }
  if (cleaned.startsWith('8')) {
    // Handle cases where '0' is omitted but '62' is not present
    return `+62${cleaned}`;
  }
  return phone; // Return original if format is not recognized
};

/**
 * Validates if a string is a valid email address.
 * @param email - The email string to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  // A common and reasonably effective regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates if a phone number has a plausible length.
 * @param phone - The phone number string to validate.
 * @returns True if the phone number length is valid, false otherwise.
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  // Strips all non-digit characters for a pure length check
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 9 && cleanPhone.length <= 15;
};
