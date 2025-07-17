// src/hooks/usePaymentStatus.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { validateAuthSession } from '@/lib/authUtils';
import { safeParseDate } from '@/hooks/useSupabaseSync';
import { RealtimeChannel, UserResponse, AuthChangeEvent, Session } from '@supabase/supabase-js'; // Ensure correct imports

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

  const { data: paymentStatus, isLoading, error, refetch } = useQuery<PaymentStatus | null, Error>({ // Add Error type for consistency
    queryKey: ['paymentStatus'],
    queryFn: async (): Promise<PaymentStatus | null> => {
      const isValid = await validateAuthSession();
      if (!isValid) {
        return null;
      }

      const { data, error: getUserError }: UserResponse = await supabase.auth.getUser(); // Explicitly type UserResponse
      if (getUserError) {
        console.error("Error getting user in usePaymentStatus:", getUserError);
        return null;
      }
      const user = data?.user;

      if (!user) {
        return null;
      }

      const { data: paymentData, error: fetchError } = await supabase
        .from('user_payments')
        .select(`id,user_id,is_paid,pg_reference_id,order_id,email,payment_status,created_at,updated_at`)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching payment status:', fetchError);
        return null;
      }

      if (paymentData) {
        return {
          ...paymentData,
          created_at: safeParseDate(paymentData.created_at),
          updated_at: safeParseDate(paymentData.updated_at),
        };
      }

      return null;
    },
    enabled: true,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Set up real-time subscription for payment status updates
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null; // Store the auth subscription here

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Clean up previous real-time channel if it exists
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel); // Also remove the channel from Supabase client's memory
        realtimeChannel = null;
      }

      if (!user) {
        console.log('No user, skipping real-time subscription setup.');
        return;
      }

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
            console.log('Payment status updated:', payload);
            queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
          }
        )
        .subscribe();
    };

    // Initial setup when the component mounts
    setupSubscription();

    // Listener for auth state changes
    authSubscription = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { // Explicitly type event and session
        console.log('Auth state changed:', _event, session);
        // Only re-setup subscription if the user session actually changes (login/logout)
        // This avoids unnecessary re-subscriptions on token refresh, etc.
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
            setupSubscription();
        }
    });


    return () => {
      // Cleanup for real-time channel
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
        console.log('Realtime channel dibersihkan.');
      }
      // Cleanup for auth listener
      if (authSubscription?.data?.subscription) { // Access the subscription object correctly
        authSubscription.data.subscription.unsubscribe();
        console.log('Auth listener dibersihkan.');
      }
    };
  }, [queryClient]); // Dependency remains queryClient

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid: paymentStatus?.is_paid === true,
    needsPayment: !paymentStatus || !paymentStatus.is_paid,
    userName: null
  };
};