// utils/dashboardUtils.ts - FIXED VERSION
// Import date utilities from centralized dateUtils instead of duplicating

import { 
  safeParseDate, 
  isValidDate, 
  formatDateForDisplay, 
  formatDateRange, 
  getRelativeTimeDescription,
  getDateRangePreset,
  isDateInRange,
  getDaysBetween,
  toSafeISOString,
  DateRange
} from '@/utils/dateUtils';

// Re-export commonly used date functions for backward compatibility
export { 
  safeParseDate as parseDate,
  isValidDate,
  formatDateForDisplay as formatDate,
  formatDateRange,
  getRelativeTimeDescription as formatRelativeTime,
  isDateInRange,
  getDaysBetween,
  toSafeISOString,
  toSafeISOString as toISOString, // Add alias for backward compatibility
  DateRange
} from '@/utils/dateUtils';

// ==================== DATE RANGE PRESETS ====================

export interface DateRangePreset {
  label: string;
  range: {
    from: Date;
    to: Date;
  };
}

/**
 * Get date presets using the centralized dateUtils functions
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
 * Get preset by key using centralized dateUtils
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

// ==================== DASHBOARD-SPECIFIC UTILITIES ====================

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

// Export utility objects for organized imports
export const DateUtils = {
  parseDate: safeParseDate,
  isValidDate,
  formatDateTime,
  formatDate: formatDateForDisplay,
  formatDateRange,
  formatRelativeTime: getRelativeTimeDescription,
  toISOString: toSafeISOString, // Add toISOString alias
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
  generateListKey,
  formatActivityDescription,
  getPriorityColor,
  formatDashboardMetric
};