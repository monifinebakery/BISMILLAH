// src/hooks/usePaymentStatus.ts - FIXED FOR ORDER ID SUPPORT

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated, linkPaymentToUser } from '@/services/auth'; // ✅ Fixed import
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
    staleTime: 30000, // 30 seconds - shorter for better order linking UX
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // ✅ Enable refetch on focus for order verification flow
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message?.includes('session missing') || error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2; // Allow more retries for better reliability
    },
  });

  // ✅ ENHANCED: Real-time subscription with better error handling
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let setupTimeout: NodeJS.Timeout;

    const setupSubscription = async () => {
      try {
        // Cleanup existing subscription
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }

        const isAuth = await isAuthenticated();
        if (!isAuth) return;

        const user = await getCurrentUser();
        if (!user) return;

        logger.hook('usePaymentStatus', 'Setting up realtime subscription for:', user.email);

        // ✅ ENHANCED: Subscribe to both user_id and email changes
        realtimeChannel = supabase
          .channel(`payment-changes-${user.id}`)
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_payments'
              // ✅ No filter = listen to all changes, then filter in callback
            },
            (payload) => {
              const record = payload.new || payload.old;
              
              // ✅ Check if this change affects current user
              const affectsUser = record?.user_id === user.id || record?.email === user.email;
              
              if (affectsUser) {
                logger.hook('usePaymentStatus', 'Payment change detected:', {
                  event: payload.eventType,
                  orderId: record?.order_id,
                  affectsCurrentUser: affectsUser
                });
                
                // ✅ Debounced invalidation
                clearTimeout(setupTimeout);
                setupTimeout = setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
                }, 1000);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.success('Realtime subscription active for payment changes');
            } else if (status === 'CHANNEL_ERROR') {
              logger.error('Realtime subscription error');
            }
          });
      } catch (error) {
        logger.error('Error setting up payment subscription:', error);
      }
    };

    // ✅ Immediate setup (not delayed) for better order verification UX
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
          realtimeChannel = null;
        }
        queryClient.setQueryData(['paymentStatus'], null);
      }
    });

    return () => {
      clearTimeout(setupTimeout);
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
      }
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [queryClient]);

  // ✅ COMPUTED VALUES: Enhanced logic
  const isPaid = paymentStatus?.is_paid === true && 
                 paymentStatus?.payment_status === 'settled' &&
                 !!paymentStatus?.user_id; // ✅ Must be linked to user

  const needsPayment = !isPaid;
  const hasUnlinkedPayment = paymentStatus && !paymentStatus.user_id && paymentStatus.is_paid;
  const needsOrderLinking = !isLoading && !paymentStatus && !error;

  // ✅ ENHANCED: Debug logging for order verification
  useEffect(() => {
    if (!isLoading) {
      logger.debug('Payment status computed:', {
        isPaid,
        needsPayment,
        hasUnlinkedPayment,
        needsOrderLinking,
        paymentRecord: paymentStatus?.order_id || 'none',
        userLinked: !!paymentStatus?.user_id
      });
    }
  }, [isPaid, hasUnlinkedPayment, needsOrderLinking, isLoading]);

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid,
    needsPayment,
    hasUnlinkedPayment,
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    userName: paymentStatus?.customer_name || null
  };
};