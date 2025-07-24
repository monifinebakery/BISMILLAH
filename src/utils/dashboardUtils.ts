// utils/dashboardUtils.ts - COMPLETE VERSION
// Combined: dateUtils + dashboardUtils in one file

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

// ==================== TYPES ====================

// Definisikan tipe DateRange di sini agar bisa digunakan di seluruh aplikasi
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
 * Mem-parsing nilai tanggal (string, Date, number) menjadi objek Date yang valid atau null.
 * Ini adalah fungsi dasar yang digunakan oleh helper lain.
 * @param date Nilai tanggal yang akan di-parse.
 * @returns Objek Date atau null jika tidak valid.
 */
export const safeParseDate = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    if (date instanceof Date && isValid(date)) {
      return date;
    }
    if (typeof date === 'string' || typeof date === 'number') {
      // parseISO lebih baik untuk string ISO, new Date() untuk format lain
      const parsed = (typeof date === 'string' && date.includes('T')) ? parseISO(date) : new Date(date);
      return isValid(parsed) ? parsed : null;
    }
    return null;
  } catch (error) {
    console.warn('Date parsing error:', error, 'for date:', date);
    return null;
  }
};

// Alias for backward compatibility
export const parseDate = safeParseDate;

/**
 * Memeriksa apakah nilai yang diberikan adalah objek Date yang valid.
 * @param value Nilai yang akan diperiksa.
 * @returns `true` jika valid, `false` jika tidak.
 */
export const isValidDate = (value: any): value is Date => {
  const date = safeParseDate(value);
  return date !== null && isValid(date);
};

/**
 * Mengonversi nilai tanggal menjadi string YYYY-MM-DD yang aman untuk database.
 * @param dateValue Nilai tanggal yang akan dikonversi.
 * @returns String 'YYYY-MM-DD' atau null jika tidak valid.
 */
export const toSafeISOString = (dateValue: Date | string | null | undefined): string | null => {
  const dateObj = safeParseDate(dateValue);
  return dateObj ? format(dateObj, 'yyyy-MM-dd') : null;
};

// Alias for backward compatibility
export const toISOString = toSafeISOString;

/**
 * Memformat objek Date menjadi string yang mudah dibaca untuk tampilan UI.
 * @param date Objek Date yang akan diformat.
 * @returns String tanggal yang diformat (misal: "24 Jul 2025") atau '-' jika tidak valid.
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '-';
  return format(dateObj, 'd MMM yyyy', { locale: id });
};

// Alias for backward compatibility
export const formatDate = formatDateForDisplay;

/**
 * Memformat objek Date menjadi string "yyyy-MM-dd" untuk nilai input tanggal HTML.
 * @param date Objek Date atau string yang akan diformat.
 * @returns String format "yyyy-MM-dd" atau string kosong jika tidak valid.
 */
export const formatDateToYYYYMMDD = (date: Date | string | null | undefined): string => {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '';
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Memformat rentang tanggal menjadi string yang mudah dibaca.
 * @param dateRange Objek DateRange.
 * @returns String rentang tanggal yang diformat.
 */
export const formatDateRange = (dateRange: DateRange | undefined): string => {
  if (!dateRange?.from) return "Pilih rentang tanggal";
  
  const fromDate = safeParseDate(dateRange.from);
  if (!fromDate) return "Tanggal mulai tidak valid";
  
  const toDate = safeParseDate(dateRange.to);

  if (toDate && format(fromDate, 'yyyy-MM-dd') !== format(toDate, 'yyyy-MM-dd')) {
    return `${format(fromDate, "d MMM", { locale: id })} - ${format(toDate, "d MMM yyyy", { locale: id })}`;
  }
  
  return format(fromDate, "d MMMM yyyy", { locale: id });
};

/**
 * Enhanced date formatter with time for dashboard activities
 * @param date - Date to format
 * @returns Formatted date string with time or fallback message
 */
export const formatDateTime = (date: any): string => {
  if (!date) return 'Waktu tidak valid';
  
  try {
    const dateObj = safeParseDate(date);
    
    if (!dateObj || !isValidDate(dateObj)) {
      return 'Waktu tidak valid';
    }
    
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', date);
    return 'Waktu tidak valid';
  }
};

/**
 * Mendapatkan deskripsi waktu relatif (misal: "Hari ini", "Kemarin").
 * @param date Tanggal untuk dibandingkan.
 * @returns String deskripsi waktu relatif.
 */
export const getRelativeTimeDescription = (date: Date | string | null | undefined): string => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return 'Tanggal tidak valid';
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (format(now, 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Hari ini';
  if (format(subDays(now, 1), 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Kemarin';

  if (diffDays > 1 && diffDays <= 30) return `${diffDays} hari yang lalu`;
  
  return formatDateForDisplay(parsedDate);
};

// Alias for backward compatibility
export const formatRelativeTime = getRelativeTimeDescription;

// ==================== DATE RANGE UTILITIES ====================

/**
 * Menghasilkan objek DateRange berdasarkan preset yang dipilih.
 * @param key Kunci preset ('today', 'yesterday', 'last7days', dll.).
 * @returns Objek DateRange yang sesuai.
 */
export const getDateRangePreset = (key: string): { from: Date, to: Date } => {
  const today = new Date();
  try {
    switch (key) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'last7days':
        return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
      case 'last30days':
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      default:
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    }
  } catch (error) {
    console.error('Error creating date range preset:', error, 'for key:', key);
    return { from: startOfDay(today), to: endOfDay(today) }; // Fallback
  }
};

/**
 * Get date presets array
 * @returns Array of date range presets
 */
export const getDatePresets = (): DateRangePreset[] => {
  try {
    return [
      { 
        label: "Hari Ini", 
        range: getDateRangePreset('today')
      },
      { 
        label: "Kemarin", 
        range: getDateRangePreset('yesterday')
      },
      { 
        label: "7 Hari Terakhir", 
        range: getDateRangePreset('last7days')
      },
      { 
        label: "30 Hari Terakhir", 
        range: getDateRangePreset('last30days')
      },
      { 
        label: "Bulan Ini", 
        range: getDateRangePreset('thisMonth')
      },
      { 
        label: "Bulan Lalu", 
        range: getDateRangePreset('lastMonth')
      },
    ];
  } catch (error) {
    console.error('Error generating date presets:', error);
    // Return a safe fallback using today preset
    const todayPreset = getDateRangePreset('today');
    return [{
      label: "Error - Hari Ini",
      range: todayPreset
    }];
  }
};

/**
 * Get preset by key
 * @param key - Preset key (today, yesterday, last7days, etc.)
 * @returns Date range or fallback to today if invalid
 */
export const getDatePresetByKey = (key: string): { from: Date; to: Date } => {
  try {
    return getDateRangePreset(key);
  } catch (error) {
    console.error('Error getting date preset:', error, 'for key:', key);
    return getDateRangePreset('today'); // Safe fallback
  }
};

/**
 * Memeriksa apakah sebuah tanggal berada dalam rentang tertentu.
 * @param date Tanggal target.
 * @param startDate Tanggal mulai rentang.
 * @param endDate Tanggal akhir rentang.
 * @returns `true` jika tanggal berada dalam rentang.
 */
export const isDateInRange = (
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean => {
  const targetDate = safeParseDate(date);
  const rangeStart = safeParseDate(startDate);
  const rangeEnd = safeParseDate(endDate);
  
  if (!targetDate || !rangeStart || !rangeEnd) return false;
  
  return targetDate >= rangeStart && targetDate <= rangeEnd;
};

/**
 * Menghitung jumlah hari antara dua tanggal.
 * @param startDate Tanggal mulai.
 * @param endDate Tanggal akhir.
 * @returns Jumlah hari.
 */
export const getDaysBetween = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number => {
  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);
  
  if (!start || !end) return 0;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Mendapatkan awal hari dari objek Date.
 * @param dateObj Objek Date.
 * @returns Objek Date di awal hari (00:00:00) atau null jika tidak valid.
 */
export const getStartOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  const parsed = safeParseDate(dateObj);
  return parsed ? startOfDay(parsed) : null;
};

/**
 * Mendapatkan akhir hari dari objek Date.
 * @param dateObj Objek Date.
 * @returns Objek Date di akhir hari (23:59:59.999) atau null jika tidak valid.
 */
export const getEndOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  const parsed = safeParseDate(dateObj);
  return parsed ? endOfDay(parsed) : null;
};

// ==================== DASHBOARD-SPECIFIC UTILITIES ====================

/**
 * Safe pagination calculation
 * @param currentPage - Current page number
 * @param totalItems - Total number of items
 * @param itemsPerPage - Items per page (default: 5)
 * @returns Pagination info object
 */
export const calculatePagination = (
  currentPage: number, 
  totalItems: number, 
  itemsPerPage: number = 5
) => {
  try {
    // Ensure positive numbers
    const safeItemsPerPage = Math.max(1, itemsPerPage);
    const safeTotalItems = Math.max(0, totalItems);
    
    const totalPages = Math.max(1, Math.ceil(safeTotalItems / safeItemsPerPage));
    const safePage = Math.max(1, Math.min(currentPage, totalPages));
    const startIndex = Math.max(0, (safePage - 1) * safeItemsPerPage);
    const endIndex = Math.min(startIndex + safeItemsPerPage, safeTotalItems);
    
    return {
      currentPage: safePage,
      totalPages,
      startIndex,
      endIndex,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
      itemsPerPage: safeItemsPerPage,
      totalItems: safeTotalItems
    };
  } catch (error) {
    console.error('Pagination calculation error:', error);
    // Return safe defaults
    return {
      currentPage: 1,
      totalPages: 1,
      startIndex: 0,
      endIndex: 0,
      hasNext: false,
      hasPrev: false,
      itemsPerPage: itemsPerPage || 5,
      totalItems: 0
    };
  }
};

/**
 * Get icon and color for activity type
 * @param type - Activity type
 * @returns Style object with icon and color
 */
export const getActivityTypeStyle = (type: string) => {
  const styles: Record<string, { icon: string, color: string, bgColor: string }> = {
    'keuangan': { 
      icon: 'CircleDollarSign', 
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    'resep': { 
      icon: 'ChefHat', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    'stok': { 
      icon: 'Package', 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    'order': { 
      icon: 'ShoppingCart', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    'supplier': { 
      icon: 'Building', 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    'aset': { 
      icon: 'Home', 
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    'default': { 
      icon: 'Activity', 
      color: 'text-gray-500',
      bgColor: 'bg-gray-50'
    }
  };
  
  return styles[type?.toLowerCase()] || styles.default;
};

/**
 * Generate unique key for React lists
 * @param prefix - Key prefix
 * @param id - Item ID
 * @param index - Item index
 * @param suffix - Optional suffix
 * @returns Unique key string
 */
export const generateListKey = (prefix: string, id: any, index: number, suffix?: string): string => {
  try {
    const safePrefix = prefix || 'item';
    const safeId = id !== null && id !== undefined ? String(id) : String(index);
    const safeIndex = Number.isInteger(index) ? index : 0;
    const safeSuffix = suffix ? `_${String(suffix)}` : '';
    
    return `${safePrefix}_${safeId}_${safeIndex}${safeSuffix}`;
  } catch (error) {
    console.warn('Key generation error:', error);
    return `fallback_${Date.now()}_${Math.random()}`;
  }
};

/**
 * Format activity description with safe text handling
 * @param description - Activity description
 * @param maxLength - Maximum length before truncation
 * @returns Formatted description
 */
export const formatActivityDescription = (description: string, maxLength: number = 100): string => {
  if (!description) return '-';
  
  try {
    const cleanDescription = description.trim();
    if (cleanDescription.length <= maxLength) {
      return cleanDescription;
    }
    
    return `${cleanDescription.substring(0, maxLength).trim()}...`;
  } catch (error) {
    console.warn('Activity description formatting error:', error);
    return description || '-';
  }
};

/**
 * Get priority color for dashboard items
 * @param priority - Priority level (1-5)
 * @returns CSS color classes
 */
export const getPriorityColor = (priority: number): { color: string; bgColor: string } => {
  const priorities: Record<number, { color: string; bgColor: string }> = {
    1: { color: 'text-gray-600', bgColor: 'bg-gray-50' },
    2: { color: 'text-blue-600', bgColor: 'bg-blue-50' },
    3: { color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    4: { color: 'text-orange-600', bgColor: 'bg-orange-50' },
    5: { color: 'text-red-600', bgColor: 'bg-red-50' }
  };
  
  return priorities[priority] || priorities[1];
};

/**
 * Format number with safe handling for dashboard metrics
 * @param value - Number to format
 * @param type - Format type ('currency', 'percentage', 'decimal')
 * @returns Formatted string
 */
export const formatDashboardMetric = (
  value: number | null | undefined, 
  type: 'currency' | 'percentage' | 'decimal' | 'integer' = 'integer'
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    switch (type) {
      case 'currency': return 'Rp 0';
      case 'percentage': return '0%';
      case 'decimal': return '0.00';
      default: return '0';
    }
  }
  
  try {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
        
      case 'percentage':
        return new Intl.NumberFormat('id-ID', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value);
        
      case 'decimal':
        return new Intl.NumberFormat('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
        
      default:
        return new Intl.NumberFormat('id-ID').format(value);
    }
  } catch (error) {
    console.warn('Dashboard metric formatting error:', error);
    return String(value);
  }
};

// ==================== ORGANIZED EXPORTS ====================

// Export utility objects for organized imports
export const dashboardUtils = {
  parseDate: safeParseDate,
  safeParseDate,
  isValidDate,
  formatDateTime,
  formatDate: formatDateForDisplay,
  formatDateForDisplay,
  formatDateToYYYYMMDD,
  formatDateRange,
  formatRelativeTime: getRelativeTimeDescription,
  getRelativeTimeDescription,
  toISOString: toSafeISOString,
  toSafeISOString,
  isDateInRange,
  getDaysBetween,
  getStartOfDay,
  getEndOfDay
};

export const DatePresetUtils = {
  getDatePresets,
  getDatePresetByKey,
  getDateRangePreset
};

export const UIUtils = {
  calculatePagination,
  getActivityTypeStyle,
  generateListKey,
  formatActivityDescription,
  getPriorityColor,
  formatDashboardMetric
};