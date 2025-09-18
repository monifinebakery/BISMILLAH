// src/lib/shared/formatters.ts - UNIFIED FORMATTING UTILITIES
// Single source of truth untuk semua formatting functions

// ==================== CORE CURRENCY FORMATTING ====================

/**
 * Format angka menjadi mata uang Rupiah dengan opsi kustomisasi
 * @param value - Nilai yang akan diformat
 * @param options - Opsi formatting
 */
export const formatCurrency = (
  value: number | null | undefined,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Rp 0';
  }

  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'id-ID'
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

/**
 * Format angka besar dengan singkatan Indonesia (rb, jt, miliar, triliun)
 * @param value - Nilai yang akan diformat
 * @param options - Opsi formatting
 */
export const formatCompactCurrency = (
  value: number | null | undefined,
  options: {
    digits?: number;
    withCurrency?: boolean;
    threshold?: number;
  } = {}
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return options.withCurrency !== false ? 'Rp 0' : '0';
  }

  const {
    digits = 1,
    withCurrency = true,
    threshold = 1000
  } = options;

  const abbreviations = [
    { value: 1E12, symbol: ' triliun' },
    { value: 1E9, symbol: ' miliar' },
    { value: 1E6, symbol: ' jt' },
    { value: 1E3, symbol: ' rb' },
    { value: 1, symbol: '' }
  ];

  // Jika di bawah threshold, gunakan format penuh
  if (value < threshold) {
    return formatCurrency(value);
  }

  // Cari abbreviation yang tepat
  for (const abbr of abbreviations) {
    if (value >= abbr.value) {
      const abbreviated = (value / abbr.value).toFixed(digits);
      const cleanValue = abbreviated.replace(/\.0+$/, '');
      
      if (withCurrency) {
        return `Rp ${cleanValue}${abbr.symbol}`;
      } else {
        return `${cleanValue}${abbr.symbol}`;
      }
    }
  }

  return withCurrency ? formatCurrency(value) : value.toString();
};

// ==================== PERCENTAGE FORMATTING ====================

/**
 * Format angka menjadi persentase Indonesia
 * @param value - Nilai decimal (0.25 = 25%)
 * @param decimals - Jumlah desimal
 */
export const formatPercentage = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// ==================== NUMBER FORMATTING ====================

/**
 * Format angka dengan pemisah ribuan Indonesia
 * @param value - Nilai yang akan diformat
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(value);
};

/**
 * Format angka dengan singkatan (tanpa Rp)
 * @param value - Nilai yang akan diformat
 * @param decimals - Jumlah desimal
 */
export const formatCompactNumber = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  return formatCompactCurrency(value, { 
    digits: decimals, 
    withCurrency: false 
  });
};

// ==================== DATE FORMATTING ====================

/**
 * Format tanggal untuk tampilan Indonesia
 * @param date - Date object atau string
 * @param style - Style format tanggal
 */
export const formatDate = (
  date: Date | string | null | undefined,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '-';
    }

    const options: Intl.DateTimeFormatOptions = {
      dateStyle: style
    };

    return new Intl.DateTimeFormat('id-ID', options).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '-';
  }
};

/**
 * Format waktu relatif (misal: "2 hari yang lalu")
 * @param date - Tanggal yang akan dibandingkan
 */
export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    
    const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
    
    if (diffMs < 60000) { // < 1 menit
      return 'Baru saja';
    } else if (diffMs < 3600000) { // < 1 jam
      return rtf.format(-Math.floor(diffMs / 60000), 'minute');
    } else if (diffMs < 86400000) { // < 1 hari
      return rtf.format(-Math.floor(diffMs / 3600000), 'hour');
    } else if (diffMs < 604800000) { // < 1 minggu
      return rtf.format(-Math.floor(diffMs / 86400000), 'day');
    } else {
      return formatDate(dateObj, 'short');
    }
  } catch (error) {
    return '-';
  }
};

// ==================== TIME FORMATTING ====================

/**
 * Format waktu (jam dan menit) untuk tampilan Indonesia
 * @param dateInput - Date object, string, atau null
 */
export const formatTime = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return '--:--';
  
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Time formatting error:', error);
    return '--:--';
  }
};

/**
 * Format waktu dengan seconds untuk tampilan Indonesia
 * @param dateInput - Date object, string, atau null
 */
export const formatTimeWithSeconds = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return '--:--:--';
  
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return '--:--:--';
    }
    
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.warn('Time formatting error:', error);
    return '--:--:--';
  }
};

// ==================== TEXT FORMATTING ====================

/**
 * Truncate text dengan ellipsis yang responsive
 * @param text - Text yang akan dipotong
 * @param maxLength - Panjang maksimum
 * @param breakpoint - Responsive breakpoint
 */
export const formatTruncatedText = (
  text: string, 
  maxLength: number | { sm?: number; md?: number; lg?: number } = 50
): string => {
  if (!text) return '';
  
  let length: number;
  if (typeof maxLength === 'object') {
    // Responsive truncation (simplified for now)
    length = maxLength.md || maxLength.sm || maxLength.lg || 50;
  } else {
    length = maxLength;
  }
  
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Capitalize first letter
 * @param text - Text to capitalize
 */
export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert to title case
 * @param text - Text to convert
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ==================== STATUS & COLOR HELPERS ====================

/**
 * Get color class based on value range
 * @param value - Numeric value
 * @param ranges - Range definitions
 */
export const getValueColor = (
  value: number,
  ranges: {
    excellent?: number;
    good?: number;
    warning?: number;
  } = {}
): string => {
  const { excellent = 30, good = 15, warning = 0 } = ranges;
  
  if (value >= excellent) return 'text-green-600';
  if (value >= good) return 'text-blue-600';
  if (value >= warning) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Format status dengan warna dan background
 * @param status - Status string
 */
export const formatStatusBadge = (status: string): {
  text: string;
  className: string;
} => {
  const statusMap: Record<string, { text: string; className: string }> = {
    'active': { text: 'Aktif', className: 'text-green-600 bg-green-50 border-green-200' },
    'inactive': { text: 'Tidak Aktif', className: 'text-gray-600 bg-gray-50 border-gray-200' },
    'pending': { text: 'Menunggu', className: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    'confirmed': { text: 'Dikonfirmasi', className: 'text-blue-600 bg-blue-50 border-blue-200' },
    'processing': { text: 'Diproses', className: 'text-purple-600 bg-purple-50 border-purple-200' },
    'completed': { text: 'Selesai', className: 'text-green-600 bg-green-50 border-green-200' },
    'cancelled': { text: 'Dibatalkan', className: 'text-red-600 bg-red-50 border-red-200' },
    'delivered': { text: 'Diantar', className: 'text-green-600 bg-green-50 border-green-200' },
    'shipped': { text: 'Dikirim', className: 'text-blue-600 bg-blue-50 border-blue-200' }
  };

  return statusMap[status] || {
    text: toTitleCase(status),
    className: 'text-gray-600 bg-gray-50 border-gray-200'
  };
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate and format Indonesian phone number
 * @param phone - Phone number string
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '-';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('08')) {
    return `+62${cleaned.substring(1)}`;
  } else if (cleaned.startsWith('8')) {
    return `+62${cleaned}`;
  }
  
  return phone;
};

/**
 * Validate email format
 * @param email - Email string
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate Indonesian phone number
 * @param phone - Phone number string
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

// ==================== UTILITY EXPORTS ====================

// Grouped exports for easy importing
export const CurrencyFormatter = {
  format: formatCurrency,
  compact: formatCompactCurrency,
  number: formatCompactNumber
};

export const DateFormatter = {
  format: formatDate,
  relative: formatRelativeTime
};

export const TextFormatter = {
  truncate: formatTruncatedText,
  capitalize: capitalizeFirst,
  titleCase: toTitleCase
};

export const StatusFormatter = {
  badge: formatStatusBadge,
  color: getValueColor
};

export const Validators = {
  email: isValidEmail,
  phone: isValidPhoneNumber
};

// Default export untuk backward compatibility
export default {
  formatCurrency,
  formatCompactCurrency,
  formatPercentage,
  formatNumber,
  formatCompactNumber,
  formatDate,
  formatRelativeTime,
  formatTruncatedText,
  capitalizeFirst,
  toTitleCase,
  formatPhoneNumber,
  getValueColor,
  formatStatusBadge,
  isValidEmail,
  isValidPhoneNumber,
  CurrencyFormatter,
  DateFormatter,
  TextFormatter,
  StatusFormatter,
  Validators
};