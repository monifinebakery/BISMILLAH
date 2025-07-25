// utils/dashboardUtils.ts - FIXED EXPORTS VERSION
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

// ==================== CORE FUNCTIONS ====================

export const safeParseDate = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        console.warn('Invalid Date object detected:', date);
        return null;
      }
      return isValid(date) ? date : null;
    }
    
    if (typeof date === 'string' || typeof date === 'number') {
      let parsed: Date;
      
      if (typeof date === 'string') {
        const cleanDate = date.trim();
        if (!cleanDate || cleanDate === 'null' || cleanDate === 'undefined') {
          return null;
        }
        
        if (cleanDate === '0000-00-00' || cleanDate === '0000-00-00T00:00:00.000Z') {
          return null;
        }
        
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
        
        try {
          parsed = new Date(cleanDate);
        } catch (newDateError) {
          console.warn('new Date() failed for:', cleanDate, newDateError);
          return null;
        }
      } else {
        try {
          parsed = new Date(date);
        } catch (timestampError) {
          console.warn('Date from timestamp failed for:', date, timestampError);
          return null;
        }
      }
      
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

export const parseDate = safeParseDate;

export const isValidDate = (value: any): value is Date => {
  if (!value) return false;
  
  try {
    if (value instanceof Date) {
      return isValid(value) && !isNaN(value.getTime()) && value.getTime() > 0;
    }
    
    const date = safeParseDate(value);
    return date !== null && isValid(date) && !isNaN(date.getTime());
  } catch (error) {
    console.warn('Date validation error:', error, 'for value:', value);
    return false;
  }
};

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

export const toISOString = toSafeISOString;

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

export const formatDate = formatDateForDisplay;

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

// 🔧 FIXED: The main function that was causing issues
export const formatDateRange = (dateRange: DateRange | undefined): string => {
  try {
    if (!dateRange) {
      console.log('formatDateRange: No dateRange provided');
      return "Pilih rentang tanggal";
    }

    if (!dateRange.from) {
      console.log('formatDateRange: No from date in range');
      return "Pilih rentang tanggal";
    }
    
    const fromDate = safeParseDate(dateRange.from);
    if (!fromDate || !isValidDate(fromDate)) {
      console.warn('formatDateRange: Invalid from date:', dateRange.from);
      return "Tanggal mulai tidak valid";
    }
    
    if (!dateRange.to) {
      try {
        return format(fromDate, "d MMMM yyyy", { locale: id });
      } catch (formatError) {
        console.error('formatDateRange: Single date format error:', formatError);
        return formatDateForDisplay(fromDate);
      }
    }
    
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
    
    try {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');
      
      if (fromStr === toStr) {
        return format(fromDate, "d MMMM yyyy", { locale: id });
      }
      
      return `${format(fromDate, "d MMM", { locale: id })} - ${format(toDate, "d MMM yyyy", { locale: id })}`;
      
    } catch (formatError) {
      console.error('formatDateRange: Range format error:', formatError);
      return `${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(toDate)}`;
    }
    
  } catch (error) {
    console.error('formatDateRange: Unexpected error:', error, 'for dateRange:', dateRange);
    return "Error: Tanggal tidak valid";
  }
};

// 🔧 FIXED: The function causing "r is not a function" error
export const getDateRangePreset = (key: string): { from: Date, to: Date } => {
  console.log('🔧 getDateRangePreset called with key:', key);
  
  const today = new Date();
  
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
    return { from: startOfDay(today), to: endOfDay(today) };
  }
};

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

export const formatRelativeTime = getRelativeTimeDescription;

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
        return {
          label: `Error - ${labels[index]}`,
          range: getDateRangePreset('today')
        };
      }
    });
  } catch (error) {
    console.error('Error generating date presets:', error);
    return [{
      label: "Hari Ini",
      range: getDateRangePreset('today')
    }];
  }
};

export const getDatePresetByKey = (key: string): { from: Date; to: Date } => {
  try {
    if (!key || typeof key !== 'string') {
      console.warn('Invalid preset key:', key, 'using today');
      return getDateRangePreset('today');
    }
    return getDateRangePreset(key);
  } catch (error) {
    console.error('Error getting date preset:', error, 'for key:', key);
    return getDateRangePreset('today');
  }
};

// ==================== EXPLICIT DEFAULT EXPORT ====================

// 🔧 CRITICAL FIX: Explicit default export with all functions
const dashboardUtils = {
  // Core functions
  safeParseDate,
  parseDate,
  isValidDate,
  toSafeISOString,
  toISOString,
  formatDateForDisplay,
  formatDate,
  formatDateToYYYYMMDD,
  formatDateRange,
  formatDateTime,
  getRelativeTimeDescription,
  formatRelativeTime,
  
  // Date range functions
  getDateRangePreset,
  getDatePresets,
  getDatePresetByKey,
  
  // Utility functions
  isDateInRange: (
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
  },
  
  getDaysBetween: (
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
  },
  
  getStartOfDay: (dateObj: Date | string | null | undefined): Date | null => {
    try {
      const parsed = safeParseDate(dateObj);
      return parsed && isValidDate(parsed) ? startOfDay(parsed) : null;
    } catch (error) {
      console.warn('Start of day error:', error);
      return null;
    }
  },
  
  getEndOfDay: (dateObj: Date | string | null | undefined): Date | null => {
    try {
      const parsed = safeParseDate(dateObj);
      return parsed && isValidDate(parsed) ? endOfDay(parsed) : null;
    } catch (error) {
      console.warn('End of day error:', error);
      return null;
    }
  }
};

// 🔧 CRITICAL: Export as default
export default dashboardUtils;

// 🔧 CRITICAL: Also expose to global for debugging
if (typeof window !== 'undefined') {
  (window as any).dashboardUtils = dashboardUtils;
  (window as any).getDateRangePreset = getDateRangePreset;
  (window as any).formatDateRange = formatDateRange;
  console.log('✅ Dashboard utils exposed to global scope');
}