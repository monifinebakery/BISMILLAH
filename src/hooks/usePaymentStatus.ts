import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, isAuthenticated, getRecentUnlinkedOrders } from '@/lib/authService';
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

// Fetch payment status for current user
const fetchPaymentStatus = async (): Promise<PaymentStatus | null> => {
  if (!(await isAuthenticated())) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  logger.hook('usePaymentStatus', 'Fetching payment for:', user.email);

  const { data: payments, error } = await supabase
    .from('user_payments')
    .select('*')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .eq('is_paid', true)
    .eq('payment_status', 'settled')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    logger.error('Error fetching payments:', error);
    throw new Error(`Fetch payment failed: ${error.message}`);
  }
  if (!payments?.length) {
    logger.hook('usePaymentStatus', 'No payments found');
    return null;
  }

  // prioritize linked payment
  const linked = payments.find(p => p.user_id === user.id);
  const chosen = linked || payments.find(p => !p.user_id && p.email === user.email) || payments[0];
  return {
    ...chosen,
    created_at: safeParseDate(chosen.created_at),
    updated_at: safeParseDate(chosen.updated_at),
    payment_date: safeParseDate(chosen.payment_date),
  };
};

export function usePaymentStatus() {
  // popup state
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  // recent unlinked orders
  const [recentOrders, setRecentOrders] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const { data: paymentStatus, isLoading, error, refetch } = useQuery<PaymentStatus | null, Error>({
    queryKey: ['paymentStatus'],
    queryFn: fetchPaymentStatus,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: (count, err) => count < 2,
  });

  // load recent orders when popup opens
  useEffect(() => {
    if (showOrderPopup) {
      getRecentUnlinkedOrders()
        .then(setRecentOrders)
        .catch(err => logger.error('Load recent orders failed:', err));
    }
  }, [showOrderPopup]);

  // realtime updates
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let authSub: any;

    const setup = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      channel = supabase
        .channel(`payments-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_payments', filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries(['paymentStatus']);
        })
        .subscribe();
    };

    const timer = setTimeout(setup, 2000);
    authSub = supabase.auth.onAuthStateChange((ev, session: Session | null) => {
      if (ev === 'SIGNED_IN') {
        setup();
        refetch();
      }
      if (ev === 'SIGNED_OUT' && channel) {
        supabase.removeChannel(channel);
      }
    });

    return () => {
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
      authSub?.data?.subscription.unsubscribe();
    };
  }, [queryClient, refetch]);

  // computed flags
  const { isPaid, hasUnlinkedPayment, needsLinking } = useMemo(() => {
    const isPaid = Boolean(paymentStatus?.is_paid && paymentStatus.payment_status === 'settled' && paymentStatus.user_id);
    const hasUnlinked = Boolean(paymentStatus && !paymentStatus.user_id && paymentStatus.is_paid && paymentStatus.payment_status === 'settled');
    return { isPaid, hasUnlinkedPayment: hasUnlinked, needsLinking: hasUnlinked };
  }, [paymentStatus]);

  // link payment
  const linkPayment = useCallback(async (orderId: string) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not found');
    const { data, error } = await supabase
      .from('user_payments')
      .update({ user_id: user.id, updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .select()
      .maybeSingle();
    if (error || !data) throw new Error('Link failed');
    queryClient.invalidateQueries(['paymentStatus']);
    return true;
  }, [queryClient]);

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid,
    hasUnlinkedPayment,
    needsOrderLinking: needsLinking,
    showOrderPopup,
    setShowOrderPopup,
    recentOrders,
    linkPaymentToUser: linkPayment,
  };
}
