// utils/index.ts - Utils Exports

import { DEVICE_BREAKPOINTS, INPUT_PATTERNS } from './constants';
import { safeDom } from '@/utils/browserApiSafeWrappers';


// 🔢 Calculation utilities
export {
  calculatePromoResult,
  analyzeMargin,
  findOptimalDiscount,
  calculateBreakEven,
  calculateBulkPromos,
  compareWithCompetitors,
  calculateROI,
  estimatePriceElasticity,
  calculateFinancialMetrics,
  validateCalculationInput,
  roundToDecimal,
  calculatePercentageChange,
  interpolateValue,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation
} from './calculationUtils';

// 🎨 Formatting utilities
export {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,
  truncateText,
  capitalizeFirst,
  toTitleCase,
  formatPromoType,
  formatPromoDetails,
  formatFileSize,
  formatDuration,
  formatPhoneNumber,
  formatDecimal,
  formatMarginColor,
  formatStatusColor,
  parseCurrency,
  parsePercentage,
  formatCalculationSummary,
  formatChartValue,
  highlightSearchTerm,
  getResponsiveText,
  formatValidationMessage
} from './formatUtils';

// 🎯 Constants
export {
  PROMO_TYPES,
  PROMO_TYPE_LABELS,
  VALIDATION_RULES,
  MARGIN_THRESHOLDS,
  MARGIN_COLORS,
  UI_CONFIG,
  BREAKPOINTS,
  STATUS_TYPES,
  CHART_CONFIG,
  INPUT_PATTERNS,
  FILE_CONFIG,
  API_CONFIG,
  PERFORMANCE_THRESHOLDS,
  SEARCH_CONFIG,
  DATE_FORMATS,
  LOCALES,
  CURRENCY_CONFIG,
  SECURITY_CONFIG,
  ANALYTICS_EVENTS,
  FEATURE_FLAGS,
  LOADING_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_VALUES,
  CALCULATION_CONSTANTS,
  ANIMATION_DURATIONS,
  DEVICE_BREAKPOINTS,
  FILTER_OPTIONS,
  CONSTANTS
} from './constants';

// 🔧 Utility functions
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substr(2, 9);
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${randomString}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const isValidEmail = (email: string): boolean => {
  return INPUT_PATTERNS.EMAIL.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return INPUT_PATTERNS.PHONE.test(phone);
};

export const sanitizeString = (str: string): string => {
  return str.replace(/[<>"/\\&]/g, '');
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = safeDom.createElement('a') as HTMLAnchorElement;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = safeDom.createElement('textarea') as HTMLTextAreaElement;
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  }
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < DEVICE_BREAKPOINTS.MOBILE) return 'mobile';
  if (width < DEVICE_BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  return {
    browser,
    userAgent: ua,
    platform: navigator.platform,
    language: navigator.language
  };
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

export const parseQueryString = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

// 📊 Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// 📅 Date utilities
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  
  return formatDate(date);
};

// 📱 WhatsApp utilities
export {
  sendWhatsApp,
  sendWhatsAppForOrder,
  formatWhatsAppNumber,
  isValidWhatsAppNumber,
  getWhatsAppChatURL,
} from './whatsappHelpers';

// ✅ Validation utilities
export {
  validateNumber,
  validateRequired,
  validateEmail,
  validatePositiveInteger,
  getErrorMessage
} from './validation';
