// 🎯 60 lines - Date utilities
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const safeParseDate = (dateInput: any): Date | null => {
  try {
    if (!dateInput) return null;
    
    if (dateInput instanceof Date) {
      return isValidDate(dateInput) ? dateInput : null;
    }
    
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isValidDate(parsed) ? parsed : null;
    }
    
    if (typeof dateInput === 'number') {
      const parsed = new Date(dateInput);
      return isValidDate(parsed) ? parsed : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error, dateInput);
    return null;
  }
};

export const toSafeISOString = (date: Date): string => {
  try {
    if (!isValidDate(date)) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error converting date to ISO:', error, date);
    return new Date().toISOString();
  }
};

export const formatDateForDisplay = (date: Date | string | null): string => {
  try {
    if (!date) return '-';
    
    const parsedDate = safeParseDate(date);
    if (!parsedDate) return '-';
    
    return parsedDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return '-';
  }
};

export const formatDateTimeForDisplay = (date: Date | string | null): string => {
  try {
    if (!date) return '-';
    
    const parsedDate = safeParseDate(date);
    if (!parsedDate) return '-';
    
    return parsedDate.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error, date);
    return '-';
  }
};