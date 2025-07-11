import React from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { PaymentProvider } from '@/contexts/PaymentContext';
import MandatoryUpgradeModal from '@/components/MandatoryUpgradeModal';

interface PaymentGuardProps {
  children: React.ReactNode;
}

const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  const { paymentStatus, isLoading, isPaid } = usePaymentStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Mengecek status pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <PaymentProvider>
      {children}
      <MandatoryUpgradeModal />
    </PaymentProvider>
  );
};

export default PaymentGuard;