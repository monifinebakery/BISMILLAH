// src/hooks/usePaymentStatus.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { validateAuthSession } from '@/lib/authUtils';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { RealtimeChannel, UserResponse, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface PaymentStatus {
  id: string;
  user_id: string;
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

      // ===================================================================
      // --- PERBAIKAN UTAMA DI SINI ---
      // ===================================================================
      console.log(`Fetching latest payment status for user: ${user.id}`);
      const { data: paymentDataArray, error: fetchError } = await supabase
        .from('user_payments')
        .select(`id,user_id,is_paid,pg_reference_id,order_id,email,payment_status,created_at,updated_at`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // 1. Urutkan dari yang paling baru
        .limit(1);                                  // 2. Ambil hanya satu record teratas

      if (fetchError) {
        // Error ini sekarang seharusnya tidak terjadi lagi untuk kasus duplikasi
        console.error('Error fetching payment status:', fetchError);
        return null;
      }

      // 3. Ambil elemen pertama dari array (jika ada)
      const latestPaymentData = paymentDataArray && paymentDataArray.length > 0 ? paymentDataArray[0] : null;

      if (latestPaymentData) {
        console.log('Latest payment status found:', latestPaymentData);
        return {
          ...latestPaymentData,
          created_at: safeParseDate(latestPaymentData.created_at),
          updated_at: safeParseDate(latestPaymentData.updated_at),
        };
      }
      // ===================================================================

      console.log('No payment status found for user.');
      return null;
    },
    enabled: true,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // useEffect untuk real-time subscription tidak perlu diubah, sudah bagus.
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
        .channel('payment-status-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_payments', filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log('Real-time payment update received:', payload);
            // Invalidate query untuk memicu refetch dengan logika yang sudah diperbaiki
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

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid: paymentStatus?.is_paid === true,
    needsPayment: !paymentStatus || !paymentStatus.is_paid,
    userName: null // Anda mungkin ingin mengisi ini dari data user di masa depan
  };
};