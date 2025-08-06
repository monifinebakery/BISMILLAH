// src/contexts/PaymentContext.tsx - FIXED VERSION

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
// ✅ FIXED: Remove deprecated imports, add new ones
import { getUserPaymentStatus } from '@/lib/authService';

interface PaymentContextType {
  isPaid: boolean;
  isLoading: boolean;
  paymentStatus: any;
  needsPayment: boolean;
  showMandatoryUpgrade: boolean;
  previewTimeLeft: number;
  showUpgradePopup: boolean;
  setShowUpgradePopup: (show: boolean) => void;
  // Order popup state
  needsOrderLinking: boolean;
  showOrderPopup: boolean;
  setShowOrderPopup: (show: boolean) => void;
  hasUnlinkedPayment: boolean;
  refetchPayment: () => void;
  // Enhanced features
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

  // ✅ FIXED: Replace deprecated autoLinkUserPayments with new logic
  useEffect(() => {
    if (isLoading || isPaid) return;

    const checkPaymentStatus = async () => {
      try {
        console.log('🔍 Checking payment status...');
        const status = await getUserPaymentStatus();
        console.log('🔍 Payment status result:', status);
        
        if (status.isPaid) {
          setTimeout(() => refetch(), 1000); // Refresh if status changed
        }
      } catch (error) {
        console.error('❌ Payment status check failed:', error);
      }
    };

    checkPaymentStatus();
  }, [isLoading, isPaid, refetch]);

  // ✅ FIXED: Replace deprecated checkUnlinkedPayments with simplified logic
  useEffect(() => {
    if (isLoading || isPaid) return;

    const checkUnlinkedStatus = async () => {
      try {
        const status = await getUserPaymentStatus();
        const needsLinking = status.needsLinking && !status.isPaid;
        
        if (needsLinking) {
          setUnlinkedPaymentCount(1); // Simplified: 1 if needs linking, 0 if not
          
          // Auto-show popup if user needs linking
          if (!showOrderPopup) {
            setTimeout(() => setShowOrderPopup(true), 3000);
          }
        } else {
          setUnlinkedPaymentCount(0);
        }
      } catch (error) {
        console.error('❌ Check unlinked status failed:', error);
        setUnlinkedPaymentCount(0);
      }
    };

    checkUnlinkedStatus();
  }, [isLoading, isPaid, showOrderPopup, setShowOrderPopup]);

  // ✅ AUTO-SHOW ORDER POPUP: Simplified condition
  useEffect(() => {
    if (needsOrderLinking && !showOrderPopup && !isPaid && !isLoading) {
      const timer = setTimeout(() => setShowOrderPopup(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [needsOrderLinking, showOrderPopup, isPaid, isLoading, setShowOrderPopup]);

  // ✅ FREE PREVIEW TIMER: Simplified logic
  useEffect(() => {
    if (isLoading || !needsPayment || isPaid || showMandatoryUpgrade) return;

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
  }, [isLoading, needsPayment, showMandatoryUpgrade, isPaid]);

  // ✅ RESET ON PAYMENT: Simplified reset logic
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
      needsOrderLinking,
      showOrderPopup,
      setShowOrderPopup,
      hasUnlinkedPayment,
      refetchPayment: refetch,
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