// src/utils/debounce.ts - Debounce and Throttle Utilities
// Used to prevent render loops and excessive function calls

/**
 * Debounce function - delays execution until after wait time has passed
 * since the last time the function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let result: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) result = func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) result = func(...args);

    return result;
  };
}

/**
 * Throttle function - limits execution to once per limit period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

/**
 * Advanced debounce with cancel and flush capabilities
 */
export function debounceAdvanced<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;
  let result: ReturnType<T>;
  let lastArgs: Parameters<T>;

  const debounced = function executedFunction(...args: Parameters<T>) {
    lastArgs = args;

    const later = () => {
      timeout = null;
      if (!immediate) result = func(...lastArgs);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) result = func(...args);

    return result;
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      result = func(...lastArgs);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Leading and trailing throttle - executes at both start and end
 */
export function throttleLeadingTrailing<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!lastRan) {
      lastResult = func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          lastResult = func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
    return lastResult;
  };
}

/**
 * Smart debounce for async functions with error handling
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeout: NodeJS.Timeout | null = null;
  let latestResolve: ((value: Awaited<ReturnType<T>>) => void) | null = null;
  let latestReject: ((reason: any) => void) | null = null;

  return function executedFunction(...args: Parameters<T>) {
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      // Store the latest promise handlers
      latestResolve = resolve;
      latestReject = reject;

      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (latestResolve) latestResolve(result);
        } catch (error) {
          if (latestReject) latestReject(error);
        }
        timeout = null;
        latestResolve = null;
        latestReject = null;
      }, wait);
    });
  };
}
