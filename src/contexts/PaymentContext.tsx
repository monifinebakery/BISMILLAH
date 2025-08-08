// src/contexts/PaymentContext.tsx - FIXED VERSION

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
// ✅ REMOVED: Deprecated imports
// import { autoLinkUserPayments, checkUnlinkedPayments } from '@/lib/authService';
import { logger } from "@/utils/logger";

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
  // ✅ NEW: Error handling
  lastError: string | null;
  clearError: () => void;
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
  const [lastError, setLastError] = useState<string | null>(null);

  // ✅ REMOVED: Deprecated auto-link functionality
  // The autoLinkUserPayments function is deprecated and should be handled
  // through the main payment flow instead
  
  // ✅ SIMPLIFIED: Order popup logic without deprecated functions
  useEffect(() => {
    if (needsOrderLinking && !showOrderPopup && !isPaid && !isLoading) {
      const timer = setTimeout(() => {
        logger.info('PaymentContext: Showing order popup for unlinking');
        setShowOrderPopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [needsOrderLinking, showOrderPopup, isPaid, isLoading, setShowOrderPopup]);

  // ✅ IMPROVED: Free preview timer with better error handling
  useEffect(() => {
    if (isLoading || !needsPayment || isPaid || showMandatoryUpgrade) return;

    logger.info('PaymentContext: Starting preview timer', { previewTimeLeft });
    
    const interval = setInterval(() => {
      setPreviewTimeLeft((prev) => {
        if (prev <= 1) {
          logger.warn('PaymentContext: Preview time expired, showing mandatory upgrade');
          setShowMandatoryUpgrade(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      logger.info('PaymentContext: Clearing preview timer');
      clearInterval(interval);
    };
  }, [isLoading, needsPayment, showMandatoryUpgrade, isPaid]);

  // ✅ IMPROVED: Reset on payment with logging
  useEffect(() => {
    if (isPaid) {
      logger.info('PaymentContext: Payment detected, resetting state');
      setShowMandatoryUpgrade(false);
      setPreviewTimeLeft(60);
      setUnlinkedPaymentCount(0);
      setLastError(null);
    }
  }, [isPaid]);

  // ✅ NEW: Error handling from payment status
  useEffect(() => {
    if (paymentStatus?.error) {
      const errorMessage = paymentStatus.error;
      logger.error('PaymentContext: Payment status error', { error: errorMessage });
      setLastError(errorMessage);
    }
  }, [paymentStatus]);

  // ✅ NEW: Clear error function
  const clearError = () => {
    setLastError(null);
  };

  // ✅ IMPROVED: Enhanced refetch with error clearing
  const handleRefetchPayment = async () => {
    try {
      setLastError(null);
      logger.info('PaymentContext: Refetching payment status');
      await refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh payment status';
      logger.error('PaymentContext: Refetch failed', { error: errorMessage });
      setLastError(errorMessage);
    }
  };

  const contextValue: PaymentContextType = {
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
    refetchPayment: handleRefetchPayment,
    unlinkedPaymentCount,
    lastError,
    clearError
  };

  return (
    <PaymentContext.Provider value={contextValue}>
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