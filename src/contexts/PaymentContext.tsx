// src/contexts/PaymentContext.tsx - ENHANCED VERSION
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
  needsOrderLinking: boolean;
  showOrderPopup: boolean;
  setShowOrderPopup: (show: boolean) => void;
  hasUnlinkedPayment: boolean;
  refetchPayment: () => void;
  hasAccess: boolean;
  accessMessage: string;
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

  // ✅ Centralized access status checker
  const refreshAccessStatus = useCallback(async () => {
    try {
      logger.debug('PaymentContext: Refreshing access status...');
      const accessStatus = await getUserAccessStatus();
      
      logger.debug('Access status result:', {
        hasAccess: accessStatus.hasAccess,
        message: accessStatus.message,
        needsOrderVerification: accessStatus.needsOrderVerification,
        needsLinking: accessStatus.needsLinking
      });
      
      setHasAccess(accessStatus.hasAccess);
      setAccessMessage(accessStatus.message);
      
      // ✅ Auto-show order popup if needed
      if ((accessStatus.needsOrderVerification || accessStatus.needsLinking) && 
          !accessStatus.hasAccess && 
          !showOrderPopup) {
        logger.info('PaymentContext: Auto-showing order popup');
        setTimeout(() => setShowOrderPopup(true), 1500);
      }
      
    } catch (error) {
      logger.error('PaymentContext access check failed:', error);
      setHasAccess(false);
      setAccessMessage('Error checking access');
    }
  }, [showOrderPopup, setShowOrderPopup]);

  // ✅ Refresh access when payment status changes
  useEffect(() => {
    if (!isLoading) {
      refreshAccessStatus();
    }
  }, [isLoading, isPaid, paymentStatus?.user_id, refreshAccessStatus]);

  // ✅ Close popup when access granted
  useEffect(() => {
    if (hasAccess && showOrderPopup) {
      logger.info('PaymentContext: Access granted, closing order popup');
      setShowOrderPopup(false);
    }
  }, [hasAccess, showOrderPopup, setShowOrderPopup]);

  // ✅ Enhanced refetch function
  const enhancedRefetch = useCallback(async () => {
    logger.info('PaymentContext: Enhanced refetch triggered');
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