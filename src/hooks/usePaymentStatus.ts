// src/hooks/usePaymentStatus.ts - OPTIMIZED FOR FASTER LOADING

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated } from '@/lib/authService';
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
      // ✅ FAST: Quick auth check without throwing
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

      // ✅ STEP 1: Check linked payments first (priority)
      const { data: linkedPayments, error: linkedError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (linkedError) {
        logger.error('Error fetching linked payments:', linkedError);
        throw new Error('Gagal mengambil data pembayaran');
      }

      if (linkedPayments?.length) {
        const payment = linkedPayments[0];
        logger.success('Found linked payment:', payment.order_id);
        
        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.payment_date),
        };
      }

      // ✅ STEP 2: Check unlinked payments for this email
      const { data: unlinkedPayments, error: unlinkedError } = await supabase
        .from('user_payments')
        .select('*')
        .is('user_id', null)
        .eq('email', user.email)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (unlinkedError) {
        logger.error('Error fetching unlinked payments:', unlinkedError);
        // Don't throw here, just continue without unlinked payments
      }

      if (unlinkedPayments?.length) {
        const payment = unlinkedPayments[0];
        logger.success('Found unlinked payment:', payment.order_id);
        
        // ✅ SAFE AUTO-LINK: Try to auto-link with proper error handling
        try {
          const { data: updatedPayment, error: updateError } = await supabase
            .from('user_payments')
            .update({ 
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
            .is('user_id', null) // Only update if still unlinked
            .select('*')
            .single();

          if (updateError) {
            // ✅ Handle constraint errors gracefully
            if (updateError.code === '23505') {
              logger.warn('Auto-link failed due to constraint, user may already have payment');
              // Return the unlinked payment as-is, let user handle manually
            } else {
              logger.error('Auto-link failed:', updateError);
            }
            
            // Return original payment even if auto-link failed
            return {
              ...payment,
              created_at: safeParseDate(payment.created_at),
              updated_at: safeParseDate(payment.updated_at),
              payment_date: safeParseDate(payment.payment_date),
            };
          }

          if (updatedPayment) {
            logger.success('Auto-linked payment successfully');
            return {
              ...updatedPayment,
              created_at: safeParseDate(updatedPayment.created_at),
              updated_at: safeParseDate(updatedPayment.updated_at),
              payment_date: safeParseDate(updatedPayment.payment_date),
            };
          }
        } catch (autoLinkError) {
          logger.error('Auto-link exception:', autoLinkError);
          // Return unlinked payment, let user handle manually
        }

        // Fallback: return unlinked payment
        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.payment_date),
        };
      }

      logger.hook('usePaymentStatus', 'No payment found for user');
      return null;
    },
    enabled: true,
    staleTime: 30000, // 30 seconds - reduced for better consistency
    gcTime: 300000, // 5 minutes (replaces deprecated cacheTime)
    refetchOnWindowFocus: true, // Enable for better user experience
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message?.includes('session missing') || 
          error.message?.includes('not authenticated') ||
          error.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 2; // Allow 2 retries
    },
  });

  // ✅ OPTIMIZED: Simpler real-time subscription
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let debounceTimeout: NodeJS.Timeout;

    const setupSubscription = async () => {
      try {
        // Cleanup existing subscription
        if (realtimeChannel) {
          await supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }

        // Quick auth check
        const isAuth = await isAuthenticated();
        if (!isAuth) return;

        const user = await getCurrentUser();
        if (!user) return;

        logger.hook('usePaymentStatus', 'Setting up realtime subscription');

        // ✅ SINGLE CHANNEL: Monitor both user_id and email changes
        realtimeChannel = supabase
          .channel(`payment-updates-${user.id}`)
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_payments'
            },
            (payload) => {
              logger.hook('usePaymentStatus', 'Payment change detected:', payload.eventType);
              
              // Check if this change is relevant to current user
              const isRelevant = 
                payload.new?.user_id === user.id || 
                payload.new?.email === user.email ||
                payload.old?.user_id === user.id || 
                payload.old?.email === user.email;

              if (isRelevant) {
                // Debounced invalidation to prevent excessive refetches
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                  logger.hook('usePaymentStatus', 'Invalidating payment status query');
                  queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
                }, 1500);
              }
            }
          )
          .subscribe((status) => {
            logger.hook('usePaymentStatus', 'Subscription status:', status);
            if (status === 'CHANNEL_ERROR') {
              logger.error('Realtime subscription error, will retry');
              // Retry subscription after delay
              setTimeout(setupSubscription, 5000);
            }
          });

      } catch (error) {
        logger.error('Error setting up subscription:', error);
      }
    };

    // ✅ DELAYED SETUP: Better initial load performance
    const setupTimer = setTimeout(setupSubscription, 1000);

    // Handle auth changes
    authSubscription = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      logger.hook('usePaymentStatus', 'Auth state changed:', event);
      
      clearTimeout(debounceTimeout);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in, setup subscription and refetch
        setTimeout(() => {
          setupSubscription();
          queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
        }, 500);
      } else if (event === 'SIGNED_OUT') {
        // User signed out, cleanup
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
        queryClient.setQueryData(['paymentStatus'], null);
      }
    });

    return () => {
      clearTimeout(setupTimer);
      clearTimeout(debounceTimeout);
      
      if (realtimeChannel) {
        logger.hook('usePaymentStatus', 'Cleaning up realtime subscription');
        supabase.removeChannel(realtimeChannel);
      }
      
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [queryClient]);

  // ✅ COMPUTED VALUES: Safe calculations with better logic
  const isPaid = Boolean(
    paymentStatus?.is_paid === true && 
    paymentStatus?.payment_status === 'settled' &&
    paymentStatus?.user_id // Must be linked to be considered fully paid
  );
  
  const needsPayment = !isPaid && !isLoading && !error;
  
  const hasUnlinkedPayment = Boolean(
    paymentStatus && 
    !paymentStatus.user_id && 
    paymentStatus.is_paid === true && 
    paymentStatus.payment_status === 'settled'
  );
  
  const needsOrderLinking = Boolean(
    !isLoading && 
    !paymentStatus && 
    !error
  );

  // ✅ PERFORMANCE: Only log significant changes
  useEffect(() => {
    if (!isLoading && process.env.NODE_ENV === 'development') {
      logger.debug('Payment status computed:', {
        isPaid,
        needsPayment,
        hasUnlinkedPayment,
        needsOrderLinking,
        orderId: paymentStatus?.order_id,
        hasUserId: Boolean(paymentStatus?.user_id)
      });
    }
  }, [isPaid, hasUnlinkedPayment, paymentStatus?.order_id]); 

  // ✅ HELPER: Force refresh function
  const forceRefresh = () => {
    logger.hook('usePaymentStatus', 'Force refresh requested');
    queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
    return refetch();
  };

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    forceRefresh, // ✅ NEW: Force refresh function
    isPaid,
    needsPayment,
    hasUnlinkedPayment,
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    userName: paymentStatus?.customer_name || null,
    // ✅ ADDITIONAL: Helpful status info
    orderStatus: {
      orderId: paymentStatus?.order_id || null,
      isLinked: Boolean(paymentStatus?.user_id),
      paymentDate: paymentStatus?.payment_date || null,
      amount: paymentStatus?.amount || null,
      currency: paymentStatus?.currency || 'IDR'
    }
  };
};