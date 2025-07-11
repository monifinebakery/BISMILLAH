import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';

interface PaymentContextType {
  isPaid: boolean;
  isLoading: boolean;
  paymentStatus: any;
  needsPayment: boolean;
  showMandatoryUpgrade: boolean;
  previewTimeLeft: number;
  showUpgradePopup: boolean;
  setShowUpgradePopup: (show: boolean) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { paymentStatus, isLoading, isPaid, needsPayment } = usePaymentStatus();
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  // Timer untuk free preview 60 detik - only for unpaid users
  useEffect(() => {
    if (!isLoading && needsPayment && !isPaid && !showMandatoryUpgrade) {
      const interval = setInterval(() => {
        setPreviewTimeLeft((prev) => {
          if (prev <= 1) {
            setShowMandatoryUpgrade(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLoading, needsPayment, showMandatoryUpgrade, isPaid]);

  return (
    <PaymentContext.Provider value={{
      isPaid,
      isLoading,
      paymentStatus,
      needsPayment,
      showMandatoryUpgrade,
      previewTimeLeft,
      showUpgradePopup,
      setShowUpgradePopup
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePaymentContext = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
};