import { withTimeout } from '@/utils/asyncUtils';
import { logger } from '@/utils/logger';
import { detectSafariIOS, getSafariTimeout } from '@/utils/safariUtils';
import type { Session, User } from '@supabase/supabase-js';

type NetworkErrorPredicate = (message: string) => boolean;

const MAX_TIMEOUT = 60000;
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

export const detectDeviceCapabilities = () => {
  const capabilities = {
    hasLocalStorage: false,
    hasSessionStorage: false,
    networkType: 'unknown' as string,
    isSlowDevice: false,
    userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent || 'unknown',
  };

  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    capabilities.hasLocalStorage = true;
  } catch {
    logger.warn('AuthContext: localStorage not available or restricted');
  }

  try {
    sessionStorage.setItem('__test__', 'test');
    sessionStorage.removeItem('__test__');
    capabilities.hasSessionStorage = true;
  } catch {
    logger.warn('AuthContext: sessionStorage not available or restricted');
  }

  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    capabilities.networkType = connection?.effectiveType || 'unknown';
  }

  const isSlowDevice =
    capabilities.userAgent.includes('Android 4') ||
    capabilities.userAgent.includes('iPhone OS 10') ||
    !capabilities.hasLocalStorage;

  capabilities.isSlowDevice = isSlowDevice;
  return capabilities;
};

export const getAdaptiveTimeout = (baseTimeout = 12000) => {
  const capabilities = detectDeviceCapabilities();
  const safariDetection = detectSafariIOS();
  const androidDetection = detectAndroid();

  // Android-specific timeout handling
  if (androidDetection.isAndroid) {
    const androidTimeout = getAndroidOptimizedTimeout(baseTimeout);
    logger.debug('AuthContext: Android adaptive timeout applied', {
      originalTimeout: baseTimeout,
      androidTimeout,
      isSlowDevice: androidDetection.isSlowDevice,
      networkType: androidDetection.networkType
    });
    return androidTimeout;
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

export const sanitizeUser = (user: User | null): User | null => {
  if (!user) {
    logger.debug('AuthContext: No user provided for sanitization');
    return null;
  }

  if (user.id === 'null' || user.id === 'undefined' || !user.id) {
    logger.error('AuthContext: Invalid user ID detected', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
    });
    return null;
  }

  if (typeof user.id !== 'string' || user.id.length < 10) {
    logger.error('AuthContext: Invalid user ID format', {
      userId: user.id,
      userIdType: typeof user.id,
      userIdLength: user.id?.length || 0,
      email: user.email,
    });
    return null;
  }

  if (!UUID_REGEX.test(user.id)) {
    logger.error('AuthContext: Invalid UUID format detected', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
    });
    return null;
  }

  logger.debug('AuthContext: User sanitization passed', {
    userId: user.id,
    email: user.email,
  });

  return user;
};

export const validateSession = (session: Session | null) => {
  if (!session) {
    logger.debug('AuthContext: No session provided for validation');
    return { session: null, user: null };
  }

  if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
    logger.warn('AuthContext: Session expired during validation');
    return { session: null, user: null };
  }

  const sanitizedUser = sanitizeUser(session.user);
  if (!sanitizedUser) {
    logger.warn('AuthContext: Session has invalid user after sanitization', {
      userId: session.user?.id,
    });
    return { session: null, user: null };
  }

  logger.debug('AuthContext: Session validated', { userId: sanitizedUser.id });
  return { session, user: sanitizedUser };
};

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
