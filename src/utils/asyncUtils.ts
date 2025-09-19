// src/utils/asyncUtils.ts
// Small async helpers to avoid common races/leaks

/**
 * Wrap a promise with a timeout that clears itself to avoid unhandled rejections.
 * If the timeout fires first, it rejects with the provided error message.
 * If the underlying promise settles first, the timeout is cleared.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "Operation timeout",
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(label));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      },
    );
  });
}

/**
 * A race that returns a sentinel value instead of rejecting on timeout.
 * Useful when you prefer not to throw, but to treat timeout as a soft-miss.
 */
export async function withSoftTimeout<T>(
  promise: Promise<T>,
  ms: number,
  sentinel: T,
): Promise<T> {
  return new Promise<T>((resolve) => {
    const id = setTimeout(() => resolve(sentinel), ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      () => {
        clearTimeout(id);
        resolve(sentinel);
      },
    );
  });
}

/**
 * Debounce function to prevent excessive calls
 * Useful for preventing render loops in real-time subscriptions
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate?: boolean,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = function () {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function calls frequency
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
