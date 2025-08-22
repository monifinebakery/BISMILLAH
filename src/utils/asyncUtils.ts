// src/utils/asyncUtils.ts
// Small async helpers to avoid common races/leaks

/**
 * Wrap a promise with a timeout that clears itself to avoid unhandled rejections.
 * If the timeout fires first, it rejects with the provided error message.
 * If the underlying promise settles first, the timeout is cleared.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation timeout'): Promise<T> {
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
      }
    );
  });
}

/**
 * A race that returns a sentinel value instead of rejecting on timeout.
 * Useful when you prefer not to throw, but to treat timeout as a soft-miss.
 */
export async function withSoftTimeout<T>(promise: Promise<T>, ms: number, sentinel: T): Promise<T> {
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
      }
    );
  });
}

/**
 * Execute a promise with exponential backoff retry logic
 * @param promiseFn Function that returns a promise to execute
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay in milliseconds (will be exponentially increased)
 * @param timeoutMs Timeout for each attempt
 * @returns Promise result or throws error after max retries
 */
export async function withExponentialBackoff<T>(
  promiseFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  timeoutMs: number = 15000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // For retry attempts (attempt > 0), add delay before retry
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Execute with timeout
      return await withTimeout(promiseFn(), timeoutMs, `Operation timeout (attempt ${attempt + 1}/${maxRetries + 1})`);
    } catch (error) {
      lastError = error as Error;
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // For non-timeout errors, we might want to stop retrying
      const errorMessage = lastError.message || '';
      if (!errorMessage.includes('timeout') && !errorMessage.includes('network')) {
        throw lastError;
      }
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('Unknown error in exponential backoff');
}

