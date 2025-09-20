import { withTimeout } from '@/utils/asyncUtils';
import { logger } from '@/utils/logger';
import { detectSafariIOS, getSafariTimeout } from '@/utils/safariUtils';
import { detectDeviceCapabilities } from '@/utils/auth/deviceDetection';
import { getMobileOptimizedTimeout, detectMobileCapabilities } from '@/utils/mobileOptimizations';
import { sanitizeUser, validateSession } from '@/utils/auth/sessionValidation';
import type { Session, User } from '@supabase/supabase-js';

type NetworkErrorPredicate = (message: string) => boolean;

const MAX_TIMEOUT = 45000; // Increased to 45s for mobile compatibility (especially iOS Safari)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NETWORK_ERROR_MATCHERS: ReadonlyArray<NetworkErrorPredicate> = [
  (message) => message.includes('network'),
  (message) => message.includes('fetch'),
  (message) => message.includes('timeout'),
  (message) => message.includes('Failed to fetch'),
];

interface SafeWithTimeoutOptions {
  timeoutMs: number;
  timeoutMessage: string;
  retryCount?: number;
}

export interface SafeWithTimeoutResult<T> {
  data: T | null;
  error: Error | null;
}

// detectDeviceCapabilities moved to @/utils/auth/deviceDetection

export const getAdaptiveTimeout = (baseTimeout = 6000) => { // Mobile-optimized adaptive timeout
  const capabilities = detectDeviceCapabilities();
  const mobileCapabilities = detectMobileCapabilities();
  const safariDetection = detectSafariIOS();

  // Use mobile-optimized timeout if on mobile
  if (mobileCapabilities.isMobile) {
    const mobileTimeout = getMobileOptimizedTimeout(baseTimeout, 'auth');
    logger.debug('AuthContext: Mobile-optimized timeout applied', {
      baseTimeout,
      mobileTimeout,
      capabilities: mobileCapabilities,
    });
    return Math.min(mobileTimeout, MAX_TIMEOUT);
  }

  if (safariDetection.isSafariIOS) {
    const safariTimeout = getSafariTimeout(baseTimeout);
    const optimizedTimeout = Math.min(safariTimeout, MAX_TIMEOUT);
    logger.debug('AuthContext: Safari adaptive timeout applied', {
      safariTimeout,
      optimizedTimeout,
      version: safariDetection.version,
    });
    return optimizedTimeout;
  }

  let timeout = baseTimeout;

  if (capabilities.isSlowDevice) {
    timeout *= 2;
    logger.debug('AuthContext: Slow device detected, adjusting timeout', { timeout });
  }

  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
    timeout *= 3;
    logger.debug('AuthContext: Very slow network detected, adjusting timeout', { timeout });
  } else if (capabilities.networkType === '3g') {
    timeout *= 1.5;
    logger.debug('AuthContext: 3G network detected, adjusting timeout', { timeout });
  }

  const optimizedTimeout = Math.min(timeout, MAX_TIMEOUT);
  logger.debug('AuthContext: Final adaptive timeout', { optimizedTimeout });
  return optimizedTimeout;
};

// sanitizeUser moved to @/utils/auth/sessionValidation

// validateSession moved to @/utils/auth/sessionValidation

export const safeWithTimeout = async <T>(
  promiseFactory: () => Promise<T>,
  { timeoutMs, timeoutMessage, retryCount = 0 }: SafeWithTimeoutOptions
): Promise<SafeWithTimeoutResult<T>> => {
  const maxRetries = 2;

  try {
    const result = await withTimeout(promiseFactory(), timeoutMs, timeoutMessage);
    return { data: result, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.warn('AuthContext: Timeout or error in safeWithTimeout', {
      timeoutMs,
      timeoutMessage,
      error: errorMessage,
      retryCount,
    });

    const shouldRetry =
      retryCount < maxRetries && NETWORK_ERROR_MATCHERS.some((matches) => matches(errorMessage));

    if (shouldRetry) {
      const backoffMs = (retryCount + 1) * 2000;
      logger.warn('AuthContext: Network error detected, retrying', {
        retryCount: retryCount + 1,
        backoffMs,
      });
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return safeWithTimeout(promiseFactory, { timeoutMs, timeoutMessage, retryCount: retryCount + 1 });
    }

    const normalizedError = error instanceof Error ? error : new Error(errorMessage);
    return { data: null, error: normalizedError };
  }
};
