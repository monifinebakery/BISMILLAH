// src/contexts/PaymentContext.tsx - UPDATED VERSION

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { autoLinkUserPayments, checkUnlinkedPayments } from '@/lib/authService'; // ✅ Updated import path

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

  // ✅ AUTO-LINK PAYMENTS: Simplified with better error handling
  useEffect(() => {
    if (isLoading || isPaid) return;

    const attemptAutoLink = async () => {
      try {
        const linkedCount = await autoLinkUserPayments();
        if (linkedCount > 0) {
          setTimeout(() => refetch(), 1000); // Refresh after auto-linking
        }
      } catch (error) {
        console.error('Auto-link failed:', error);
      }
    };

    attemptAutoLink();
  }, [isLoading, isPaid, refetch]);

  // ✅ CHECK UNLINKED PAYMENTS: Simplified monitoring
  useEffect(() => {
    if (isLoading || isPaid) return;

    const checkUnlinked = async () => {
      try {
        const { hasUnlinked, count } = await checkUnlinkedPayments();
        setUnlinkedPaymentCount(count);
        
        // Auto-show popup if there are unlinked payments
        if (hasUnlinked && !showOrderPopup) {
          setTimeout(() => setShowOrderPopup(true), 3000);
        }
      } catch (error) {
        console.error('Check unlinked payments failed:', error);
      }
    };

    checkUnlinked();
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