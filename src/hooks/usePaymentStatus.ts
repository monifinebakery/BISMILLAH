// src/hooks/usePaymentStatus.ts - FIXED VERSION WITH SAFE SESSION HANDLING

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated } from '@/services/authService'; // ✅ Updated import
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { RealtimeChannel, AuthChangeEvent, Session } from '@supabase/supabase-js';

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
      // ✅ SAFE: Check authentication first
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

      // ✅ STEP 1: Check linked payments by user_id
      const { data: linkedPayments, error: userIdError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!userIdError && linkedPayments?.length) {
        console.log('[usePaymentStatus] Found linked payment:', linkedPayments[0].order_id);
        return {
          ...linkedPayments[0],
          created_at: safeParseDate(linkedPayments[0].created_at),
          updated_at: safeParseDate(linkedPayments[0].updated_at),
          payment_date: safeParseDate(linkedPayments[0].payment_date),
        };
      }

      // ✅ STEP 2: Check unlinked payments by email
      const { data: unlinkedPayments, error: emailError } = await supabase
        .from('user_payments')
        .select('*')
        .is('user_id', null)
        .eq('email', user.email)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!emailError && unlinkedPayments?.length) {
        const payment = unlinkedPayments[0];
        console.log('[usePaymentStatus] Found unlinked payment:', payment.order_id);
        
        // ✅ AUTO-LINK: Try to link unlinked payment to current user
        try {
          const { data: updatedPayment, error: updateError } = await supabase
            .from('user_payments')
            .update({ 
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
            .select('*')
            .single();

          if (!updateError && updatedPayment) {
            console.log('[usePaymentStatus] Auto-linked payment successfully');
            return {
              ...updatedPayment,
              created_at: safeParseDate(updatedPayment.created_at),
              updated_at: safeParseDate(updatedPayment.updated_at),
              payment_date: safeParseDate(updatedPayment.payment_date),
            };
          }
        } catch (linkError) {
          console.error('[usePaymentStatus] Auto-link failed:', linkError);
        }

        // Return unlinked payment if auto-link fails
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
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message?.includes('session missing') || error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // ✅ SAFE REAL-TIME SUBSCRIPTION: Only setup if authenticated
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupSubscription = async () => {
      // Cleanup existing subscription
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      // ✅ SAFE: Check if user is authenticated before setting up subscription
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

      // Setup new subscription for both user_id and email
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
          (payload) => {
            console.log('[usePaymentStatus] Payment change detected (user_id):', payload);
            queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
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
          (payload) => {
            console.log('[usePaymentStatus] Payment change detected (email):', payload);
            queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
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

    // Initial setup
    setupSubscription();

    // Re-setup on auth changes
    authSubscription = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('[usePaymentStatus] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[usePaymentStatus] User signed in, setting up subscription');
        await setupSubscription();
        // Refetch payment status when user signs in
        queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      } else if (event === 'SIGNED_OUT') {
        console.log('[usePaymentStatus] User signed out, cleaning up subscription');
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
        // Clear payment status when user signs out
        queryClient.setQueryData(['paymentStatus'], null);
      }
    });

    return () => {
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

  // ✅ Enhanced logging for debugging
  useEffect(() => {
    if (!isLoading) {
      console.log('[usePaymentStatus] Payment status update:', {
        isPaid,
        needsPayment,
        hasUnlinkedPayment,
        needsOrderLinking,
        paymentRecord: paymentStatus?.order_id || 'none'
      });
    }
  }, [isPaid, needsPayment, hasUnlinkedPayment, needsOrderLinking, paymentStatus, isLoading]);

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