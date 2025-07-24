// utils/dashboardUtils.ts - FIXED VERSION
import { format, subDays, startOfMonth, endOfMonth, subMonths, isValid, parseISO, startOfDay, endOfDay } from "date-fns";
import { id } from 'date-fns/locale';

// ==================== SAFE DATE UTILITIES ====================

/**
 * Safe date parsing with comprehensive error handling
 * @param dateValue - Any date input (string, Date, number, etc.)
 * @returns Date object or null if invalid
 */
export const parseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  try {
    // Handle different input types
    if (dateValue instanceof Date) {
      return isValid(dateValue) ? dateValue : null;
    }
    
    if (typeof dateValue === 'string') {
      // Try parseISO first for ISO strings
      const isoDate = parseISO(dateValue);
      if (isValid(isoDate)) return isoDate;
      
      // Fallback to new Date()
      const fallbackDate = new Date(dateValue);
      return isValid(fallbackDate) ? fallbackDate : null;
    }
    
    if (typeof dateValue === 'number') {
      const numDate = new Date(dateValue);
      return isValid(numDate) ? numDate : null;
    }
    
    // Try direct Date conversion as last resort
    const directDate = new Date(dateValue);
    return isValid(directDate) ? directDate : null;
    
  } catch (error) {
    console.warn('Date parsing error:', error, 'for input:', dateValue);
    return null;
  }
};

/**
 * Safe date validation
 * @param date - Date to validate
 * @returns boolean indicating if date is valid
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  try {
    if (date instanceof Date) {
      return isValid(date) && !isNaN(date.getTime());
    }
    
    const parsed = parseDate(date);
    return parsed !== null && isValid(parsed);
  } catch (error) {
    return false;
  }
};

/**
 * Safe date formatter with fallback
 * @param date - Date to format
 * @returns Formatted date string or fallback message
 */
export const formatDateTime = (date: any): string => {
  if (!date) return 'Waktu tidak valid';
  
  try {
    const dateObj = parseDate(date);
    
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
 * Safe date conversion to ISO string
 * @param date - Date to convert
 * @returns ISO string or null if invalid
 */
export const toISOString = (date: any): string | null => {
  try {
    const dateObj = parseDate(date);
    if (!dateObj || !isValidDate(dateObj)) {
      return null;
    }
    return dateObj.toISOString();
  } catch (error) {
    console.warn('Date conversion error:', error, 'for date:', date);
    return null;
  }
};

/**
 * Format date range for display - FIXED VERSION
 * @param from - Start date
 * @param to - End date  
 * @returns Formatted date range string
 */
export const formatDateRange = (from: Date | string | null | undefined, to: Date | string | null | undefined): string => {
  try {
    console.log('formatDateRange called with:', { from, to });
    
    const fromDate = parseDate(from);
    if (!fromDate || !isValidDate(fromDate)) {
      console.log('Invalid from date:', from);
      return "Pilih rentang tanggal";
    }

    const toDate = parseDate(to);
    
    // If no 'to' date or same day
    if (!toDate || !isValidDate(toDate) || fromDate.toDateString() === toDate.toDateString()) {
      return format(fromDate, "dd MMM yyyy", { locale: id });
    }
    
    // Different dates - show range
    return `${format(fromDate, "dd MMM", { locale: id })} - ${format(toDate, "dd MMM yyyy", { locale: id })}`;
    
  } catch (error) {
    console.error('Date range formatting error:', error, 'for range:', { from, to });
    return "Tanggal tidak valid";
  }
};

/**
 * Format date for display (simple version)
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = parseDate(date);
    if (!dateObj || !isValidDate(dateObj)) {
      return '-';
    }
    
    return format(dateObj, "dd MMM yyyy", { locale: id });
  } catch (error) {
    console.warn('Simple date formatting error:', error, 'for date:', date);
    return '-';
  }
};

// ==================== DATE RANGE PRESETS ====================

export interface DateRangePreset {
  label: string;
  range: {
    from: Date;
    to: Date;
  };
}

/**
 * Get date presets with safe date objects
 * @returns Array of date range presets
 */
export const getDatePresets = (): DateRangePreset[] => {
  try {
    const today = new Date();
    
    // Validate today's date
    if (!isValidDate(today)) {
      console.error('Invalid current date, using fallback');
      const fallbackDate = new Date(Date.now());
      return [{
        label: "Fallback - Hari Ini",
        range: { from: startOfDay(fallbackDate), to: endOfDay(fallbackDate) }
      }];
    }
    
    return [
      { 
        label: "Hari Ini", 
        range: { from: startOfDay(today), to: endOfDay(today) } 
      },
      { 
        label: "Kemarin", 
        range: { 
          from: startOfDay(subDays(today, 1)), 
          to: endOfDay(subDays(today, 1)) 
        } 
      },
      { 
        label: "7 Hari Terakhir", 
        range: { from: startOfDay(subDays(today, 6)), to: endOfDay(today) } 
      },
      { 
        label: "30 Hari Terakhir", 
        range: { from: startOfDay(subDays(today, 29)), to: endOfDay(today) } 
      },
      { 
        label: "Bulan Ini", 
        range: { from: startOfMonth(today), to: endOfMonth(today) } 
      },
      { 
        label: "Bulan Lalu", 
        range: { 
          from: startOfMonth(subMonths(today, 1)), 
          to: endOfMonth(subMonths(today, 1)) 
        } 
      },
    ];
  } catch (error) {
    console.error('Error generating date presets:', error);
    // Return a safe fallback
    const fallbackDate = new Date(Date.now());
    return [{
      label: "Error - Hari Ini",
      range: { from: startOfDay(fallbackDate), to: endOfDay(fallbackDate) }
    }];
  }
};

/**
 * Get preset by key
 * @param key - Preset key (today, yesterday, last7days, etc.)
 * @returns Date range or null if invalid
 */
export const getDatePresetByKey = (key: string): { from: Date; to: Date } | null => {
  try {
    const today = new Date();
    if (!isValidDate(today)) return null;
    
    switch (key) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'yesterday':
        return { 
          from: startOfDay(subDays(today, 1)), 
          to: endOfDay(subDays(today, 1)) 
        };
      case 'last7days':
        return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
      case 'last30days':
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'lastMonth':
        return { 
          from: startOfMonth(subMonths(today, 1)), 
          to: endOfMonth(subMonths(today, 1)) 
        };
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting date preset:', error, 'for key:', key);
    return null;
  }
};

// ==================== UTILITY FUNCTIONS ====================

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
 * Check if date is in range
 * @param date - Date to check
 * @param startDate - Range start
 * @param endDate - Range end
 * @returns boolean indicating if date is in range
 */
export const isDateInRange = (
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean => {
  try {
    const targetDate = parseDate(date);
    const rangeStart = parseDate(startDate);
    const rangeEnd = parseDate(endDate);
    
    if (!targetDate || !isValidDate(targetDate)) return false;
    if (!rangeStart || !isValidDate(rangeStart)) return false;
    if (!rangeEnd || !isValidDate(rangeEnd)) return false;
    
    return targetDate >= rangeStart && targetDate <= rangeEnd;
  } catch (error) {
    console.warn('Date range check error:', error);
    return false;
  }
};

/**
 * Get days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between dates
 */
export const getDaysBetween = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number => {
  try {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    if (!start || !end || !isValidDate(start) || !isValidDate(end)) {
      return 0;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Days between calculation error:', error);
    return 0;
  }
};

/**
 * Format relative time (e.g., "2 hari yang lalu")
 * @param date - Date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'Tidak ada tanggal';
  
  try {
    const parsedDate = parseDate(date);
    if (!parsedDate || !isValidDate(parsedDate)) {
      return 'Tanggal tidak valid';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays === -1) return 'Besok';
    if (diffDays > 1) return `${diffDays} hari yang lalu`;
    if (diffDays < -1) return `${Math.abs(diffDays)} hari lagi`;
    
    return formatDate(parsedDate);
  } catch (error) {
    console.warn('Relative time calculation error:', error, 'for date:', date);
    return 'Tanggal tidak valid';
  }
};

// Export utility objects for organized imports
export const DateUtils = {
  parseDate,
  isValidDate,
  formatDateTime,
  formatDate,
  formatDateRange,
  formatRelativeTime,
  toISOString,
  isDateInRange,
  getDaysBetween
};

export const DatePresetUtils = {
  getDatePresets,
  getDatePresetByKey
};

export const UIUtils = {
  calculatePagination,
  getActivityTypeStyle,
  generateListKey
};