// src/contexts/PaymentContext.tsx - FIXED Hook Order Issues
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useUnlinkedPayments } from '@/hooks/useUnlinkedPayments';
import { getUserAccessStatus } from '@/services/auth/payments/access';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { withTimeout } from '@/utils/asyncUtils';

interface PaymentContextType {
  // Original payment context
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
  
  // Auto-linking webhook payments
  currentUser: any;
  unlinkedPayments: any[];
  showAutoLinkPopup: boolean;
  setShowAutoLinkPopup: (show: boolean) => void;
  autoLinkCount: number;
  autoLinkLoading: boolean;
  autoLinkError: string | null;
  refetchUnlinkedPayments: () => void;
  
  // Combined counts
  unlinkedPaymentCount: number;
  totalUnlinkedCount: number;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ FIX: ALL HOOKS CALLED IN EXACT SAME ORDER EVERY TIME
  
  // 1. useAuth - ALWAYS called first
  const { user, isLoading: authLoading, isReady: authReady } = useAuth();
  
  // 2. ALL useState hooks - ALWAYS called in same order
  const [isUserValid, setIsUserValid] = useState(false);
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Checking access...');
  const [accessLoading, setAccessLoading] = useState(true);

  // 3. usePaymentStatus - ALWAYS called (no conditionals)
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
  
  // 4. useUnlinkedPayments - ALWAYS called with consistent user parameter
  // ✅ FIX: Always pass user, let the hook handle null internally
  const {
    unlinkedPayments,
    isLoading: autoLinkLoading,
    error: autoLinkError,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetch: refetchUnlinkedPayments,
    unlinkedCount: autoLinkCount
  } = useUnlinkedPayments(supabase, user); // ✅ Always pass user, not conditional

  // 5. ALL useCallback hooks - ALWAYS called in same order
  
  // ✅ Access status refresh callback
  const refreshAccessStatus = useCallback(async () => {
    if (!authReady || authLoading) {
      logger.debug('PaymentContext: Skipping access check - auth not ready');
      return;
    }
    
    if (!isUserValid) {
      logger.debug('PaymentContext: Skipping access check - user invalid');
      setHasAccess(false);
      setAccessMessage('Please login to check access');
      setAccessLoading(false);
      return;
    }
    
    setAccessLoading(true);
    
    try {
      logger.debug('PaymentContext: Refreshing access status for valid user:', user?.email);
      
const accessPromise = getUserAccessStatus();
      const accessStatus = await withTimeout(accessPromise, 8000, 'Access status timeout') as any;
      
      logger.debug('Access status result:', {
        hasAccess: accessStatus.hasAccess,
        message: accessStatus.message,
        needsOrderVerification: accessStatus.needsOrderVerification,
        needsLinking: accessStatus.needsLinking
      });
      
      setHasAccess(accessStatus.hasAccess);
      setAccessMessage(accessStatus.message);
      
      if ((accessStatus.needsOrderVerification || accessStatus.needsLinking) && 
          !accessStatus.hasAccess && 
          !showOrderPopup &&
          !paymentLoading &&
          isUserValid) {
        logger.info('PaymentContext: Auto-showing manual order popup');
        window.setTimeout(() => setShowOrderPopup(true), 1500);
      }
      
    } catch (error) {
      logger.error('PaymentContext access check failed:', error);
      
      if (error.message?.includes('Auth session missing') || 
          error.message?.includes('session missing')) {
        setHasAccess(false);
        setAccessMessage('Session expired. Please login again.');
        setIsUserValid(false);
      } else {
        setHasAccess(false);
        setAccessMessage('Error checking access');
      }
    } finally {
      setAccessLoading(false);
    }
  }, [authReady, authLoading, isUserValid, user?.email, showOrderPopup, setShowOrderPopup, paymentLoading]);

  // ✅ Enhanced refetch function
  const enhancedRefetch = useCallback(async () => {
    if (!isUserValid) {
      logger.warn('PaymentContext: Skipping refetch - user invalid');
      return;
    }
    
    logger.info('PaymentContext: Enhanced refetch triggered for valid user');
    
    try {
      await refetchPaymentStatus();
      await refetchUnlinkedPayments();
      await refreshAccessStatus();
    } catch (error) {
      logger.error('PaymentContext: Enhanced refetch failed:', error);
    }
  }, [isUserValid, refetchPaymentStatus, refetchUnlinkedPayments, refreshAccessStatus]);

  // 6. ALL useEffect hooks - ALWAYS called in same order

  // ✅ EFFECT 1: Validate user
  useEffect(() => {
    const validateUser = async () => {
      if (!authReady || authLoading) {
        setIsUserValid(false);
        return;
      }
      
      if (!user || !user.id || !user.email) {
        // ✅ Reduce log level for normal loading state
        logger.debug('PaymentContext: User not ready yet:', { 
          hasUser: !!user, 
          hasId: !!user?.id, 
          hasEmail: !!user?.email,
          authReady,
          authLoading
        });
        setIsUserValid(false);
        return;
      }
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
          logger.debug('PaymentContext: Session not ready:', { 
            hasSession: !!session, 
            error: error?.message,
            note: 'This is normal during app initialization'
          });
          setIsUserValid(false);
          return;
        }
        
        if (session.user.id !== user.id) {
          logger.warn('PaymentContext: Session user mismatch:', {
            authUser: user.id,
            sessionUser: session.user.id
          });
          setIsUserValid(false);
          return;
        }
        
        logger.success('PaymentContext: User validation passed:', {
          userId: user.id,
          email: user.email
        });
        setIsUserValid(true);
        
      } catch (error) {
        logger.error('PaymentContext: Session validation error:', error);
        setIsUserValid(false);
      }
    };
    
    validateUser();
  }, [authReady, authLoading, user]);

  // ✅ EFFECT 2: Trigger access refresh
  useEffect(() => {
    if (authReady && !authLoading && isUserValid && !paymentLoading) {
      logger.debug('PaymentContext: Triggering access refresh for valid user');
      refreshAccessStatus();
    } else {
      logger.debug('PaymentContext: Skipping access refresh', {
        authReady,
        authLoading,
        isUserValid,
        paymentLoading
      });
    }
  }, [authReady, authLoading, isUserValid, paymentLoading, isPaid, paymentStatus?.user_id, refreshAccessStatus]);

  // ✅ EFFECT 3: Close popup when access granted
  useEffect(() => {
    if (hasAccess && showOrderPopup) {
      logger.info('PaymentContext: Access granted, closing order popup');
      setShowOrderPopup(false);
    }
  }, [hasAccess, showOrderPopup, setShowOrderPopup]);

  // ✅ EFFECT 4: Auto-close auto-link popup
  useEffect(() => {
    if (autoLinkCount === 0 && showAutoLinkPopup) {
      logger.info('PaymentContext: No more auto-link payments, closing popup');
      setShowAutoLinkPopup(false);
    }
  }, [autoLinkCount, showAutoLinkPopup, setShowAutoLinkPopup]);

  // ✅ EFFECT 5: Debug logging
  useEffect(() => {
    logger.debug('PaymentContext state update:', {
      authReady,
      authLoading,
      isUserValid,
      isLoading: paymentLoading || authLoading || accessLoading,
      paymentLoading,
      accessLoading,
      isPaid,
      hasAccess,
      currentUserEmail: user?.email,
      currentUserId: user?.id,
      autoLinkCount,
      totalUnlinkedCount: (hasUnlinkedPayment ? 1 : 0) + autoLinkCount
    });
  }, [
    authReady,
    authLoading,
    isUserValid,
    paymentLoading, 
    accessLoading,
    isPaid, 
    hasAccess, 
    user?.email,
    user?.id,
    autoLinkCount, 
    hasUnlinkedPayment
  ]);

  // ✅ Calculate derived values AFTER all hooks
  const unlinkedPaymentCount = hasUnlinkedPayment ? 1 : 0;
  const totalUnlinkedCount = unlinkedPaymentCount + autoLinkCount;
  const isLoading = paymentLoading || authLoading || accessLoading;

  // ✅ RETURN: Always return same structure
  return (
    <PaymentContext.Provider value={{
      // Original context values
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
      
      // Auto-linking values - ✅ Only use user if valid
      currentUser: isUserValid ? user : null,
      unlinkedPayments,
      showAutoLinkPopup,
      setShowAutoLinkPopup,
      autoLinkCount,
      autoLinkLoading,
      autoLinkError,
      refetchUnlinkedPayments,
      
      // Combined counts
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