// src/hooks/usePaymentStatus.ts - SIMPLIFIED VERSION (removed auth_email)
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

      // ✅ STEP 2: Check for UNLINKED payments (SIMPLIFIED - only by email)
      logger.hook('usePaymentStatus', 'Checking for unlinked payments...');
      
      const { data: unlinkedPayments, error: unlinkedError } = await supabase
        .from('user_payments')
        .select('*')
        .is('user_id', null)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .eq('email', user.email) // ✅ SIMPLIFIED: Only check email field
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!unlinkedError && unlinkedPayments?.length) {
        const payment = unlinkedPayments[0];
        logger.success('Found unlinked payment via email:', { 
          orderId: payment.order_id, 
          email: payment.email
        });
        
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
    staleTime: 10000, // 10 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error.message?.includes('session missing') || error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // ✅ Simplified real-time subscription
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
              // ✅ SIMPLIFIED: user_id OR email only
              filter: `or(user_id.eq.${user.id},email.eq.${user.email})`
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
            } else if (status === 'SUBSCRIPTION_ERROR') {
              logger.error('Realtime subscription failed');
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

  // ✅ Simplified payment status logic
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

  // ✅ Simplified debug logging
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