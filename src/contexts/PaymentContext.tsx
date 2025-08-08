// src/contexts/PaymentContext.tsx - FIXED: Rules of Hooks Compliant

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
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
  // Error handling
  lastError: string | null;
  clearError: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ FIXED: All hooks must be called at the top level, in the same order every time
  
  // 1. All useState hooks first
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [unlinkedPaymentCount, setUnlinkedPaymentCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // 2. Then custom hooks (always called in same order)
  const paymentHookResult = usePaymentStatus();
  
  // 3. Destructure after the hook call to avoid conditional access
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
  } = paymentHookResult;

  // ✅ FIXED: All useEffect hooks in consistent order
  
  // Effect 1: Order popup logic - always runs, conditions inside
  useEffect(() => {
    if (!needsOrderLinking || showOrderPopup || isPaid || isLoading) {
      return; // Early return inside effect is OK
    }

    const timer = setTimeout(() => {
      logger.info('PaymentContext: Showing order popup for unlinking');
      setShowOrderPopup(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [needsOrderLinking, showOrderPopup, isPaid, isLoading, setShowOrderPopup]);

  // Effect 2: Preview timer - always runs, conditions inside
  useEffect(() => {
    if (isLoading || !needsPayment || isPaid || showMandatoryUpgrade) {
      return; // Conditions inside effect
    }

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
  }, [isLoading, needsPayment, showMandatoryUpgrade, isPaid, previewTimeLeft]);

  // Effect 3: Reset on payment - always runs, conditions inside
  useEffect(() => {
    if (!isPaid) {
      return; // Condition inside effect
    }

    logger.info('PaymentContext: Payment detected, resetting state');
    setShowMandatoryUpgrade(false);
    setPreviewTimeLeft(60);
    setUnlinkedPaymentCount(0);
    setLastError(null);
  }, [isPaid]);

  // Effect 4: Error handling from payment status - always runs
  useEffect(() => {
    if (!paymentStatus?.error) {
      return; // Condition inside effect
    }

    const errorMessage = paymentStatus.error;
    logger.error('PaymentContext: Payment status error', { error: errorMessage });
    setLastError(errorMessage);
  }, [paymentStatus]);

  // ✅ FIXED: Functions defined consistently (no conditional useCallback)
  const clearError = () => {
    setLastError(null);
  };

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

  // ✅ FIXED: useMemo for context value to prevent unnecessary rerenders
  const contextValue = useMemo<PaymentContextType>(() => ({
    isPaid: isPaid || false,
    isLoading: isLoading || false,
    paymentStatus,
    needsPayment: needsPayment || false,
    showMandatoryUpgrade,
    previewTimeLeft,
    showUpgradePopup,
    setShowUpgradePopup,
    needsOrderLinking: needsOrderLinking || false,
    showOrderPopup: showOrderPopup || false,
    setShowOrderPopup,
    hasUnlinkedPayment: hasUnlinkedPayment || false,
    refetchPayment: handleRefetchPayment,
    unlinkedPaymentCount,
    lastError,
    clearError
  }), [
    isPaid,
    isLoading,
    paymentStatus,
    needsPayment,
    showMandatoryUpgrade,
    previewTimeLeft,
    showUpgradePopup,
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    hasUnlinkedPayment,
    unlinkedPaymentCount,
    lastError
  ]);

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