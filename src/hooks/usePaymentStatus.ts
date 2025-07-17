// src/hooks/usePaymentStatus.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { validateAuthSession } from '@/lib/authUtils';
import { safeParseDate } from '@/hooks/useSupabaseSync'; // Pastikan safeParseDate diimpor dengan benar

export interface PaymentStatus {
  id: string;
  user_id: string;
  is_paid: boolean;
  pg_reference_id: string | null;
  order_id: string | null;
  email: string | null;
  payment_status: string;
  created_at: Date | undefined; // Ubah dari string menjadi Date | undefined
  updated_at: Date | undefined; // Ubah dari string menjadi Date | undefined
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
        .select(`id,user_id,is_paid,pg_reference_id,order_id,email,payment_status,created_at,updated_at`)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching payment status:', error);
        return null;
      }

      // MODIFIKASI SESUAI INSTRUKSI: Konversi string tanggal menjadi objek Date
      if (data) {
        return {
          ...data,
          created_at: safeParseDate(data.created_at),
          updated_at: safeParseDate(data.updated_at),
        };
      }

      return null; // Mengembalikan null jika tidak ada data
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

    // Panggil setupSubscription saat komponen di-mount atau user berubah
    // Tambahkan listener untuk perubahan sesi autentikasi
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id !== supabase.auth.getUser().data.user?.id) { // Cek jika user ID berubah
        setupSubscription();
      }
    });

    setupSubscription(); // Panggil saat komponen pertama kali di-mount

    return () => {
      supabase.removeChannel('payment-status-changes'); // Pastikan channel dibersihkan
      authListener?.unsubscribe(); // Bersihkan listener auth
    };
  }, [queryClient]); // Dependensi hanya queryClient

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid: paymentStatus?.is_paid === true,
    needsPayment: !paymentStatus || !paymentStatus.is_paid,
    userName: null // Tetap null karena 'name' dihapus dari interface
  };
};