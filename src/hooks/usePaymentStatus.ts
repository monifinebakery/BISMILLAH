// ===== 1. src/services/auth/types.ts =====
export interface PaymentRecord {
  id: string;
  order_id: string;
  email: string;
  user_id?: string;
  is_paid: boolean;
  payment_status: string;
  amount?: number;
  created_at: string;
  updated_at: string;
}

export interface UserAccessStatus {
  hasAccess: boolean;
  isAuthenticated: boolean;
  paymentRecord: PaymentRecord | null;
  needsOrderVerification: boolean;
  needsLinking: boolean;
  message: string;
}

// ===== 2. src/services/auth/payments/access.ts - FIXED =====
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { UserAccessStatus, PaymentRecord } from '@/services/auth/types';
import { isAuthenticated, getCurrentUser } from '@/services/auth/core/authentication';

export const getUserAccessStatus = async (): Promise<UserAccessStatus> => {
  try {
    const isAuth = await isAuthenticated();
    const user = await getCurrentUser();

    // Not authenticated - need login
    if (!isAuth || !user) {
      return {
        hasAccess: false,
        isAuthenticated: false,
        paymentRecord: null,
        needsOrderVerification: true,
        needsLinking: false,
        message: 'Silakan login terlebih dahulu'
      };
    }

    logger.info('[AccessCheck] User authenticated, checking payment status:', user.email);

    // ✅ STEP 1: Check if user has linked payment (ONLY linked payments)
    const { data: linkedPayments, error: linkedError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (linkedError) {
      logger.error('[AccessCheck] Error checking linked payments:', linkedError);
      return {
        hasAccess: false,
        isAuthenticated: true,
        paymentRecord: null,
        needsOrderVerification: true,
        needsLinking: false,
        message: 'Terjadi kesalahan saat memeriksa status pembayaran'
      };
    }

    // ✅ User has linked payment - FULL ACCESS
    if (linkedPayments && linkedPayments.length > 0) {
      logger.success('[AccessCheck] User has valid linked payment:', {
        orderId: linkedPayments[0].order_id,
        userId: linkedPayments[0].user_id
      });
      return {
        hasAccess: true,
        isAuthenticated: true,
        paymentRecord: linkedPayments[0],
        needsOrderVerification: false,
        needsLinking: false,
        message: 'Akses penuh tersedia'
      };
    }

    // ✅ STEP 2: Check for unlinked payments - NO AUTO-LINK
    const { data: unlinkedPayments, error: unlinkedError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('email', user.email)
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!unlinkedError && unlinkedPayments && unlinkedPayments.length > 0) {
      logger.info('[AccessCheck] Found unlinked payment for user email - NO AUTO-LINK');
      
      // ✅ REMOVED AUTO-LINK - Let user manually link via popup
      return {
        hasAccess: false,
        isAuthenticated: true,
        paymentRecord: unlinkedPayments[0] as PaymentRecord,
        needsOrderVerification: false,
        needsLinking: true,
        message: 'Pembayaran ditemukan, silakan hubungkan dengan Order ID'
      };
    }

    // ✅ STEP 3: No payment found - need order verification
    logger.info('[AccessCheck] No payment found for user');
    return {
      hasAccess: false,
      isAuthenticated: true,
      paymentRecord: null,
      needsOrderVerification: true,
      needsLinking: false,
      message: 'Silakan verifikasi Order ID untuk mendapatkan akses'
    };

  } catch (error) {
    logger.error('[AccessCheck] Unexpected error:', error);
    return {
      hasAccess: false,
      isAuthenticated: false,
      paymentRecord: null,
      needsOrderVerification: true,
      needsLinking: false,
      message: 'Terjadi kesalahan sistem'
    };
  }
};

export const hasAppAccess = async (): Promise<boolean> => {
  const status = await getUserAccessStatus();
  return status.hasAccess;
};

// Backward compatibility export
export const getUserPaymentStatus = async () => {
  const status = await getUserAccessStatus();
  return {
    isPaid: status.hasAccess,
    paymentRecord: status.paymentRecord,
    needsLinking: status.needsLinking
  };
};

// ===== 3. src/hooks/usePaymentStatus.ts - FIXED =====
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated } from '@/services/auth';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { RealtimeChannel, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface PaymentStatus {
  id: string;
  user_id: string | null;
  order_id: string | null;
  pg_reference_id: string | null;
  email: string | null;
  payment_status: string | null;
  is_paid: boolean;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  payment_date: Date | undefined;
  amount: number | null;
  marketing_channel: string | null;
  campaign_id: string | null;
  currency: string | null;
  customer_name: string | null;
}

export const usePaymentStatus = () => {
  const queryClient = useQueryClient();
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  const { data: paymentStatus, isLoading, error, refetch } = useQuery<PaymentStatus | null, Error>({
    queryKey: ['paymentStatus'],
    queryFn: async (): Promise<PaymentStatus | null> => {
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        logger.hook('usePaymentStatus', 'User not authenticated');
        return null;
      }

      const user = await getCurrentUser();
      if (!user) {
        logger.hook('usePaymentStatus', 'No user found');
        return null;
      }

      logger.hook('usePaymentStatus', 'Checking payment for user:', user.email);

      // ✅ STEP 1: Check for LINKED payments only
      const { data: linkedPayments, error: linkedError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!linkedError && linkedPayments?.length) {
        const payment = linkedPayments[0];
        logger.success('Found linked payment:', { 
          orderId: payment.order_id,
          userId: payment.user_id,
          email: payment.email
        });
        
        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.payment_date),
        };
      }

      if (linkedError) {
        logger.error('Error checking linked payments:', linkedError);
      }

      // ✅ STEP 2: Check for UNLINKED payments - NO AUTO-LINK
      const { data: unlinkedPayments, error: unlinkedError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('email', user.email)
        .is('user_id', null)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!unlinkedError && unlinkedPayments?.length) {
        const payment = unlinkedPayments[0];
        logger.success('Found unlinked payment (NO AUTO-LINK):', { 
          orderId: payment.order_id, 
          email: payment.email 
        });
        
        // ✅ FIXED: Return unlinked payment without auto-linking
        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.payment_date),
        };
      }

      if (unlinkedError) {
        logger.error('Error checking unlinked payments:', unlinkedError);
      }

      // ✅ STEP 3: No payments found
      logger.hook('usePaymentStatus', 'No payment found for user');
      return null;
    },
    enabled: true,
    staleTime: 10000, // 10 seconds - more frequent updates
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error.message?.includes('session missing') || error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // ✅ Real-time subscription with better filtering
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupSubscription = async () => {
      try {
        const isAuth = await isAuthenticated();
        if (!isAuth) return;

        const user = await getCurrentUser();
        if (!user) return;

        logger.hook('usePaymentStatus', 'Setting up realtime subscription for:', user.email);

        realtimeChannel = supabase
          .channel(`payment-changes-${user.id}`)
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_payments',
              filter: `email=eq.${user.email}`
            },
            (payload) => {
              const record = payload.new || payload.old;
              logger.hook('usePaymentStatus', 'Payment change detected:', {
                event: payload.eventType,
                orderId: record?.order_id,
                email: record?.email,
                userId: record?.user_id
              });
              
              // ✅ Force immediate refetch
              queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
              setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ['paymentStatus'] });
              }, 500);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.success('Realtime subscription active for payment changes');
            }
          });
      } catch (error) {
        logger.error('Error setting up payment subscription:', error);
      }
    };

    setupSubscription();

    // Handle auth changes
    authSubscription = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      logger.hook('usePaymentStatus', 'Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        logger.hook('usePaymentStatus', 'User signed in, refreshing payment status');
        setTimeout(() => {
          setupSubscription();
          queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
        }, 500);
      } else if (event === 'SIGNED_OUT') {
        logger.hook('usePaymentStatus', 'User signed out, cleaning up');
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
          supabase.removeChannel(realtimeChannel);
        }
        queryClient.setQueryData(['paymentStatus'], null);
      }
    });

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
      }
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [queryClient]);

  // ✅ FIXED: Accurate payment status logic
  const isLinkedToCurrentUser = paymentStatus?.user_id !== null && paymentStatus?.user_id !== undefined;
  
  const hasValidPayment = paymentStatus?.is_paid === true && 
                         paymentStatus?.payment_status === 'settled' &&
                         isLinkedToCurrentUser;

  const hasUnlinkedPayment = paymentStatus && 
                            (!paymentStatus.user_id) && 
                            paymentStatus.is_paid === true &&
                            paymentStatus.payment_status === 'settled';
  
  const needsPayment = !hasValidPayment;
  const needsOrderLinking = !isLoading && hasUnlinkedPayment;

  // ✅ Debug logging
  useEffect(() => {
    if (!isLoading) {
      logger.debug('Payment status computed:', {
        hasValidPayment,
        hasUnlinkedPayment,
        needsOrderLinking,
        isLinkedToCurrentUser,
        paymentRecord: paymentStatus?.order_id || 'none',
        userEmail: paymentStatus?.email || 'none',
        userId: paymentStatus?.user_id || 'none'
      });
    }
  }, [hasValidPayment, hasUnlinkedPayment, needsOrderLinking, isLinkedToCurrentUser, isLoading, paymentStatus]);

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid: hasValidPayment, // ✅ Only true if linked AND paid
    needsPayment,
    hasUnlinkedPayment,
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    userName: paymentStatus?.customer_name || null,
    hasValidPayment,
    isLinkedToCurrentUser
  };
};