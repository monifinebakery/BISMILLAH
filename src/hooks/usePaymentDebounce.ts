// src/hooks/usePaymentDebounce.ts
// Hook debounce khusus untuk payment verification
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

interface PaymentDebounceOptions {
  delay?: number;
  maxWait?: number;
  immediate?: boolean;
}

export const usePaymentDebounce = (options: PaymentDebounceOptions = {}) => {
  const {
    delay = 1000, // 1 second default
    maxWait = 5000, // 5 seconds max wait
    immediate = false
  } = options;

  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef<number>(0);

  // ✅ Debounced invalidation untuk payment status
  const debouncedInvalidatePayment = useCallback(() => {
    const now = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }

    // Immediate execution if requested
    if (immediate && now - lastCallRef.current > maxWait) {
      lastCallRef.current = now;
      queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      
      if (process.env.NODE_ENV === 'development') {
        logger.hook('usePaymentDebounce', 'Immediate payment status invalidation');
      }
      return;
    }

    // Set up debounced execution
    timeoutRef.current = setTimeout(() => {
      lastCallRef.current = now;
      queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      
      if (process.env.NODE_ENV === 'development') {
        logger.hook('usePaymentDebounce', 'Debounced payment status invalidation');
      }
    }, delay);

    // Set up max wait timeout
    if (maxWait && now - lastCallRef.current < maxWait) {
      maxTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        lastCallRef.current = now;
        queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
        
        if (process.env.NODE_ENV === 'development') {
          logger.hook('usePaymentDebounce', 'Max wait payment status invalidation');
        }
      }, maxWait - (now - lastCallRef.current));
    }
  }, [delay, maxWait, immediate, queryClient]);

  // ✅ Debounced refetch dengan background update
  const debouncedRefetchPayment = useCallback(() => {
    const now = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      lastCallRef.current = now;
      
      // Background refetch tanpa loading state
      queryClient.refetchQueries({ 
        queryKey: ['paymentStatus'],
        type: 'active' // Only refetch active queries
      });
      
      if (process.env.NODE_ENV === 'development') {
        logger.hook('usePaymentDebounce', 'Background payment status refetch');
      }
    }, delay / 2); // Faster refetch for better UX
  }, [delay, queryClient]);

  // ✅ Smart invalidation yang menggabungkan invalidate + background refetch
  const smartInvalidatePayment = useCallback(() => {
    debouncedInvalidatePayment();
    
    // Background refetch setelah slight delay
    setTimeout(() => {
      debouncedRefetchPayment();
    }, 200);
  }, [debouncedInvalidatePayment, debouncedRefetchPayment]);

  // ✅ Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }
  }, []);

  return {
    debouncedInvalidatePayment,
    debouncedRefetchPayment,
    smartInvalidatePayment,
    cleanup
  };
};

export default usePaymentDebounce;