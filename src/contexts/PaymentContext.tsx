// src/contexts/PaymentContext.tsx - ENHANCED VERSION with Auto-Linking
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useUnlinkedPayments } from '@/hooks/useUnlinkedPayments';
import { getUserAccessStatus, getCurrentUser } from '@/services/auth';
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
  unlinkedPaymentCount: number; // Original manual linking count
  totalUnlinkedCount: number;   // Total of manual + auto counts
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // ✅ EXISTING: Original payment status hook
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
  
  // ✅ NEW: Auto-linking webhook payments hook
  const {
    unlinkedPayments,
    isLoading: autoLinkLoading,
    error: autoLinkError,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetch: refetchUnlinkedPayments,
    unlinkedCount: autoLinkCount
  } = useUnlinkedPayments(supabase, currentUser);
  
  // ✅ EXISTING: Original state
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Checking access...');

  // ✅ NEW: Get current user on mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        logger.debug('PaymentContext: Current user loaded:', { 
          email: user?.email, 
          id: user?.id 
        });
      } catch (error) {
        logger.error('PaymentContext: Failed to load current user:', error);
        setCurrentUser(null);
      }
    };

    loadCurrentUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await getCurrentUser();
          setCurrentUser(user);
          logger.debug('PaymentContext: User signed in, user set:', { 
            email: user?.email 
          });
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          logger.debug('PaymentContext: User signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ✅ EXISTING: Centralized access status checker
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
      
      // ✅ ENHANCED: Auto-show order popup if needed (but not auto-link popup)
      if ((accessStatus.needsOrderVerification || accessStatus.needsLinking) && 
          !accessStatus.hasAccess && 
          !showOrderPopup) {
        logger.info('PaymentContext: Auto-showing manual order popup');
        setTimeout(() => setShowOrderPopup(true), 1500);
      }
      
    } catch (error) {
      logger.error('PaymentContext access check failed:', error);
      setHasAccess(false);
      setAccessMessage('Error checking access');
    }
  }, [showOrderPopup, setShowOrderPopup]);

  // ✅ EXISTING: Refresh access when payment status changes
  useEffect(() => {
    if (!isLoading) {
      refreshAccessStatus();
    }
  }, [isLoading, isPaid, paymentStatus?.user_id, refreshAccessStatus]);

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
    await refetchPaymentStatus();
    await refetchUnlinkedPayments();
    await refreshAccessStatus();
  }, [refetchPaymentStatus, refetchUnlinkedPayments, refreshAccessStatus]);

  // ✅ NEW: Calculate combined counts
  const unlinkedPaymentCount = hasUnlinkedPayment ? 1 : 0; // Original manual count
  const totalUnlinkedCount = unlinkedPaymentCount + autoLinkCount;

  // ✅ NEW: Log state changes for debugging
  useEffect(() => {
    logger.debug('PaymentContext state update:', {
      isPaid,
      hasAccess,
      needsOrderLinking,
      hasUnlinkedPayment,
      autoLinkCount,
      unlinkedPaymentCount,
      totalUnlinkedCount,
      showOrderPopup,
      showAutoLinkPopup
    });
  }, [
    isPaid, 
    hasAccess, 
    needsOrderLinking, 
    hasUnlinkedPayment, 
    autoLinkCount, 
    unlinkedPaymentCount, 
    totalUnlinkedCount,
    showOrderPopup,
    showAutoLinkPopup
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
      
      // ✅ NEW: Auto-linking webhook payments
      currentUser,
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