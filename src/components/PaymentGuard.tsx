import React, { useState, useEffect } from 'react';
import { usePaymentContext } from '@/contexts/PaymentContext';
import PaymentVerificationLoader from '@/components/PaymentVerificationLoader';
import { logger } from '@/utils/logger';

interface PaymentGuardProps {
  children: React.ReactNode;
}

// Persist first-check completion across remounts during provider stage changes
let __paymentInitialCheckDone = false;

const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  const { isPaid, isLoading, refetchPayment } = usePaymentContext();
  const [timedOut, setTimedOut] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(
    () => __paymentInitialCheckDone || safeReadInitialFlag()
  );

  function safeReadInitialFlag(): boolean {
    try {
      return window.sessionStorage.getItem('payment-initial-check-done') === '1';
    } catch {
      return false;
    }
  }

  function markInitialDone() {
    __paymentInitialCheckDone = true;
    try {
      window.sessionStorage.setItem('payment-initial-check-done', '1');
    } catch (error) {
      logger.warn('PaymentGuard: Failed to persist initial check flag', error);
    }
    setInitialCheckDone(true);
  }

  // After the first check completes (or we timeout), avoid blocking loaders on subsequent refetches
  useEffect(() => {
    if (!isLoading || timedOut) {
      if (!initialCheckDone) {
        markInitialDone();
      }
    }
  }, [isLoading, timedOut]);

  // Note: errors ditangani di PaymentContext; di sini kita fokus UX gating saja

  // Loading state - use unified modern loader
  if (!initialCheckDone && isLoading && !timedOut) {
    logger.debug('PaymentGuard: Loading payment status...');
    return (
      <PaymentVerificationLoader 
        stage="checking"
        timeout={6000}
        onTimeout={() => {
          logger.debug('PaymentGuard: Payment verification timeout - proceeding with fallback UI');
          setTimedOut(true);
          // Mark done to avoid showing blocking loader again on remounts
          if (!initialCheckDone) markInitialDone();
          // Fire a background refetch to update status when available
          setTimeout(() => refetchPayment?.(), 500);
        }}
      />
    );
  }

  logger.debug('PaymentGuard: Payment status checked', { isPaid });

  // Render children only; upgrade modal dihapus sesuai permintaan
  return (
    <>
      {children}
    </>
  );
};

export default PaymentGuard;
