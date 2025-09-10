// Runtime safety utilities untuk mencegah error di production
import { logger } from './logger';

/**
 * Safe parser untuk JSON dengan fallback
 */
export function safeJsonParse<T = any>(
  jsonString: string | null | undefined, 
  fallback: T
): T {
  if (!jsonString) return fallback;
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed ?? fallback;
  } catch (error) {
    logger.warn('JSON parse error:', { jsonString, error });
    return fallback;
  }
}

/**
 * Safe accessor untuk nested objects
 */
export function safeGet<T = any>(
  obj: any, 
  path: string, 
  defaultValue?: T
): T | undefined {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null) return defaultValue;
      result = result[key];
    }
    
    return result ?? defaultValue;
  } catch (error) {
    logger.warn('Safe get error:', { path, error });
    return defaultValue;
  }
}

/**
 * Safe array operations
 */
export const safeArray = {
  map: <T, R>(
    arr: T[] | null | undefined, 
    fn: (item: T, index: number) => R,
    fallback: R[] = []
  ): R[] => {
    if (!Array.isArray(arr)) {
      logger.warn('safeArray.map called on non-array:', arr);
      return fallback;
    }
    try {
      return arr.map(fn);
    } catch (error) {
      logger.error('Error in safeArray.map:', error);
      return fallback;
    }
  },

  filter: <T>(
    arr: T[] | null | undefined,
    fn: (item: T, index: number) => boolean,
    fallback: T[] = []
  ): T[] => {
    if (!Array.isArray(arr)) {
      logger.warn('safeArray.filter called on non-array:', arr);
      return fallback;
    }
    try {
      return arr.filter(fn);
    } catch (error) {
      logger.error('Error in safeArray.filter:', error);
      return fallback;
    }
  },

  find: <T>(
    arr: T[] | null | undefined,
    fn: (item: T, index: number) => boolean,
    fallback?: T
  ): T | undefined => {
    if (!Array.isArray(arr)) {
      logger.warn('safeArray.find called on non-array:', arr);
      return fallback;
    }
    try {
      return arr.find(fn) ?? fallback;
    } catch (error) {
      logger.error('Error in safeArray.find:', error);
      return fallback;
    }
  },

  reduce: <T, R>(
    arr: T[] | null | undefined,
    fn: (acc: R, item: T, index: number) => R,
    initial: R
  ): R => {
    if (!Array.isArray(arr)) {
      logger.warn('safeArray.reduce called on non-array:', arr);
      return initial;
    }
    try {
      return arr.reduce(fn, initial);
    } catch (error) {
      logger.error('Error in safeArray.reduce:', error);
      return initial;
    }
  }
};

/**
 * Safe localStorage operations
 */
export const safeStorage = {
  getItem: <T = any>(key: string, fallback?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback ?? null;
      
      // Try to parse as JSON
      try {
        return JSON.parse(item);
      } catch {
        // Return as string if not JSON
        return item as any;
      }
    } catch (error) {
      logger.warn('localStorage.getItem error:', { key, error });
      return fallback ?? null;
    }
  },

  setItem: (key: string, value: any): boolean => {
    try {
      const serialized = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      logger.error('localStorage.setItem error:', { key, error });
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error('localStorage.removeItem error:', { key, error });
      return false;
    }
  },

  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      logger.error('localStorage.clear error:', error);
      return false;
    }
  }
};

/**
 * Safe number operations
 */
export const safeNumber = {
  parse: (value: any, fallback: number = 0): number => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    const parsed = Number(value);
    if (isNaN(parsed)) {
      logger.warn('safeNumber.parse NaN:', { value, fallback });
      return fallback;
    }
    
    return parsed;
  },

  parseFloat: (value: any, fallback: number = 0): number => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      logger.warn('safeNumber.parseFloat NaN:', { value, fallback });
      return fallback;
    }
    return parsed;
  },

  parseInt: (value: any, radix: number = 10, fallback: number = 0): number => {
    const parsed = parseInt(value, radix);
    if (isNaN(parsed)) {
      logger.warn('safeNumber.parseInt NaN:', { value, radix, fallback });
      return fallback;
    }
    return parsed;
  },

  toFixed: (value: any, decimals: number = 2, fallback: string = '0'): string => {
    try {
      const num = safeNumber.parse(value, 0);
      return num.toFixed(decimals);
    } catch (error) {
      logger.warn('safeNumber.toFixed error:', { value, decimals, error });
      return fallback;
    }
  }
};

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  errorHandler?: (error: any) => void
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    logger.error('Async operation failed:', error);
    errorHandler?.(error);
    return fallback;
  }
}

/**
 * Safe function call wrapper
 */
export function safeTry<T>(
  fn: () => T,
  fallback?: T,
  errorHandler?: (error: any) => void
): T | undefined {
  try {
    return fn();
  } catch (error) {
    logger.error('Function execution failed:', error);
    errorHandler?.(error);
    return fallback;
  }
}

/**
 * Debounce wrapper with error handling
 */
export function safeDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        fn(...args);
      } catch (error) {
        logger.error('Debounced function error:', error);
      }
    }, delay);
  };
}

/**
 * Type guard untuk null/undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard untuk empty values
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safe date parser
 */
export function safeDate(
  date: any, 
  fallback: Date = new Date()
): Date {
  try {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date;
    }
    
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      logger.warn('Invalid date:', date);
      return fallback;
    }
    
    return parsed;
  } catch (error) {
    logger.error('Date parsing error:', { date, error });
    return fallback;
  }
}

/**
 * Network request dengan retry dan timeout
 */
export async function safeFetch(
  url: string,
  options?: RequestInit & { 
    retries?: number; 
    timeout?: number;
    fallback?: any;
  }
): Promise<Response | null> {
  const { retries = 3, timeout = 10000, fallback = null, ...fetchOptions } = options || {};
  
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // Log non-OK responses
      logger.warn(`Fetch failed with status ${response.status}:`, {
        url,
        status: response.status,
        statusText: response.statusText
      });
      
    } catch (error: any) {
      logger.error(`Fetch attempt ${i + 1} failed:`, {
        url,
        error: error.message
      });
      
      if (i === retries - 1) {
        return fallback;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  return fallback;
}

/**
 * Validate required environment variables
 */
export function validateEnv(required: string[]): boolean {
  const missing: string[] = [];
  
  for (const key of required) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    logger.error('Missing environment variables:', missing);
    return false;
  }
  
  return true;
}

// Export all utilities
export default {
  safeJsonParse,
  safeGet,
  safeArray,
  safeStorage,
  safeNumber,
  safeAsync,
  safeTry,
  safeDebounce,
  isDefined,
  isEmpty,
  safeDate,
  safeFetch,
  validateEnv
};
