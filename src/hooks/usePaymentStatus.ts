// src/hooks/usePaymentStatus.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { validateAuthSession } from '@/lib/authUtils';

export interface PaymentStatus {
  id: string;
  user_id: string;
  is_paid: boolean;
  pg_reference_id: string | null;
  order_id: string | null;
  email: string | null;
  name: string | null; // Pertahankan di interface jika Anda akan mendapatkan 'name' dari sumber lain
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export const usePaymentStatus = () => {
  const queryClient = useQueryClient();

  const { data: paymentStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['paymentStatus'],
    queryFn: async (): Promise<PaymentStatus | null> => {
      const isValid = await validateAuthSession();
      if (!isValid) {
        return null;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_payments')
        .select(`
          id,
          user_id,
          is_paid,
          pg_reference_id,
          order_id,
          email,
          -- KOLOM 'name' DIHAPUS DARI SINI:
          payment_status,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching payment status:', error);
        return null;
      }

      return data;
    },
    enabled: true,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Set up real-time subscription for payment status updates
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [queryClient]);

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid: paymentStatus?.is_paid === true,
    needsPayment: !paymentStatus || !paymentStatus.is_paid,
    // userName sekarang akan selalu null dari paymentStatus jika kolom 'name' tidak dipilih.
    // Jika Anda perlu nama pengguna, ambil dari user.user_metadata atau tabel user_settings.
    userName: null // Atau ambil dari user.user_metadata?.full_name, jika Anda mau
  };
};