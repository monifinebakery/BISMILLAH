// src/contexts/PaymentContext.tsx - FIXED & OPTIMIZED VERSION
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { getUserAccessStatus } from '@/services/auth';
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
  // NEW: Refresh access status
  refreshAccessStatus: () => Promise<void>;
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
    refetch: refetchPaymentStatus
  } = usePaymentStatus();
  
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Checking access...');

  // ✅ NEW: Centralized access status checker
  const refreshAccessStatus = useCallback(async () => {
    try {
      const accessStatus = await getUserAccessStatus();
      logger.debug('Access status check result:', accessStatus);
      
      setHasAccess(accessStatus.hasAccess);
      setAccessMessage(accessStatus.message);
      
      // Auto-show order popup if needed
      if (accessStatus.needsOrderVerification && !showOrderPopup && !accessStatus.hasAccess) {
        setTimeout(() => setShowOrderPopup(true), 1000);
      }
      
    } catch (error) {
      logger.error('PaymentContext access check failed:', error);
      setAccessMessage('Error checking access');
    }
  }, [showOrderPopup, setShowOrderPopup]);

  // ✅ FIXED: Access status checker with proper dependencies
  useEffect(() => {
    if (isLoading) return;

    const checkAccess = async () => {
      await refreshAccessStatus();
    };

    checkAccess();
  }, [isLoading, refreshAccessStatus]); // Dependency lebih akurat

  // ✅ FIXED: Auto-show order popup dengan kondisi yang lebih jelas
  useEffect(() => {
    if (!isLoading && needsOrderLinking && !showOrderPopup && !hasAccess) {
      const timer = setTimeout(() => {
        if (!hasAccess) { // Double check
          setShowOrderPopup(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [needsOrderLinking, showOrderPopup, isLoading, hasAccess, setShowOrderPopup]);

  // ✅ FIXED: Free preview timer dengan kondisi yang lebih ketat
  useEffect(() => {
    if (isLoading || !needsPayment || isPaid || showMandatoryUpgrade || hasAccess) {
      return;
    }

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
  }, [isLoading, needsPayment, isPaid, showMandatoryUpgrade, hasAccess]);

  // ✅ FIXED: Reset logic yang lebih komprehensif
  useEffect(() => {
    if (isPaid || hasAccess) {
      setShowMandatoryUpgrade(false);
      setPreviewTimeLeft(60);
      setShowOrderPopup(false);
    }
  }, [isPaid, hasAccess, setShowOrderPopup]);

  // ✅ NEW: Expose refresh function untuk dipakai di komponen lain
  const enhancedRefetch = useCallback(async () => {
    logger.info('PaymentContext: Triggering refetch');
    await refetchPaymentStatus();
    await refreshAccessStatus();
  }, [refetchPaymentStatus, refreshAccessStatus]);

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
      refetchPayment: enhancedRefetch,
      hasAccess,
      accessMessage,
      refreshAccessStatus
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