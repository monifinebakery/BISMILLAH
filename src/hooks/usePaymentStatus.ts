// src/hooks/usePaymentStatus.ts - FIXED & OPTIMIZED VERSION
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated, linkPaymentToUser } from '@/services/auth';
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
      // ✅ FAST: Quick auth check
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

      // ✅ STEP 1: Check for already linked payments (fastest)
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
        logger.success('Found linked payment:', payment.order_id);
        
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

      // ✅ STEP 2: Check for unlinked payments by email
      const { data: unlinkedPayments, error: unlinkedError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('email', user.email) // ✅ Match by email (from order verification)
        .is('user_id', null) // ✅ Only unlinked payments
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!unlinkedError && unlinkedPayments?.length) {
        const payment = unlinkedPayments[0];
        logger.success('Found unlinked payment for email:', { 
          orderId: payment.order_id, 
          email: payment.email 
        });
        
        // ✅ AUTO-LINK: Try to link the payment to current user
        try {
          logger.info('Attempting to auto-link payment to user');
          const linkedPayment = await linkPaymentToUser(payment.order_id, user);
          
          if (linkedPayment) {
            logger.success('Auto-linked payment successfully:', linkedPayment.order_id);
            
            // Return the linked payment
            return {
              ...linkedPayment,
              created_at: safeParseDate(linkedPayment.created_at),
              updated_at: safeParseDate(linkedPayment.updated_at),
              payment_date: safeParseDate(linkedPayment.payment_date),
            };
          }
        } catch (autoLinkError) {
          logger.warn('Auto-link failed, returning unlinked payment:', autoLinkError);
          
          // Return unlinked payment if auto-link fails
          return {
            ...payment,
            created_at: safeParseDate(payment.created_at),
            updated_at: safeParseDate(payment.updated_at),
            payment_date: safeParseDate(payment.payment_date),
          };
        }
      }

      if (unlinkedError) {
        logger.error('Error checking unlinked payments:', unlinkedError);
      }

      // ✅ STEP 3: No payments found
      logger.hook('usePaymentStatus', 'No payment found for user');
      return null;
    },
    enabled: true,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error.message?.includes('session missing') || error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // ✅ FIXED: Real-time subscription
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

        // ✅ FIXED: Proper subscription with email filter
        realtimeChannel = supabase
          .channel(`payment-changes-${user.id}`)
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_payments',
              filter: `email=eq.${user.email}` // ✅ Filter by email
            },
            (payload) => {
              const record = payload.new || payload.old;
              logger.hook('usePaymentStatus', 'Payment change detected:', {
                event: payload.eventType,
                orderId: record?.order_id,
                email: record?.email
              });
              
              // ✅ Immediate invalidation
              queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
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

  // ✅ FIXED: Logic isPaid yang lebih benar
  const isPaid = paymentStatus?.is_paid === true && 
                 paymentStatus?.payment_status === 'settled';
                 // ✅ Tidak perlu cek user_id untuk status paid

  // ✅ NEW: Status tambahan untuk UX yang lebih baik
  const isLinked = !!paymentStatus?.user_id; // Apakah sudah terhubung ke user
  const hasValidPayment = paymentStatus?.is_paid === true && 
                          paymentStatus?.payment_status === 'settled';

  const needsPayment = !hasValidPayment;
  const hasUnlinkedPayment = paymentStatus && 
                            !paymentStatus.user_id && 
                            paymentStatus.is_paid === true &&
                            paymentStatus.payment_status === 'settled';
  
  const needsOrderLinking = !isLoading && 
                           !hasValidPayment && 
                           !error;

  // ✅ NEW: Debug logging
  useEffect(() => {
    if (!isLoading) {
      logger.debug('Payment status computed:', {
        isPaid,
        isLinked,
        hasValidPayment,
        hasUnlinkedPayment,
        needsOrderLinking,
        paymentRecord: paymentStatus?.order_id || 'none',
        userEmail: paymentStatus?.email || 'none',
        userId: paymentStatus?.user_id || 'none'
      });
    }
  }, [isPaid, isLinked, hasUnlinkedPayment, needsOrderLinking, isLoading, paymentStatus]);

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid: hasValidPayment, // ✅ Gunakan hasValidPayment untuk UX yang lebih jelas
    needsPayment,
    hasUnlinkedPayment,
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    userName: paymentStatus?.customer_name || null,
    // ✅ NEW: Tambahkan status tambahan
    isLinked,
    hasValidPayment
  };
};