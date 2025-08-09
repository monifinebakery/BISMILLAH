// src/contexts/PaymentContext.tsx - OPTIMIZED VERSION with Debug
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
  unlinkedPaymentCount: number;
  totalUnlinkedCount: number;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true); // ✅ NEW: Track user loading
  
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
  
  // ✅ OPTIMIZED: Only initialize auto-linking when user is ready
  const {
    unlinkedPayments,
    isLoading: autoLinkLoading,
    error: autoLinkError,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetch: refetchUnlinkedPayments,
    unlinkedCount: autoLinkCount
  } = useUnlinkedPayments(supabase, userLoading ? null : currentUser); // ✅ KEY: Pass null while loading
  
  // ✅ EXISTING: Original state
  const [showMandatoryUpgrade, setShowMandatoryUpgrade] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Checking access...');
  const [accessLoading, setAccessLoading] = useState(true); // ✅ NEW: Track access loading

  // ✅ OPTIMIZED: Get current user with timeout
  useEffect(() => {
    const loadCurrentUser = async () => {
      setUserLoading(true);
      
      try {
        logger.debug('PaymentContext: Loading current user...');
        
        // ✅ REDUCED TIMEOUT: 5 seconds instead of 10
        const userPromise = getCurrentUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User loading timeout')), 5000) // 5 second timeout
        );
        
        const user = await Promise.race([userPromise, timeoutPromise]) as any;
        
        setCurrentUser(user);
        logger.debug('PaymentContext: Current user loaded:', { 
          email: user?.email, 
          id: user?.id 
        });
      } catch (error) {
        logger.error('PaymentContext: Failed to load current user:', error);
        
        // ✅ ENHANCED FALLBACK: Try multiple approaches
        try {
          // Fallback 1: Get user from session directly
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setCurrentUser(session.user);
            logger.debug('PaymentContext: Fallback 1 - user from session:', session.user.email);
            return;
          }
          
          // Fallback 2: Try getUser() method
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (user && !userError) {
            setCurrentUser(user);
            logger.debug('PaymentContext: Fallback 2 - user from getUser():', user.email);
            return;
          }
          
          // Fallback 3: If all fails, set null but don't block app
          logger.warn('PaymentContext: All fallbacks failed, setting user to null');
          setCurrentUser(null);
          
        } catch (fallbackError) {
          logger.error('PaymentContext: All fallbacks failed:', fallbackError);
          setCurrentUser(null);
        }
      } finally {
        setUserLoading(false);
      }
    };

    loadCurrentUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('PaymentContext: Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const user = await getCurrentUser();
            setCurrentUser(user);
            logger.debug('PaymentContext: User signed in, user set:', { 
              email: user?.email 
            });
          } catch (error) {
            // Fallback to session user
            setCurrentUser(session.user);
            logger.debug('PaymentContext: Fallback to session user:', session.user.email);
          }
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

  // ✅ OPTIMIZED: Centralized access status checker with timeout
  const refreshAccessStatus = useCallback(async () => {
    if (userLoading) return; // ✅ Don't check access while user is loading
    
    setAccessLoading(true);
    
    try {
      logger.debug('PaymentContext: Refreshing access status...');
      
      // ✅ ADD TIMEOUT for access status
      const accessPromise = getUserAccessStatus();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Access status timeout')), 8000) // 8 second timeout
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
      
      // ✅ OPTIMIZED: Only auto-show popup if really needed
      if ((accessStatus.needsOrderVerification || accessStatus.needsLinking) && 
          !accessStatus.hasAccess && 
          !showOrderPopup &&
          !paymentLoading) { // ✅ Don't show while payment is loading
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
  }, [userLoading, showOrderPopup, setShowOrderPopup, paymentLoading]);

  // ✅ OPTIMIZED: Only refresh access when payment status is ready
  useEffect(() => {
    if (!paymentLoading && !userLoading) {
      refreshAccessStatus();
    }
  }, [paymentLoading, userLoading, isPaid, paymentStatus?.user_id, refreshAccessStatus]);

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

  // ✅ ENHANCED: Enhanced refetch function with better sequencing
  const enhancedRefetch = useCallback(async () => {
    logger.info('PaymentContext: Enhanced refetch triggered');
    
    try {
      // Refetch in sequence, not parallel to avoid conflicts
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

  // ✅ OPTIMIZED: Combined loading state
  const isLoading = paymentLoading || userLoading || accessLoading;

  // ✅ DEBUG: Log state changes
  useEffect(() => {
    logger.debug('PaymentContext state update:', {
      isLoading,
      paymentLoading,
      userLoading,
      accessLoading,
      isPaid,
      hasAccess,
      currentUserEmail: currentUser?.email,
      autoLinkCount,
      totalUnlinkedCount
    });
  }, [
    isLoading,
    paymentLoading, 
    userLoading,
    accessLoading,
    isPaid, 
    hasAccess, 
    currentUser?.email,
    autoLinkCount, 
    totalUnlinkedCount
  ]);

  return (
    <PaymentContext.Provider value={{
      // ✅ EXISTING: Original context values
      isPaid,
      isLoading, // ✅ OPTIMIZED: Combined loading state
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