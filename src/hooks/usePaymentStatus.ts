// src/hooks/usePaymentStatus.ts - FIXED VERSION

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { validateAuthSession } from '@/lib/authUtils';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { RealtimeChannel, UserResponse, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface PaymentStatus {
  id: string;
  user_id: string | null;
  is_paid: boolean;
  pg_reference_id: string | null;
  order_id: string | null;
  email: string | null;
  payment_status: string;
  created_at: Date | undefined;
  updated_at: Date | undefined;
}

export const usePaymentStatus = () => {
  const queryClient = useQueryClient();

  const { data: paymentStatus, isLoading, error, refetch } = useQuery<PaymentStatus | null, Error>({
    queryKey: ['paymentStatus'],
    queryFn: async (): Promise<PaymentStatus | null> => {
      const isValid = await validateAuthSession();
      if (!isValid) {
        return null;
      }

      const { data: { user } }: UserResponse = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      console.log(`🔍 Fetching payment status for user: ${user.id} (${user.email})`);

      // ✅ STRATEGY 1: Check by user_id first (proper linked payments)
      console.log('🔍 Checking payments by user_id...');
      let { data: paymentsByUserId, error: userIdError } = await supabase
        .from('user_payments')
        .select(`id,user_id,is_paid,pg_reference_id,order_id,email,payment_status,created_at,updated_at`)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (userIdError) {
        console.error('❌ Error fetching by user_id:', userIdError);
      } else if (paymentsByUserId && paymentsByUserId.length > 0) {
        console.log('✅ Found payment by user_id:', paymentsByUserId[0]);
        return {
          ...paymentsByUserId[0],
          created_at: safeParseDate(paymentsByUserId[0].created_at),
          updated_at: safeParseDate(paymentsByUserId[0].updated_at),
        };
      }

      // ✅ STRATEGY 2: Check by email (unlinked payments)
      console.log('🔍 No payment found by user_id, checking by email...');
      let { data: paymentsByEmail, error: emailError } = await supabase
        .from('user_payments')
        .select(`id,user_id,is_paid,pg_reference_id,order_id,email,payment_status,created_at,updated_at`)
        .eq('email', user.email)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (emailError) {
        console.error('❌ Error fetching by email:', emailError);
        return null;
      }

      if (paymentsByEmail && paymentsByEmail.length > 0) {
        const payment = paymentsByEmail[0];
        console.log('⚠️ Found payment by email but not linked to user_id:', payment);
        
        // ✅ AUTO-FIX: Link payment to current user
        if (!payment.user_id) {
          console.log('🔧 Auto-linking payment to current user...');
          try {
            const { error: updateError } = await supabase
              .from('user_payments')
              .update({ 
                user_id: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', payment.id);

            if (updateError) {
              console.error('❌ Failed to auto-link payment:', updateError);
            } else {
              console.log('✅ Successfully auto-linked payment');
              payment.user_id = user.id; // Update local data
            }
          } catch (linkError) {
            console.error('❌ Error during auto-linking:', linkError);
          }
        }

        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
        };
      }

      console.log('❌ No payment status found for user');
      return null;
    },
    enabled: true,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // ✅ Enhanced real-time subscription to catch both user_id and email changes
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (!user) {
        return;
      }

      // ✅ Subscribe to changes for both user_id and email
      realtimeChannel = supabase
        .channel('payment-status-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_payments', 
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            console.log('📡 Real-time payment update (by user_id):', payload);
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
            console.log('📡 Real-time payment update (by email):', payload);
            queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
          }
        )
        .subscribe();
    };

    setupSubscription();

    authSubscription = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
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

  // ✅ Enhanced return with better status indicators
  const isPaid = paymentStatus?.is_paid === true;
  const needsPayment = !paymentStatus || !isPaid;
  const hasUnlinkedPayment = paymentStatus && !paymentStatus.user_id;

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid,
    needsPayment,
    hasUnlinkedPayment, // Indicates if payment exists but not linked
    userName: null
  };
};