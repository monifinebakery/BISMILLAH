// src/contexts/PaymentContext.tsx - UPDATED VERSION

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { autoLinkUserPayments, checkUnlinkedPayments } from '@/lib/authService'; // ✅ Updated import path
import { logger }

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

  // ✅ DEPRECATED FUNCTIONS: These functions are now deprecated in authService
  // They return empty results but don't cause errors
  useEffect(() => {
    if (isLoading || isPaid) return;

    const attemptAutoLink = async () => {
      try {
        // ✅ UPDATED: This function now returns 0 (deprecated) but won't error
        const linkedCount = await autoLinkUserPayments();
        if (linkedCount > 0) {
          setTimeout(() => refetch(), 1000);
        }
      } catch (error) {
        // ✅ SAFE: Log but don't break the app
        if (import.meta.env.DEV) {
          console.error('Auto-link failed (deprecated):', error);
        }
      }
    };

    attemptAutoLink();
  }, [isLoading, isPaid, refetch]);

  // ✅ UPDATED: Check unlinked payments with deprecated function
  useEffect(() => {
    if (isLoading || isPaid) return;

    const checkUnlinked = async () => {
      try {
        // ✅ UPDATED: This function now returns {hasUnlinked: false, count: 0} (deprecated)
        const { hasUnlinked, count } = await checkUnlinkedPayments();
        setUnlinkedPaymentCount(count);
        
        // Auto-show popup if there are unlinked payments
        if (hasUnlinked && !showOrderPopup) {
          setTimeout(() => setShowOrderPopup(true), 3000);
        }
      } catch (error) {
        // ✅ SAFE: Log but don't break the app
        if (import.meta.env.DEV) {
          console.error('Check unlinked payments failed (deprecated):', error);
        }
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