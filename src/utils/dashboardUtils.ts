// utils/dashboardUtils.ts - FIXED VERSION
// No more "Invalid time value" errors!

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
 * 🔧 FIXED: Enhanced safe date parsing with better error handling
 */
export const safeParseDate = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    // Handle Date objects first
    if (date instanceof Date) {
      // 🔧 FIX: Check for invalid Date objects (NaN time)
      if (isNaN(date.getTime())) {
        console.warn('Invalid Date object detected:', date);
        return null;
      }
      return isValid(date) ? date : null;
    }
    
    // Handle string and number inputs
    if (typeof date === 'string' || typeof date === 'number') {
      let parsed: Date;
      
      if (typeof date === 'string') {
        // Clean the string first
        const cleanDate = date.trim();
        if (!cleanDate || cleanDate === 'null' || cleanDate === 'undefined') {
          return null;
        }
        
        // 🔧 FIX: Handle common invalid date strings
        if (cleanDate === '0000-00-00' || cleanDate === '0000-00-00T00:00:00.000Z') {
          return null;
        }
        
        // Try parseISO first for ISO strings
        if (cleanDate.includes('T') || cleanDate.includes('-')) {
          try {
            parsed = parseISO(cleanDate);
            if (isValid(parsed) && !isNaN(parsed.getTime())) {
              return parsed;
            }
          } catch (parseISOError) {
            console.warn('parseISO failed for:', cleanDate, parseISOError);
          }
        }
        
        // Fallback to new Date()
        try {
          parsed = new Date(cleanDate);
        } catch (newDateError) {
          console.warn('new Date() failed for:', cleanDate, newDateError);
          return null;
        }
      } else {
        // Handle number (timestamp)
        try {
          parsed = new Date(date);
        } catch (timestampError) {
          console.warn('Date from timestamp failed for:', date, timestampError);
          return null;
        }
      }
      
      // 🔧 FIX: Enhanced validation
      if (isValid(parsed) && !isNaN(parsed.getTime()) && parsed.getTime() > 0) {
        return parsed;
      }
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
 * 🔧 FIXED: Enhanced date validation
 */
export const isValidDate = (value: any): value is Date => {
  if (!value) return false;
  
  try {
    // If it's already a Date object, validate it directly
    if (value instanceof Date) {
      return isValid(value) && !isNaN(value.getTime()) && value.getTime() > 0;
    }
    
    // Otherwise, try to parse it first
    const date = safeParseDate(value);
    return date !== null && isValid(date) && !isNaN(date.getTime());
  } catch (error) {
    console.warn('Date validation error:', error, 'for value:', value);
    return false;
  }
};

/**
 * 🔧 FIXED: Safe ISO string conversion
 */
export const toSafeISOString = (dateValue: Date | string | null | undefined): string | null => {
  try {
    const dateObj = safeParseDate(dateValue);
    if (!dateObj || !isValidDate(dateObj)) return null;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('ISO string conversion error:', error, 'for date:', dateValue);
    return null;
  }
};

// Alias for backward compatibility
export const toISOString = toSafeISOString;

/**
 * 🔧 FIXED: Safe date formatting for display
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  try {
    const dateObj = safeParseDate(date);
    if (!dateObj || !isValidDate(dateObj)) return '-';
    return format(dateObj, 'd MMM yyyy', { locale: id });
  } catch (error) {
    console.warn('Display date formatting error:', error, 'for date:', date);
    return '-';
  }
};

// Alias for backward compatibility
export const formatDate = formatDateForDisplay;

/**
 * 🔧 FIXED: Safe YYYY-MM-DD formatting
 */
export const formatDateToYYYYMMDD = (date: Date | string | null | undefined): string => {
  try {
    const dateObj = safeParseDate(date);
    if (!dateObj || !isValidDate(dateObj)) return '';
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('YYYY-MM-DD formatting error:', error, 'for date:', date);
    return '';
  }
};

/**
 * 🔧 FIXED: Bulletproof date range formatting - This was the main culprit!
 */
export const formatDateRange = (dateRange: DateRange | undefined): string => {
  try {
    // Early return for undefined/null range
    if (!dateRange) {
      console.log('formatDateRange: No dateRange provided');
      return "Pilih rentang tanggal";
    }

    // Early return if no 'from' date
    if (!dateRange.from) {
      console.log('formatDateRange: No from date in range');
      return "Pilih rentang tanggal";
    }
    
    // 🔧 FIX: Safe parsing with validation
    const fromDate = safeParseDate(dateRange.from);
    if (!fromDate || !isValidDate(fromDate)) {
      console.warn('formatDateRange: Invalid from date:', dateRange.from);
      return "Tanggal mulai tidak valid";
    }
    
    // Handle single date case (no 'to' date or invalid 'to' date)
    if (!dateRange.to) {
      try {
        return format(fromDate, "d MMMM yyyy", { locale: id });
      } catch (formatError) {
        console.error('formatDateRange: Single date format error:', formatError);
        return formatDateForDisplay(fromDate);
      }
    }
    
    // Parse 'to' date safely
    const toDate = safeParseDate(dateRange.to);
    if (!toDate || !isValidDate(toDate)) {
      console.warn('formatDateRange: Invalid to date, using single date format');
      try {
        return format(fromDate, "d MMMM yyyy", { locale: id });
      } catch (formatError) {
        console.error('formatDateRange: Fallback single date format error:', formatError);
        return formatDateForDisplay(fromDate);
      }
    }
    
    // Format date range (both dates are valid)
    try {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');
      
      // Same date
      if (fromStr === toStr) {
        return format(fromDate, "d MMMM yyyy", { locale: id });
      }
      
      // Different dates - show range
      return `${format(fromDate, "d MMM", { locale: id })} - ${format(toDate, "d MMM yyyy", { locale: id })}`;
      
    } catch (formatError) {
      console.error('formatDateRange: Range format error:', formatError);
      // Fallback to basic display format
      return `${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(toDate)}`;
    }
    
  } catch (error) {
    console.error('formatDateRange: Unexpected error:', error, 'for dateRange:', dateRange);
    return "Error: Tanggal tidak valid";
  }
};

/**
 * 🔧 FIXED: Enhanced date-time formatter
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
    console.warn('DateTime formatting error:', error, 'for date:', date);
    return 'Waktu tidak valid';
  }
};

/**
 * 🔧 FIXED: Safe relative time description
 */
export const getRelativeTimeDescription = (date: Date | string | null | undefined): string => {
  try {
    const parsedDate = safeParseDate(date);
    if (!parsedDate || !isValidDate(parsedDate)) return 'Tanggal tidak valid';
    
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (format(now, 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Hari ini';
    if (format(subDays(now, 1), 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Kemarin';

    if (diffDays > 1 && diffDays <= 30) return `${diffDays} hari yang lalu`;
    
    return formatDateForDisplay(parsedDate);
  } catch (error) {
    console.warn('Relative time error:', error, 'for date:', date);
    return 'Tanggal tidak valid';
  }
};

// Alias for backward compatibility
export const formatRelativeTime = getRelativeTimeDescription;

// ==================== DATE RANGE UTILITIES ====================

/**
 * 🔧 FIXED: Safe date range preset generation
 */
export const getDateRangePreset = (key: string): { from: Date, to: Date } => {
  const today = new Date();
  
  // 🔧 FIX: Validate that today is a valid date
  if (!isValidDate(today)) {
    console.error('System date is invalid!');
    const fallbackDate = new Date('2024-01-01');
    return { from: fallbackDate, to: fallbackDate };
  }
  
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
        console.warn('Unknown date preset key:', key, 'using last30days');
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    }
  } catch (error) {
    console.error('Error creating date range preset:', error, 'for key:', key);
    // Safe fallback to today
    return { from: startOfDay(today), to: endOfDay(today) };
  }
};

/**
 * 🔧 FIXED: Safe date presets array generation
 */
export const getDatePresets = (): DateRangePreset[] => {
  try {
    const presetKeys = ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth'];
    const labels = ["Hari Ini", "Kemarin", "7 Hari Terakhir", "30 Hari Terakhir", "Bulan Ini", "Bulan Lalu"];
    
    return presetKeys.map((key, index) => {
      try {
        return {
          label: labels[index],
          range: getDateRangePreset(key)
        };
      } catch (error) {
        console.error('Error generating preset:', key, error);
        // Return safe fallback preset
        return {
          label: `Error - ${labels[index]}`,
          range: getDateRangePreset('today')
        };
      }
    });
  } catch (error) {
    console.error('Error generating date presets:', error);
    // Return minimal safe fallback
    return [{
      label: "Hari Ini",
      range: getDateRangePreset('today')
    }];
  }
};

/**
 * 🔧 FIXED: Safe preset by key getter
 */
export const getDatePresetByKey = (key: string): { from: Date; to: Date } => {
  try {
    if (!key || typeof key !== 'string') {
      console.warn('Invalid preset key:', key, 'using today');
      return getDateRangePreset('today');
    }
    return getDateRangePreset(key);
  } catch (error) {
    console.error('Error getting date preset:', error, 'for key:', key);
    return getDateRangePreset('today'); // Safe fallback
  }
};

/**
 * 🔧 FIXED: Safe date range checking
 */
export const isDateInRange = (
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean => {
  try {
    const targetDate = safeParseDate(date);
    const rangeStart = safeParseDate(startDate);
    const rangeEnd = safeParseDate(endDate);
    
    if (!targetDate || !rangeStart || !rangeEnd) return false;
    if (!isValidDate(targetDate) || !isValidDate(rangeStart) || !isValidDate(rangeEnd)) return false;
    
    return targetDate >= rangeStart && targetDate <= rangeEnd;
  } catch (error) {
    console.warn('Date range check error:', error);
    return false;
  }
};

/**
 * 🔧 FIXED: Safe days calculation
 */
export const getDaysBetween = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number => {
  try {
    const start = safeParseDate(startDate);
    const end = safeParseDate(endDate);
    
    if (!start || !end || !isValidDate(start) || !isValidDate(end)) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Days calculation error:', error);
    return 0;
  }
};

/**
 * 🔧 FIXED: Safe start of day
 */
export const getStartOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  try {
    const parsed = safeParseDate(dateObj);
    return parsed && isValidDate(parsed) ? startOfDay(parsed) : null;
  } catch (error) {
    console.warn('Start of day error:', error);
    return null;
  }
};

/**
 * 🔧 FIXED: Safe end of day
 */
export const getEndOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  try {
    const parsed = safeParseDate(dateObj);
    return parsed && isValidDate(parsed) ? endOfDay(parsed) : null;
  } catch (error) {
    console.warn('End of day error:', error);
    return null;
  }
};

// ==================== DASHBOARD-SPECIFIC UTILITIES ====================

/**
 * Safe pagination calculation
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
 * 🔧 FIXED: Safe dashboard metric formatting
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
export const DateUtils = {
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