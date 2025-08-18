import { useState, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';

export const useOrderConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const circuitBreakerRef = useRef({ failures: 0, lastFailure: 0, isOpen: false });
  const fallbackModeRef = useRef(false);
  const lastPollTimeRef = useRef(0);
  const pollThrottleMs = 25000;

  const shouldAttemptConnection = useCallback(() => {
    const cb = circuitBreakerRef.current;
    const now = Date.now();
    if (cb.isOpen && now - cb.lastFailure > 300000) {
      cb.failures = 0;
      cb.isOpen = false;
    }
    return !cb.isOpen;
  }, []);

  const recordConnectionFailure = useCallback(() => {
    const cb = circuitBreakerRef.current;
    cb.failures += 1;
    cb.lastFailure = Date.now();
    if (cb.failures >= 5) {
      cb.isOpen = true;
      fallbackModeRef.current = true;
      logger.warn('useOrderConnection', 'Circuit breaker opened');
    }
  }, []);

  const throttledFetch = useCallback(async (fn: () => Promise<void>) => {
    const now = Date.now();
    if (now - lastPollTimeRef.current < pollThrottleMs) return;
    lastPollTimeRef.current = now;
    await fn();
  }, []);

  return {
    isConnected,
    setIsConnected,
    shouldAttemptConnection,
    recordConnectionFailure,
    throttledFetch,
    fallbackModeRef,
  };
};
