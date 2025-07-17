// src/hooks/usePaymentStatus.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { validateAuthSession } from '@/lib/authUtils';
import { safeParseDate } from '@/hooks/useSupabaseSync'; // Pastikan safeParseDate diimpor dengan benar
import { RealtimeChannel } from '@supabase/supabase-js'; // Tambahkan import ini

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

      // Perbaikan di sini agar lebih tangguh
      const { data, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        console.error("Error getting user in usePaymentStatus:", getUserError);
        return null; // Tangani kasus error
      }
      const user = data?.user; // Akses properti user dengan aman menggunakan optional chaining

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

      // Konversi string tanggal menjadi objek Date
      if (paymentData) {
        return {
          ...paymentData,
          created_at: safeParseDate(paymentData.created_at),
          updated_at: safeParseDate(paymentData.updated_at),
        };
      }

      return null; // Mengembalikan null jika tidak ada data pembayaran
    },
    enabled: true,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Set up real-time subscription for payment status updates
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null; // Deklarasikan variabel untuk menampung channel

    const setupSubscription = async () => {
      // Pastikan user ada sebelum mencoba berlangganan
      const { data: { user } } = await supabase.auth.getUser();

      // Hapus channel sebelumnya jika ada untuk menghindari duplikasi langganan
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (!user) {
        console.log('Tidak ada pengguna, tidak berlangganan realtime.');
        return;
      }

      realtimeChannel = supabase // Tetapkan ke variabel
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

    // Ini akan memicu setupSubscription saat komponen di-mount.
    setupSubscription();

    // Listener untuk perubahan sesi autentikasi, agar langganan diperbarui saat login/logout.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Panggil setupSubscription jika ada perubahan status auth yang relevan
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        setupSubscription();
      }
    });


    return () => {
      // Dalam fungsi cleanup, unsubscribe dari channel jika ada
      if (realtimeChannel) {
        realtimeChannel.unsubscribe(); // Panggil unsubscribe langsung pada objek channel
        console.log('Realtime channel dibersihkan.');
      }
      authListener?.unsubscribe(); // Pastikan listener auth juga dibersihkan
      console.log('Auth listener dibersihkan.');
    };
  }, [queryClient]); // Dependensi hanya queryClient, untuk memastikan hook tidak sering di-run ulang

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