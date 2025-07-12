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
  name: string | null;
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
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // <--- PERUBAHAN DI SINI: dari .single() ke .maybeSingle()

      if (error) {
        // PostgREST error code PGRST116 (0 or multiple rows) tidak lagi muncul di sini untuk 0 rows
        // Tapi error lain (misal, RLS blocking) akan tetap tertangkap.
        console.error('Error fetching payment status:', error);
        return null;
      }

      return data; // Akan mengembalikan null jika 0 baris, atau objek jika 1 baris
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
    // isPaid akan benar jika paymentStatus bukan null DAN is_paid true
    isPaid: paymentStatus?.is_paid === true,
    // User needs to pay jika paymentStatus null (belum ada record) atau is_paid false
    needsPayment: !paymentStatus || !paymentStatus.is_paid,
    // User's name from payment record
    userName: paymentStatus?.name || null
  };
};