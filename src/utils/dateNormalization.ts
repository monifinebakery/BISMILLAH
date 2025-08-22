// src/utils/dateNormalization.ts
// Centralized date normalization utility to ensure consistent date handling

/**
 * Normalize date for database queries (YYYY-MM-DD format)
 * Avoids timezone conversion issues by using local date components
 */
export const normalizeDateForDatabase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Normalize date range for consistent filtering
 * Ensures start date is at beginning of day and end date is at end of day
 */
export const normalizeDateRange = (from: Date, to: Date) => {
  const startDate = new Date(from);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(to);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    startDate,
    endDate,
    startYMD: normalizeDateForDatabase(startDate),
    endYMD: normalizeDateForDatabase(endDate)
  };
};

/**
 * Parse database date string to local Date object
 * Handles both YYYY-MM-DD and full ISO strings
 */
export const parseDatabaseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // If it's just YYYY-MM-DD, treat as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Otherwise parse as ISO string
  return new Date(dateStr);
};

/**
 * Check if a date falls within a date range (inclusive)
 * Uses string comparison to avoid timezone issues
 */
export const isDateInRange = (
  date: Date | string,
  startDate: Date,
  endDate: Date
): boolean => {
  let dateStr: string;
  
  if (typeof date === 'string') {
    // If it's already a string, extract date part
    dateStr = date.includes('T') 
      ? date.split('T')[0] 
      : date;
  } else {
    dateStr = normalizeDateForDatabase(date);
  }
  
  const startStr = normalizeDateForDatabase(startDate);
  const endStr = normalizeDateForDatabase(endDate);
  
  return dateStr >= startStr && dateStr <= endStr;
};

/**
 * Get days in a month for accurate OpEx calculation
 */
export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

/**
 * Generate day list between two dates (inclusive)
 */
export const generateDayList = (startDate: Date, endDate: Date): string[] => {
  const days: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize to avoid timezone issues
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    days.push(normalizeDateForDatabase(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

/**
 * Calculate accurate daily OpEx for a specific date
 * Accounts for different month lengths
 */
export const calculateDailyOpEx = (monthlyOpEx: number, targetDate: Date): number => {
  const daysInMonth = getDaysInMonth(targetDate);
  return daysInMonth > 0 ? monthlyOpEx / daysInMonth : 0;
};