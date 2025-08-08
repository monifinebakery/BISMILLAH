import React from 'react';
import { PaymentProvider, usePaymentContext } from '@/contexts/PaymentContext';
import MandatoryUpgradeModal from '@/components/MandatoryUpgradeModal';
import { logger } from '@/utils/logger';

interface PaymentGuardProps {
  children: React.ReactNode;
}

// ✅ FIXED: Inner component yang menggunakan context
const PaymentGuardInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ NOW: Hook dipanggil di dalam PaymentProvider context
  const { isLoading } = usePaymentContext();

  // ✅ DEBUG: Log payment guard state changes
  React.useEffect(() => {
    logger.debug('PaymentGuard: State change', { isLoading });
  }, [isLoading]);

  // ✅ LOADING: Tampilkan loading state
  if (isLoading) {
    logger.info('PaymentGuard: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Mengecek status pembayaran...</p>
        </div>
      </div>
    );
  }

  logger.success('PaymentGuard: Rendering children components');
  
  // ✅ RENDER: Children dengan context yang sudah ter-setup
  return (
    <>
      {children}
      <MandatoryUpgradeModal />
    </>
  );
};

// ✅ FIXED: Main PaymentGuard dengan proper context structure
const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  logger.info('PaymentGuard: Initializing with PaymentProvider context');
  
  return (
    <PaymentProvider>
      <PaymentGuardInner>
        {children}
      </PaymentGuardInner>
    </PaymentProvider>
  );
};

export default PaymentGuard;