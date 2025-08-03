// src/hooks/usePaymentStatus.ts - UPDATED VERSION

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated } from '@/lib/authService'; // ✅ Updated import
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
      // ✅ Use updated authService functions
      const isValid = await isAuthenticated();
      if (!isValid) return null;

      const user = await getCurrentUser();
      if (!user) return null;

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
            return {
              ...updatedPayment,
              created_at: safeParseDate(updatedPayment.created_at),
              updated_at: safeParseDate(updatedPayment.updated_at),
              payment_date: safeParseDate(updatedPayment.payment_date),
            };
          }
        } catch (linkError) {
          console.error('Auto-link failed:', linkError);
        }

        // Return unlinked payment if auto-link fails
        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.payment_date),
        };
      }

      return null;
    },
    enabled: true,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // ✅ REAL-TIME SUBSCRIPTION: Simplified setup
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

      // Get current user
      const user = await getCurrentUser();
      if (!user) return;

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
          () => queryClient.invalidateQueries({ queryKey: ['paymentStatus'] })
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_payments', 
            filter: `email=eq.${user.email}` 
          },
          () => queryClient.invalidateQueries({ queryKey: ['paymentStatus'] })
        )
        .subscribe();
    };

    // Initial setup
    setupSubscription();

    // Re-setup on auth changes
    authSubscription = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setupSubscription();
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

  // ✅ COMPUTED VALUES: Simplified logic
  const isPaid = paymentStatus?.is_paid === true && paymentStatus?.payment_status === 'settled';
  const needsPayment = !isPaid;
  const hasUnlinkedPayment = paymentStatus && !paymentStatus.user_id;
  const needsOrderLinking = !isLoading && !paymentStatus && !error;

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