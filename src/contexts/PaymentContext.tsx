// src/contexts/PaymentContext.tsx - FIXED VERSION

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { getUserAccessStatus } from '@/services/auth'; // ✅ Fixed import path
import { logger } from '@/utils/logger';

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
  hasAccess: boolean;
  accessMessage: string;
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
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Checking access...');

  // ✅ REMOVED: Deprecated auto-link logic (now handled in usePaymentStatus)
  // ✅ REMOVED: checkUnlinkedPayments (now handled in usePaymentStatus)

  // ✅ NEW: Enhanced access status check
  useEffect(() => {
    if (isLoading) return;

    const checkAccess = async () => {
      try {
        const accessStatus = await getUserAccessStatus();
        setHasAccess(accessStatus.hasAccess);
        setAccessMessage(accessStatus.message);
        
        // Auto-show order popup based on access status
        if (accessStatus.needsOrderVerification && !showOrderPopup && !accessStatus.hasAccess) {
          setTimeout(() => setShowOrderPopup(true), 3000);
        }

        logger.debug('PaymentContext access status:', accessStatus);
      } catch (error) {
        logger.error('PaymentContext access check failed:', error);
        setAccessMessage('Error checking access');
      }
    };

    checkAccess();
  }, [isLoading, isPaid, showOrderPopup]); // React to payment changes

  // ✅ SIMPLIFIED: Auto-show order popup logic
  useEffect(() => {
    if (needsOrderLinking && !showOrderPopup && !isPaid && !isLoading && !hasAccess) {
      const timer = setTimeout(() => setShowOrderPopup(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [needsOrderLinking, showOrderPopup, isPaid, isLoading, hasAccess]);

  // ✅ FREE PREVIEW TIMER: Only if no access
  useEffect(() => {
    if (isLoading || !needsPayment || isPaid || showMandatoryUpgrade || hasAccess) return;

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
  }, [isLoading, needsPayment, showMandatoryUpgrade, isPaid, hasAccess]);

  // ✅ RESET ON PAYMENT: Enhanced reset logic
  useEffect(() => {
    if (isPaid || hasAccess) {
      setShowMandatoryUpgrade(false);
      setPreviewTimeLeft(60);
      setShowOrderPopup(false); // Close order popup if access granted
    }
  }, [isPaid, hasAccess]);

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
      hasAccess,
      accessMessage
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