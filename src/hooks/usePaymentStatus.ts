// src/hooks/usePaymentStatus.ts - CLEAN VERSION WITHOUT LOGS

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { validateAuthSession } from '@/lib/authUtils';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { RealtimeChannel, UserResponse, AuthChangeEvent, Session } from '@supabase/supabase-js';

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
      const isValid = await validateAuthSession();
      if (!isValid) {
        return null;
      }

      const { data: { user } }: UserResponse = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      // Check by user_id first (properly linked payments)
      let { data: paymentsByUserId, error: userIdError } = await supabase
        .from('user_payments')
        .select(`*`)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!userIdError && paymentsByUserId && paymentsByUserId.length > 0) {
        // Look for a paid payment
        const paidPayment = paymentsByUserId.find(p => 
          p.is_paid === true && p.payment_status === 'settled'
        );
        
        if (paidPayment) {
          return {
            ...paidPayment,
            created_at: safeParseDate(paidPayment.created_at),
            updated_at: safeParseDate(paidPayment.updated_at),
            payment_date: safeParseDate(paidPayment.payment_date),
          };
        }
      }

      // Check by email (unlinked payments)
      let { data: paymentsByEmail, error: emailError } = await supabase
        .from('user_payments')
        .select(`*`)
        .eq('email', user.email)
        .order('updated_at', { ascending: false });

      if (!emailError && paymentsByEmail && paymentsByEmail.length > 0) {
        // Look for a paid payment
        const paidPayment = paymentsByEmail.find(p => 
          p.is_paid === true && p.payment_status === 'settled'
        );
        
        if (paidPayment) {
          // Auto-link if payment is not linked to user
          if (!paidPayment.user_id) {
            try {
              const { data: updatedPayment, error: updateError } = await supabase
                .from('user_payments')
                .update({ 
                  user_id: user.id,
                  updated_at: new Date().toISOString()
                })
                .eq('id', paidPayment.id)
                .select('*')
                .single();

              if (!updateError) {
                return {
                  ...updatedPayment,
                  created_at: safeParseDate(updatedPayment.created_at),
                  updated_at: safeParseDate(updatedPayment.updated_at),
                  payment_date: safeParseDate(updatedPayment.payment_date),
                };
              }
            } catch (linkError) {
              // Continue with unlinked payment if auto-link fails
            }
          }

          return {
            ...paidPayment,
            created_at: safeParseDate(paidPayment.created_at),
            updated_at: safeParseDate(paidPayment.updated_at),
            payment_date: safeParseDate(paidPayment.payment_date),
          };
        }
      }

      return null;
    },
    enabled: true,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Real-time subscription
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

  // Payment status logic
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