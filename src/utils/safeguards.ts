// src/utils/safeguards.ts
// Defensive Programming Utilities
// Prevents common runtime errors like boolean iteration, null/undefined access, etc.

import { logger } from '@/utils/logger';
import { userErrorMonitor } from '@/utils/userErrorMonitoring';

// ===========================================
// 🛡️ SAFE ARRAY OPERATIONS
// ===========================================

/**
 * Ensures the input is always an array, even if it's null, undefined, or boolean
 */
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  
  if (value === null || value === undefined || value === false || value === true) {
    logger.debug('safeArray: Converting non-array to empty array', { value, type: typeof value });
    return [];
  }
  
  // If it's a single item, wrap it in an array
  return [value as T];
}

/**
 * Safe map operation that handles non-arrays gracefully
 */
export function safeMap<T, R>(
  value: unknown, 
  mapFn: (item: T, index: number) => R,
  context?: string
): R[] {
  const array = safeArray<T>(value);
  
  if (array.length === 0 && value !== null && value !== undefined) {
    logger.warn(`safeMap: Empty array result in ${context || 'unknown context'}`, { 
      originalValue: value, 
      type: typeof value 
    });
  }
  
  try {
    return array.map(mapFn);
  } catch (error) {
    logger.error(`safeMap: Error in map function for ${context || 'unknown context'}`, error);
    userErrorMonitor.reportCustomError(
      `Safe map operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { context, originalValue: value, error },
      'javascript'
    );
    return [];
  }
}

/**
 * Safe filter operation
 */
export function safeFilter<T>(
  value: unknown,
  filterFn: (item: T, index: number) => boolean,
  context?: string
): T[] {
  const array = safeArray<T>(value);
  
  try {
    return array.filter(filterFn);
  } catch (error) {
    logger.error(`safeFilter: Error in filter function for ${context || 'unknown context'}`, error);
    userErrorMonitor.reportCustomError(
      `Safe filter operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { context, originalValue: value, error },
      'javascript'
    );
    return array; // Return original array on error
  }
}

/**
 * Safe find operation
 */
export function safeFind<T>(
  value: unknown,
  findFn: (item: T, index: number) => boolean,
  context?: string
): T | undefined {
  const array = safeArray<T>(value);
  
  try {
    return array.find(findFn);
  } catch (error) {
    logger.error(`safeFind: Error in find function for ${context || 'unknown context'}`, error);
    userErrorMonitor.reportCustomError(
      `Safe find operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { context, originalValue: value, error },
      'javascript'
    );
    return undefined;
  }
}

// ===========================================
// 🛡️ SAFE OBJECT OPERATIONS
// ===========================================

/**
 * Safe property access with default value
 */
export function safeProp<T, K extends keyof T>(
  obj: T | null | undefined | boolean,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj || typeof obj !== 'object' || obj === true || obj === false) {
    return defaultValue;
  }
  
  return (obj as T)[key] ?? defaultValue;
}

/**
 * Safe nested property access
 */
export function safeAccess<T>(
  obj: unknown,
  path: string | string[],
  defaultValue?: T
): T {
  if (!obj || typeof obj !== 'object' || obj === true || obj === false) {
    return defaultValue as T;
  }
  
  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current: any = obj;
  
  for (const key of pathArray) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue as T;
    }
    current = current[key];
  }
  
  return current ?? defaultValue;
}

/**
 * Safe object keys operation
 */
export function safeObjectKeys(obj: unknown): string[] {
  if (!obj || typeof obj !== 'object' || obj === true || obj === false || Array.isArray(obj)) {
    return [];
  }
  
  try {
    return Object.keys(obj);
  } catch (error) {
    logger.warn('safeObjectKeys: Failed to get object keys', { obj, error });
    return [];
  }
}

/**
 * Safe object values operation
 */
export function safeObjectValues<T>(obj: unknown): T[] {
  if (!obj || typeof obj !== 'object' || obj === true || obj === false || Array.isArray(obj)) {
    return [];
  }
  
  try {
    return Object.values(obj) as T[];
  } catch (error) {
    logger.warn('safeObjectValues: Failed to get object values', { obj, error });
    return [];
  }
}

// ===========================================
// 🛡️ REACT QUERY SAFEGUARDS
// ===========================================

/**
 * Safe React Query data access
 */
export function safeQueryData<T>(
  queryResult: { data?: unknown; isLoading?: boolean; error?: unknown },
  defaultValue: T,
  context?: string
): T {
  const { data, isLoading, error } = queryResult;
  
  if (isLoading) {
    logger.debug(`safeQueryData: Query loading for ${context || 'unknown'}`);
    return defaultValue;
  }
  
  if (error) {
    logger.warn(`safeQueryData: Query error for ${context || 'unknown'}`, error);
    userErrorMonitor.reportCustomError(
      `Query error in ${context || 'unknown context'}`,
      { error, queryResult },
      'api'
    );
    return defaultValue;
  }
  
  if (data === undefined || data === null || data === false) {
    logger.debug(`safeQueryData: Empty/null data for ${context || 'unknown'}`, { data });
    return defaultValue;
  }
  
  return data as T;
}

/**
 * Safe React Query array data
 */
export function safeQueryArray<T>(
  queryResult: { data?: unknown; isLoading?: boolean; error?: unknown },
  context?: string
): T[] {
  const safeData = safeQueryData(queryResult, [], context);
  return safeArray<T>(safeData);
}

// ===========================================
// 🛡️ CONTEXT PROVIDER SAFEGUARDS
// ===========================================

/**
 * Safe context value access with error reporting
 */
export function safeContextValue<T>(
  contextValue: T | null | undefined,
  contextName: string,
  defaultValue: T
): T {
  if (contextValue === null || contextValue === undefined) {
    logger.error(`safeContextValue: ${contextName} context is null/undefined`);
    userErrorMonitor.reportCustomError(
      `Context ${contextName} is not available`,
      { contextName, contextValue },
      'react'
    );
    return defaultValue;
  }
  
  return contextValue;
}

// ===========================================
// 🛡️ ASYNC OPERATION SAFEGUARDS
// ===========================================

/**
 * Safe async operation with timeout and error handling
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  options: {
    timeout?: number;
    defaultValue: T;
    context?: string;
    retries?: number;
  }
): Promise<T> {
  const { timeout = 10000, defaultValue, context = 'unknown', retries = 0 } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const promise = asyncFn();
      
      if (timeout > 0) {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
        );
        
        return await Promise.race([promise, timeoutPromise]);
      }
      
      return await promise;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        logger.warn(`safeAsync: Retrying ${context} (attempt ${attempt + 1}/${retries + 1})`, error);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // Exponential backoff
      }
    }
  }
  
  logger.error(`safeAsync: Failed after ${retries + 1} attempts for ${context}`, lastError!);
  userErrorMonitor.reportCustomError(
    `Async operation failed: ${lastError!.message}`,
    { context, retries, error: lastError! },
    'api'
  );
  
  return defaultValue;
}

// ===========================================
// 🛡️ COMPONENT SAFEGUARDS
// ===========================================

/**
 * Safe component wrapper for error boundaries
 */
export function withSafeguards<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function SafeguardedComponent(props: P) {
    try {
      return <Component {...props} />;
    } catch (error) {
      logger.error(`Component ${componentName} render error`, error);
      userErrorMonitor.reportRenderError(componentName, error as Error, props);
      
      // Return fallback UI
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-800 text-sm">
            Component {componentName} failed to render
          </div>
        </div>
      );
    }
  };
}

// ===========================================
// 🛡️ TYPE GUARDS
// ===========================================

export function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isValidObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// ===========================================
// 🛡️ DEVELOPMENT HELPERS
// ===========================================

/**
 * Development-only type checker that logs warnings
 */
export function devTypeCheck(value: unknown, expectedType: string, context: string) {
  if (!import.meta.env.DEV) return;
  
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  
  if (actualType !== expectedType) {
    logger.warn(`devTypeCheck: Type mismatch in ${context}`, {
      expected: expectedType,
      actual: actualType,
      value: value
    });
  }
}

/**
 * Runtime assertion with error reporting
 */
export function assert(condition: boolean, message: string, context?: string) {
  if (!condition) {
    const error = new Error(`Assertion failed: ${message}`);
    logger.error(`Assertion failed in ${context || 'unknown context'}`, error);
    userErrorMonitor.reportCustomError(
      `Assertion failed: ${message}`,
      { context },
      'javascript'
    );
    throw error;
  }
}