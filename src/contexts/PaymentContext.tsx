import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { autoLinkUserPayments, checkUnlinkedPayments } from '@/lib/authService';

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
  // ✅ NEW: Enhanced features
  unlinkedPaymentCount: number;
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
  const [unlinkedPaymentCount, setUnlinkedPaymentCount] = useState(0);

  // ✅ AUTO-LINK PAYMENTS: Try to link unlinked payments when context loads
  useEffect(() => {
    const attemptAutoLink = async () => {
      if (!isLoading && !isPaid) {
        try {
          const linkedCount = await autoLinkUserPayments();
          if (linkedCount > 0) {
            // Refresh payment status after auto-linking
            setTimeout(() => {
              refetch();
            }, 1000);
          }
        } catch (error) {
          console.error('Auto-link failed:', error);
        }
      }
    };

    attemptAutoLink();
  }, [isLoading, isPaid, refetch]);

  // ✅ CHECK UNLINKED PAYMENTS: Monitor for unlinked payments
  useEffect(() => {
    const checkUnlinked = async () => {
      if (!isLoading && !isPaid) {
        try {
          const { hasUnlinked, count } = await checkUnlinkedPayments();
          setUnlinkedPaymentCount(count);
          
          // Show popup if there are unlinked payments
          if (hasUnlinked && !showOrderPopup) {
            setTimeout(() => {
              setShowOrderPopup(true);
            }, 3000); // Wait 3 seconds before showing popup
          }
        } catch (error) {
          console.error('Check unlinked payments failed:', error);
        }
      }
    };

    checkUnlinked();
  }, [isLoading, isPaid, showOrderPopup, setShowOrderPopup]);

  // ✅ AUTO-SHOW ORDER POPUP: Show popup automatically if user needs to link order
  useEffect(() => {
    if (needsOrderLinking && !showOrderPopup && !isPaid && !isLoading) {
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
      setUnlinkedPaymentCount(0);
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
      refetchPayment: refetch,
      // ✅ NEW: Enhanced features
      unlinkedPaymentCount
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