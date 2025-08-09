// src/contexts/PaymentContext.tsx - SIMPLIFIED (Uses AuthContext)
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // ✅ Import AuthContext
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useUnlinkedPayments } from '@/hooks/useUnlinkedPayments';
import { getUserAccessStatus } from '@/services/auth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface PaymentContextType {
  // ✅ EXISTING: Original payment context
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
  
  // ✅ NEW: Auto-linking webhook payments
  currentUser: any;
  unlinkedPayments: any[];
  showAutoLinkPopup: boolean;
  setShowAutoLinkPopup: (show: boolean) => void;
  autoLinkCount: number;
  autoLinkLoading: boolean;
  autoLinkError: string | null;
  refetchUnlinkedPayments: () => void;
  
  // ✅ ENHANCED: Combined counts for UI
  unlinkedPaymentCount: number;
  totalUnlinkedCount: number;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ KEY FIX: Use AuthContext instead of managing auth ourselves
  const { user, isLoading: authLoading, isReady: authReady } = useAuth();
  
  // ✅ EXISTING: Original payment status hook
  const { 
    paymentStatus, 
    isLoading: paymentLoading, 
    isPaid, 
    needsPayment,
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    hasUnlinkedPayment,
    refetch: refetchPaymentStatus
  } = usePaymentStatus();
  
  // ✅ OPTIMIZED: Only initialize auto-linking when auth is ready
  const {
    unlinkedPayments,
    isLoading: autoLinkLoading,
    error: autoLinkError,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetch: refetchUnlinkedPayments,
    unlinkedCount: autoLinkCount
  } = useUnlinkedPayments(supabase, !authReady ? null : user); // ✅ KEY: Pass null until auth ready
  
  // ✅ EXISTING: Original state
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Checking access...');
  const [accessLoading, setAccessLoading] = useState(true);

  // ✅ SIMPLIFIED: Access status checker (no more auth logic here)
  const refreshAccessStatus = useCallback(async () => {
    if (!authReady || authLoading) return; // ✅ Wait for auth to be ready
    
    setAccessLoading(true);
    
    try {
      logger.debug('PaymentContext: Refreshing access status...', {
        userEmail: user?.email || 'none',
        authReady,
        authLoading
      });
      
      const accessPromise = getUserAccessStatus();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Access status timeout')), 8000)
      );
      
      const accessStatus = await Promise.race([accessPromise, timeoutPromise]) as any;
      
      logger.debug('Access status result:', {
        hasAccess: accessStatus.hasAccess,
        message: accessStatus.message,
        needsOrderVerification: accessStatus.needsOrderVerification,
        needsLinking: accessStatus.needsLinking
      });
      
      setHasAccess(accessStatus.hasAccess);
      setAccessMessage(accessStatus.message);
      
      // ✅ Auto-show popup logic
      if ((accessStatus.needsOrderVerification || accessStatus.needsLinking) && 
          !accessStatus.hasAccess && 
          !showOrderPopup &&
          !paymentLoading) {
        logger.info('PaymentContext: Auto-showing manual order popup');
        setTimeout(() => setShowOrderPopup(true), 1500);
      }
      
    } catch (error) {
      logger.error('PaymentContext access check failed:', error);
      setHasAccess(false);
      setAccessMessage('Error checking access');
    } finally {
      setAccessLoading(false);
    }
  }, [authReady, authLoading, user?.email, showOrderPopup, setShowOrderPopup, paymentLoading]);

  // ✅ OPTIMIZED: Only refresh access when both auth and payment are ready
  useEffect(() => {
    if (authReady && !authLoading && !paymentLoading) {
      logger.debug('PaymentContext: Triggering access refresh', {
        authReady,
        authLoading,
        paymentLoading,
        isPaid,
        userId: paymentStatus?.user_id
      });
      refreshAccessStatus();
    }
  }, [authReady, authLoading, paymentLoading, isPaid, paymentStatus?.user_id, refreshAccessStatus]);

  // ✅ EXISTING: Close popup when access granted
  useEffect(() => {
    if (hasAccess && showOrderPopup) {
      logger.info('PaymentContext: Access granted, closing order popup');
      setShowOrderPopup(false);
    }
  }, [hasAccess, showOrderPopup, setShowOrderPopup]);

  // ✅ NEW: Auto-close auto-link popup when no more unlinked payments
  useEffect(() => {
    if (autoLinkCount === 0 && showAutoLinkPopup) {
      logger.info('PaymentContext: No more auto-link payments, closing popup');
      setShowAutoLinkPopup(false);
    }
  }, [autoLinkCount, showAutoLinkPopup, setShowAutoLinkPopup]);

  // ✅ ENHANCED: Enhanced refetch function
  const enhancedRefetch = useCallback(async () => {
    logger.info('PaymentContext: Enhanced refetch triggered');
    
    try {
      await refetchPaymentStatus();
      await refetchUnlinkedPayments();
      await refreshAccessStatus();
    } catch (error) {
      logger.error('PaymentContext: Enhanced refetch failed:', error);
    }
  }, [refetchPaymentStatus, refetchUnlinkedPayments, refreshAccessStatus]);

  // ✅ NEW: Calculate combined counts
  const unlinkedPaymentCount = hasUnlinkedPayment ? 1 : 0;
  const totalUnlinkedCount = unlinkedPaymentCount + autoLinkCount;

  // ✅ SIMPLIFIED: Combined loading state (no more auth loading here)
  const isLoading = paymentLoading || accessLoading || authLoading;

  // ✅ DEBUG: Log state changes
  useEffect(() => {
    logger.debug('PaymentContext state update:', {
      isLoading,
      paymentLoading,
      accessLoading,
      authLoading,
      authReady,
      isPaid,
      hasAccess,
      currentUserEmail: user?.email,
      autoLinkCount,
      totalUnlinkedCount
    });
  }, [
    isLoading,
    paymentLoading, 
    accessLoading,
    authLoading,
    authReady,
    isPaid, 
    hasAccess, 
    user?.email,
    autoLinkCount, 
    totalUnlinkedCount
  ]);

  return (
    <PaymentContext.Provider value={{
      // ✅ EXISTING: Original context values
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
      refreshAccessStatus,
      
      // ✅ SIMPLIFIED: Use user from AuthContext
      currentUser: user, // ✅ No more separate currentUser state
      unlinkedPayments,
      showAutoLinkPopup,
      setShowAutoLinkPopup,
      autoLinkCount,
      autoLinkLoading,
      autoLinkError,
      refetchUnlinkedPayments,
      
      // ✅ ENHANCED: Combined counts
      unlinkedPaymentCount,
      totalUnlinkedCount
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