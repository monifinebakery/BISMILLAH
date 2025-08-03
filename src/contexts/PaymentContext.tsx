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
  // ✅ NEW: Order popup state
  needsOrderLinking: boolean;
  showOrderPopup: boolean;
  setShowOrderPopup: (show: boolean) => void;
  hasUnlinkedPayment: boolean;
  refetchPayment: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    paymentStatus, 
    isLoading, 
    isPaid, 
    needsPayment,
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    hasUnlinkedPayment,
    refetch
  } = usePaymentStatus();
  
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  // ✅ Enhanced logging for context
  useEffect(() => {
    console.log('💼 PAYMENT CONTEXT UPDATE:', {
      isPaid,
      needsPayment,
      needsOrderLinking,
      showOrderPopup,
      hasUnlinkedPayment,
      isLoading
    });
  }, [isPaid, needsPayment, needsOrderLinking, showOrderPopup, hasUnlinkedPayment, isLoading]);

  // ✅ AUTO-SHOW ORDER POPUP: Show popup automatically if user needs to link order
  useEffect(() => {
    if (needsOrderLinking && !showOrderPopup && !isPaid && !isLoading) {
      console.log('🔗 Auto-showing order popup - user needs to link payment');
      const timer = setTimeout(() => {
        setShowOrderPopup(true);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [needsOrderLinking, showOrderPopup, isPaid, isLoading, setShowOrderPopup]);

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

  // ✅ Reset preview timer when payment status changes
  useEffect(() => {
    if (isPaid) {
      setShowMandatoryUpgrade(false);
      setPreviewTimeLeft(60);
    }
  }, [isPaid]);

  return (
    <PaymentContext.Provider value={{
      isPaid,
      isLoading,
      paymentStatus,
      needsPayment,
      showMandatoryUpgrade,
      previewTimeLeft,
      showUpgradePopup,
      setShowUpgradePopup,
      // ✅ NEW: Order popup state
      needsOrderLinking,
      showOrderPopup,
      setShowOrderPopup,
      hasUnlinkedPayment,
      refetchPayment: refetch
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