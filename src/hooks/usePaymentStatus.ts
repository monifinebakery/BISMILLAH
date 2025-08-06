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
        console.log('[usePaymentStatus] User not authenticated');
        return null;
      }

      const user = await getCurrentUser();
      if (!user) {
        console.log('[usePaymentStatus] No user found');
        return null;
      }

      console.log('[usePaymentStatus] Checking payment for user:', user.email);

      // ✅ OPTIMIZED: Parallel queries for better performance
      const [linkedResult, unlinkedResult] = await Promise.allSettled([
        // Query 1: Check linked payments
        supabase
          .from('user_payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_paid', true)
          .eq('payment_status', 'settled')
          .order('updated_at', { ascending: false })
          .limit(1),
        
        // Query 2: Check unlinked payments
        supabase
          .from('user_payments')
          .select('*')
          .is('user_id', null)
          .eq('email', user.email)
          .eq('is_paid', true)
          .eq('payment_status', 'settled')
          .order('updated_at', { ascending: false })
          .limit(1)
      ]);

      // Process linked payments result
      if (linkedResult.status === 'fulfilled' && 
          !linkedResult.value.error && 
          linkedResult.value.data?.length) {
        
        const payment = linkedResult.value.data[0];
        console.log('[usePaymentStatus] Found linked payment:', payment.order_id);
        
        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.payment_date),
        };
      }

      // Process unlinked payments result
      if (unlinkedResult.status === 'fulfilled' && 
          !unlinkedResult.value.error && 
          unlinkedResult.value.data?.length) {
        
        const payment = unlinkedResult.value.data[0];
        console.log('[usePaymentStatus] Found unlinked payment:', payment.order_id);
        
        // ✅ NON-BLOCKING: Try auto-link but don't wait for it
        if (!payment.user_id) {
          // Fire and forget auto-link
          supabase
            .from('user_payments')
            .update({ 
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
            .then(({ data: updatedPayment, error: updateError }) => {
              if (!updateError && updatedPayment) {
                console.log('[usePaymentStatus] Auto-linked payment successfully');
                // Trigger a refetch after successful auto-link
                setTimeout(() => queryClient.invalidateQueries({ queryKey: ['paymentStatus'] }), 1000);
              }
            })
            .catch(error => console.error('[usePaymentStatus] Auto-link failed:', error));
        }

        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.payment_date),
        };
      }

      console.log('[usePaymentStatus] No payment found for user');
      return null;
    },
    enabled: true,
    staleTime: 60000, // 1 minute - longer stale time for better performance
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Disable auto-refetch on focus for better performance
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message?.includes('session missing') || error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 1; // Reduce retry attempts
    },
  });

  // ✅ OPTIMIZED: Lazy real-time subscription setup
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let setupTimeout: NodeJS.Timeout;

    const setupSubscription = async () => {
      // Cleanup existing subscription
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      // ✅ FAST: Quick check without waiting
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        console.log('[usePaymentStatus] Not authenticated, skipping subscription setup');
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        console.log('[usePaymentStatus] No user found, skipping subscription setup');
        return;
      }

      console.log('[usePaymentStatus] Setting up realtime subscription for user:', user.email);

      // ✅ OPTIMIZED: Simpler subscription with debounced invalidation
      realtimeChannel = supabase
        .channel(`payment-changes-${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_payments', 
            filter: `user_id=eq.${user.id}` 
          },
          () => {
            console.log('[usePaymentStatus] Payment change detected (user_id)');
            // Debounce invalidation
            clearTimeout(setupTimeout);
            setupTimeout = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
            }, 1000);
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_payments', 
            filter: `email=eq.${user.email}` 
          },
          () => {
            console.log('[usePaymentStatus] Payment change detected (email)');
            // Debounce invalidation
            clearTimeout(setupTimeout);
            setupTimeout = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
            }, 1000);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[usePaymentStatus] Realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[usePaymentStatus] Realtime subscription error');
          }
        });
    };

    // ✅ DELAYED: Setup subscription after component mounts (non-blocking)
    setupTimeout = setTimeout(() => {
      setupSubscription();
    }, 2000); // 2 second delay for better initial load performance

    // Handle auth changes
    authSubscription = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('[usePaymentStatus] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[usePaymentStatus] User signed in, setting up subscription');
        clearTimeout(setupTimeout);
        setupTimeout = setTimeout(() => {
          setupSubscription();
          queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
        }, 1000);
      } else if (event === 'SIGNED_OUT') {
        console.log('[usePaymentStatus] User signed out, cleaning up subscription');
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
        console.log('[usePaymentStatus] Cleaning up realtime subscription');
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
      }
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [queryClient]);

  // ✅ COMPUTED VALUES: Safe calculations
  const isPaid = paymentStatus?.is_paid === true && paymentStatus?.payment_status === 'settled';
  const needsPayment = !isPaid;
  const hasUnlinkedPayment = paymentStatus && !paymentStatus.user_id;
  const needsOrderLinking = !isLoading && !paymentStatus && !error;

  // ✅ REDUCED: Less frequent logging
  useEffect(() => {
    if (!isLoading && process.env.NODE_ENV === 'development') {
      console.log('[usePaymentStatus] Payment status update:', {
        isPaid,
        needsPayment,
        hasUnlinkedPayment,
        needsOrderLinking,
        paymentRecord: paymentStatus?.order_id || 'none'
      });
    }
  }, [isPaid, isLoading]); // Only log when isPaid or loading changes

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