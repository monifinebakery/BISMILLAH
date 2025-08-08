// src/hooks/usePaymentStatus.ts - OPTIMIZED & SIMPLIFIED

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
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

// ✅ OPTIMIZED: Single query function
const fetchPaymentStatus = async (): Promise<PaymentStatus | null> => {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  logger.hook('usePaymentStatus', 'Fetching payment for user:', user.email);

  // ✅ SINGLE QUERY: Get all payments with OR condition for better performance
  const { data: payments, error } = await supabase
    .from('user_payments')
    .select('*')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .eq('is_paid', true)
    .eq('payment_status', 'settled')
    .order('updated_at', { ascending: false })
    .limit(5); // Get a few records to handle edge cases

  if (error) {
    logger.error('Error fetching payments:', error);
    throw new Error(`Gagal mengambil data pembayaran: ${error.message}`);
  }

  if (!payments?.length) {
    logger.hook('usePaymentStatus', 'No payments found');
    return null;
  }

  // ✅ PRIORITIZE: Linked payment first
  const linkedPayment = payments.find(p => p.user_id === user.id);
  if (linkedPayment) {
    logger.success('Found linked payment:', linkedPayment.order_id);
    return {
      ...linkedPayment,
      created_at: safeParseDate(linkedPayment.created_at),
      updated_at: safeParseDate(linkedPayment.updated_at),
      payment_date: safeParseDate(linkedPayment.payment_date),
    };
  }

  // ✅ HANDLE UNLINKED: Return unlinked payment for manual linking
  const unlinkedPayment = payments.find(p => !p.user_id && p.email === user.email);
  if (unlinkedPayment) {
    logger.success('Found unlinked payment:', unlinkedPayment.order_id);
    return {
      ...unlinkedPayment,
      created_at: safeParseDate(unlinkedPayment.created_at),
      updated_at: safeParseDate(unlinkedPayment.updated_at),
      payment_date: safeParseDate(unlinkedPayment.payment_date),
    };
  }

  return null;
};

export const usePaymentStatus = () => {
  const queryClient = useQueryClient();
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  // ✅ SIMPLIFIED: Main query with better error handling
  const { 
    data: paymentStatus, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<PaymentStatus | null, Error>({
    queryKey: ['paymentStatus'],
    queryFn: fetchPaymentStatus,
    enabled: true,
    staleTime: 60000, // 1 minute - reasonable for payment status
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // ✅ SMART RETRY: Don't retry on auth or validation errors
      const message = error?.message?.toLowerCase() || '';
      if (
        message.includes('session') || 
        message.includes('authenticated') ||
        message.includes('jwt') ||
        message.includes('permission') ||
        message.includes('policy')
      ) {
        logger.warn('Auth error, not retrying:', message);
        return false;
      }
      return failureCount < 2;
    },
  });

  // ✅ OPTIMIZED: Lightweight realtime subscription
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupRealtime = async () => {
      try {
        const isAuth = await isAuthenticated();
        const user = await getCurrentUser();
        
        if (!isAuth || !user) return;

        logger.hook('usePaymentStatus', 'Setting up realtime for user:', user.email);

        // ✅ FOCUSED SUBSCRIPTION: Only relevant changes
        channel = supabase
          .channel(`payments-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_payments',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              logger.hook('usePaymentStatus', 'Linked payment changed:', payload.eventType);
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
              logger.hook('usePaymentStatus', 'Email payment changed:', payload.eventType);
              queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.success('Payment realtime connected');
            } else if (status === 'CHANNEL_ERROR') {
              logger.error('Payment realtime error');
            }
          });

      } catch (error) {
        logger.error('Realtime setup failed:', error);
      }
    };

    // ✅ DELAYED SETUP: After initial load
    const timer = setTimeout(setupRealtime, 2000);

    // ✅ AUTH LISTENER: Handle sign in/out
    authSubscription = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        logger.hook('usePaymentStatus', 'Auth changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            setupRealtime();
            queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          if (channel) {
            supabase.removeChannel(channel);
            channel = null;
          }
          queryClient.setQueryData(['paymentStatus'], null);
        }
      }
    );

    return () => {
      clearTimeout(timer);
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [queryClient]);

  // ✅ COMPUTED VALUES: Clear and predictable
  const isPaid = Boolean(
    paymentStatus?.is_paid === true && 
    paymentStatus?.payment_status === 'settled' &&
    paymentStatus?.user_id // Must be linked
  );
  
  const hasUnlinkedPayment = Boolean(
    paymentStatus && 
    !paymentStatus.user_id && 
    paymentStatus.is_paid === true && 
    paymentStatus.payment_status === 'settled'
  );
  
  const needsPayment = !isPaid && !isLoading && !hasUnlinkedPayment;
  const needsOrderLinking = hasUnlinkedPayment;

  // ✅ MANUAL LINKING: Simplified function for order popup
  const linkPaymentToUser = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not found');

      logger.hook('usePaymentStatus', 'Attempting to link order:', orderId);

      // ✅ SAFE UPDATE: Only update if payment exists and is unlinked
      const { data, error } = await supabase
        .from('user_payments')
        .update({ 
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId.toUpperCase().trim())
        .is('user_id', null)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Link payment error:', error);
        throw new Error('Gagal menghubungkan pembayaran');
      }

      if (!data) {
        throw new Error('Order ID tidak ditemukan atau sudah terhubung');
      }

      logger.success('Payment linked successfully:', orderId);
      
      // ✅ IMMEDIATE REFRESH: Update the cache
      queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      
      return true;
    } catch (error) {
      logger.error('Link payment failed:', error);
      throw error;
    }
  }, [queryClient]);

  // ✅ DEBUG INFO: Only in development
  useEffect(() => {
    if (import.meta.env.DEV && !isLoading) {
      logger.debug('Payment Status:', {
        isPaid,
        hasUnlinkedPayment,
        needsPayment,
        orderId: paymentStatus?.order_id,
        isLinked: Boolean(paymentStatus?.user_id)
      });
    }
  }, [isPaid, hasUnlinkedPayment, paymentStatus?.order_id, isLoading]);

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    
    // Status flags
    isPaid,
    needsPayment,
    hasUnlinkedPayment,
    needsOrderLinking,
    
    // Order popup
    showOrderPopup,
    setShowOrderPopup,
    linkPaymentToUser,
    
    // User info
    userName: paymentStatus?.customer_name || null,
    
    // Order info
    orderStatus: {
      orderId: paymentStatus?.order_id || null,
      isLinked: Boolean(paymentStatus?.user_id),
      paymentDate: paymentStatus?.payment_date || null,
      amount: paymentStatus?.amount || null,
      currency: paymentStatus?.currency || 'IDR'
    }
  };
};