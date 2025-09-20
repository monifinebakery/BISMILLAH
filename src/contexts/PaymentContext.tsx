// src/contexts/PaymentContext.tsx - FIXED Hook Order Issues
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useUnlinkedPayments } from '@/hooks/useUnlinkedPayments';
import { getUserAccessStatus } from '@/services/auth/payments/access';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { withTimeout } from '@/utils/asyncUtils';
import { safeStorageGet, safeStorageSet } from '@/utils/auth/safeStorage'; // ✅ FIX: Thread-safe storage

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
  
  // Check for development bypass
  const isDev = import.meta.env.DEV;
  const bypassAuth = isDev && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
  
  // 1. useAuth - ALWAYS called first
  const { user, isLoading: authLoading, isReady: authReady } = useAuth();
  
  // 2. ALL useState hooks - ALWAYS called in same order
  const [isUserValid, setIsUserValid] = useState(false);
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(bypassAuth); // Set to true if bypassing
  const [accessMessage, setAccessMessage] = useState(bypassAuth ? 'Development bypass active' : 'Checking access...');
  const [accessLoading, setAccessLoading] = useState(!bypassAuth); // Skip loading if bypassing

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

  // 5. useRef for stable function reference
  const refreshAccessStatusRef = useRef<(() => Promise<void>) | null>(null);
  // Prevent repeated auto-link attempts
  const triedAutoLinkRef = useRef(false);

  // 6. ALL useCallback hooks - ALWAYS called in same order
  
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
      const accessStatus = await withTimeout(accessPromise, 8000, 'Access status timeout') as any; // ✅ OPTIMIZED: Increased timeout for mobile compatibility
      
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
        // Debounce auto-popup to avoid annoyance on tab switches
        const now = Date.now();
        let lastShown = 0;
        try {
          lastShown = parseInt(safeStorageGet('orderPopupLastShown') || '0', 10) || 0; // ✅ FIX: Thread-safe get
        } catch (storageError) {
          logger.debug('PaymentContext: Failed to read orderPopupLastShown from storage', storageError);
        }
        const cooldownMs = 2 * 60 * 60 * 1000; // 2 hours
        if (now - lastShown > cooldownMs) {
          logger.info('PaymentContext: Auto-showing manual order popup (cooldown passed)');
          window.setTimeout(async () => {
            setShowOrderPopup(true);
            try {
              await safeStorageSet('orderPopupLastShown', String(Date.now())); // ✅ FIX: Thread-safe set
            } catch (storageError) {
              logger.debug('PaymentContext: Failed to persist orderPopupLastShown timestamp', storageError);
            }
          }, 1500);
        } else {
          logger.debug('PaymentContext: Skipping auto popup (cooldown active)');
        }
      }
      
    } catch (error) {
      logger.error('PaymentContext access check failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('Auth session missing') || 
          errorMessage?.includes('session missing')) {
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
  }, [authReady, authLoading, isUserValid, user?.email, showOrderPopup, paymentLoading]);

  // Update ref with current function
  refreshAccessStatusRef.current = refreshAccessStatus;

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
      await refreshAccessStatusRef.current?.();
    } catch (error) {
      logger.error('PaymentContext: Enhanced refetch failed:', error);
    }
  }, [isUserValid, refetchPaymentStatus, refetchUnlinkedPayments]);

  // 7. ALL useEffect hooks - ALWAYS called in same order

  // ✅ FIXED: Add mutex to prevent race conditions with main auth flow
  const refreshMutexRef = useRef(false);
  
  useEffect(() => {
    const handleAuthRefreshRequest = async (event: CustomEvent) => {
      const { reason } = event.detail || {};
      if (reason === 'otp_verification_success') {
        // ✅ FIX: Use mutex to prevent concurrent refresh operations
        if (refreshMutexRef.current) {
          logger.debug('PaymentContext: Refresh already in progress, skipping');
          return;
        }
        
        refreshMutexRef.current = true;
        logger.info('PaymentContext: Received OTP success refresh request - triggering payment refresh with mutex');
        
        try {
          // ✅ FIX: Longer delay to avoid race with main auth state updates
          await new Promise(resolve => setTimeout(resolve, 1000));
          await enhancedRefetch();
        } finally {
          refreshMutexRef.current = false;
        }
      }
    };

    window.addEventListener('auth-refresh-request', handleAuthRefreshRequest as EventListener);
    
    return () => {
      window.removeEventListener('auth-refresh-request', handleAuthRefreshRequest as EventListener);
    };
  }, [enhancedRefetch]);

  // ✅ EFFECT 1: Validate user
  useEffect(() => {
    const validateUser = async () => {
      if (!authReady || authLoading) {
        setIsUserValid(false);
        return;
      }
      
      if (!user || !user.id || !user.email) {
        // ✅ Silent for unauthenticated state - this is normal
        if (import.meta.env.DEV && authReady && !authLoading) {
          console.log('PaymentContext: User not ready yet:', { 
            hasUser: !!user, 
            hasId: !!user?.id, 
            hasEmail: !!user?.email,
            note: 'Normal when not logged in'
          });
        }
        setIsUserValid(false);
        setHasAccess(bypassAuth); // Set access to bypass value when no user
        setAccessMessage(bypassAuth ? 'Development bypass active' : 'Please login to access features');
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
      refreshAccessStatusRef.current?.();
    } else {
      logger.debug('PaymentContext: Skipping access refresh', {
        authReady,
        authLoading,
        isUserValid,
        paymentLoading
      });
    }
  }, [authReady, authLoading, isUserValid, paymentLoading, isPaid]);

  // ✅ EFFECT 2b: Auto-link unlinked payments by email after login (one-time, non-blocking)
  useEffect(() => {
    const autoLinkByEmail = async () => {
      try {
        if (!authReady || authLoading || !isUserValid || triedAutoLinkRef.current) return;
        if (!user?.id || !user?.email) return;
        triedAutoLinkRef.current = true;

        logger.info('PaymentContext: Attempting auto-link of unlinked payments by email');
        const { data: unlinked, error } = await supabase
          .from('user_payments')
          .select('id')
          .is('user_id', null)
          .eq('email', user.email)
          .eq('is_paid', true)
          .eq('payment_status', 'settled')
          .limit(5);

        if (error) {
          logger.error('PaymentContext: Auto-link query error:', error);
          return;
        }
        if (!unlinked || unlinked.length === 0) {
          logger.debug('PaymentContext: No unlinked payments found for auto-link');
          return;
        }

        const ids = unlinked.map((p: any) => p.id);
        logger.info('PaymentContext: Auto-linking payments:', ids);
        const { error: linkError } = await supabase
          .from('user_payments')
          .update({ user_id: user.id })
          .in('id', ids);

        if (linkError) {
          logger.error('PaymentContext: Auto-link update error:', linkError);
          return;
        }

        // Refresh related caches
        await enhancedRefetch();
        logger.success('PaymentContext: Auto-link completed');
      } catch (e) {
        logger.error('PaymentContext: Auto-link failed:', e);
      }
    };

    autoLinkByEmail();
  }, [authReady, authLoading, isUserValid, user?.id, user?.email, enhancedRefetch]);

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
      totalUnlinkedCount: (hasUnlinkedPayment ? 1 : 0) + autoLinkCount,
      // Development bypass info
      isDev,
      bypassAuth,
      finalIsPaid: bypassAuth ? true : isPaid,
      finalNeedsPayment: bypassAuth ? false : needsPayment
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
    hasUnlinkedPayment,
    isDev,
    bypassAuth,
    needsPayment
  ]);

  // ✅ Calculate derived values AFTER all hooks
  const unlinkedPaymentCount = hasUnlinkedPayment ? 1 : 0;
  const totalUnlinkedCount = unlinkedPaymentCount + autoLinkCount;
  const isLoading = paymentLoading || authLoading || accessLoading;

  // ✅ Development bypass overrides
  const finalIsPaid = bypassAuth ? true : isPaid;
  const finalNeedsPayment = bypassAuth ? false : needsPayment;
  const finalShowMandatoryUpgrade = bypassAuth ? false : showMandatoryUpgrade;

  // ✅ RETURN: Always return same structure
  return (
    <PaymentContext.Provider value={{
      // Original context values
      isPaid: finalIsPaid,
      isLoading,
      paymentStatus,
      needsPayment: finalNeedsPayment,
      showMandatoryUpgrade: finalShowMandatoryUpgrade,
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
