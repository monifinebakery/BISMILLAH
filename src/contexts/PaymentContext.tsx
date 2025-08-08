// src/contexts/PaymentContext.tsx - SIMPLIFIED: Auto-show popup logic

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
  // Manual linking function
  linkPaymentToUser: (orderId: string) => Promise<boolean>;
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
  const [hasAutoShownPopup, setHasAutoShownPopup] = useState(false); // ✅ NEW: Track if popup was auto-shown

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
    refetch,
    linkPaymentToUser: hookLinkFunction
  } = paymentHookResult;

  // ✅ SIMPLIFIED: Auto-show popup logic - single effect with clear conditions
  useEffect(() => {
    // ✅ CLEAR CONDITIONS: Only auto-show once when there's unlinked payment
    const shouldAutoShow = hasUnlinkedPayment && 
                          !showOrderPopup && 
                          !isPaid && 
                          !isLoading &&
                          !hasAutoShownPopup;

    if (shouldAutoShow) {
      logger.info('PaymentContext: Auto-showing order popup for unlinked payment');
      console.log('🔄 Auto-showing OrderConfirmationPopup - Unlinked payment detected');
      
      const timer = setTimeout(() => {
        console.log('⏰ Executing auto-show OrderConfirmationPopup');
        setShowOrderPopup(true);
        setHasAutoShownPopup(true); // ✅ Mark as auto-shown to prevent repeated shows
      }, 3000); // 3 seconds delay
      
      return () => clearTimeout(timer);
    }

    // ✅ FALLBACK: Show if no payment at all and user needs linking (after longer delay)
    const shouldShowFallback = needsOrderLinking && 
                              !hasUnlinkedPayment && 
                              !showOrderPopup && 
                              !isPaid && 
                              !isLoading &&
                              !hasAutoShownPopup;

    if (shouldShowFallback) {
      logger.info('PaymentContext: Auto-showing order popup for manual linking');
      console.log('🔄 Auto-showing OrderConfirmationPopup - Manual linking needed');
      
      const timer = setTimeout(() => {
        console.log('⏰ Executing fallback auto-show OrderConfirmationPopup');
        setShowOrderPopup(true);
        setHasAutoShownPopup(true);
      }, 8000); // 8 seconds delay for fallback
      
      return () => clearTimeout(timer);
    }
  }, [
    hasUnlinkedPayment, 
    needsOrderLinking, 
    showOrderPopup, 
    isPaid, 
    isLoading, 
    hasAutoShownPopup,
    setShowOrderPopup
  ]);

  // ✅ RESET: Reset auto-show tracker when payment status changes
  useEffect(() => {
    if (isPaid || (!hasUnlinkedPayment && !needsOrderLinking)) {
      setHasAutoShownPopup(false); // Reset for next time
    }
  }, [isPaid, hasUnlinkedPayment, needsOrderLinking]);

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
    setShowOrderPopup(false); // ✅ Close popup when paid
    setHasAutoShownPopup(false); // ✅ Reset auto-show tracker
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

  // ✅ ENHANCED: Wrapper for linkPaymentToUser with context updates
  const handleLinkPaymentToUser = async (orderId: string): Promise<boolean> => {
    try {
      setLastError(null);
      logger.info('PaymentContext: Linking payment via context');
      
      // ✅ FIXED: Use the hook function directly (now it exists)
      const result = await hookLinkFunction(orderId);
      
      if (result) {
        // Success - close popup and refresh
        setShowOrderPopup(false);
        setHasAutoShownPopup(true); // ✅ Mark as handled
        setTimeout(() => {
          handleRefetchPayment();
        }, 1000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link payment';
      logger.error('PaymentContext: Link payment failed', { error: errorMessage });
      setLastError(errorMessage);
      throw error;
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
    clearError,
    linkPaymentToUser: handleLinkPaymentToUser
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
    lastError,
    hookLinkFunction
  ]);

  // ✅ DEBUG: Development logging with auto-show status
  useEffect(() => {
    if (import.meta.env.DEV && !isLoading) {
      console.log('🔍 PaymentContext State Debug:', {
        isPaid,
        hasUnlinkedPayment,
        needsOrderLinking,
        showOrderPopup,
        hasAutoShownPopup, // ✅ Include auto-show status in debug
        paymentStatus: paymentStatus ? {
          orderId: paymentStatus.order_id,
          userId: paymentStatus.user_id,
          isPaid: paymentStatus.is_paid
        } : null
      });
    }
  }, [isPaid, hasUnlinkedPayment, needsOrderLinking, showOrderPopup, hasAutoShownPopup, paymentStatus, isLoading]);

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