// src/hooks/usePaymentStatus.ts - ENHANCED DEBUG VERSION

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
        console.log('❌ Auth session invalid');
        return null;
      }

      const { data: { user } }: UserResponse = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        return null;
      }

      console.log(`🔍 === PAYMENT STATUS DEBUG START ===`);
      console.log(`User ID: ${user.id}`);
      console.log(`User Email: ${user.email}`);

      // ✅ STRATEGY 1: Check by user_id first
      console.log('🔍 Step 1: Checking payments by user_id...');
      let { data: paymentsByUserId, error: userIdError } = await supabase
        .from('user_payments')
        .select(`*`) // Select all fields for debugging
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (userIdError) {
        console.error('❌ Error fetching by user_id:', userIdError);
      } else {
        console.log(`📊 Found ${paymentsByUserId?.length || 0} payments by user_id:`, paymentsByUserId);
        
        if (paymentsByUserId && paymentsByUserId.length > 0) {
          const payment = paymentsByUserId[0];
          console.log('✅ Using payment by user_id:', {
            id: payment.id,
            is_paid: payment.is_paid,
            payment_status: payment.payment_status,
            user_id: payment.user_id,
            email: payment.email,
            willBePaid: payment.is_paid === true && payment.payment_status === 'settled'
          });
          
          return {
            ...payment,
            created_at: safeParseDate(payment.created_at),
            updated_at: safeParseDate(payment.updated_at),
          };
        }
      }

      // ✅ STRATEGY 2: Check by email
      console.log('🔍 Step 2: Checking payments by email...');
      let { data: paymentsByEmail, error: emailError } = await supabase
        .from('user_payments')
        .select(`*`) // Select all fields for debugging
        .eq('email', user.email)
        .order('updated_at', { ascending: false });

      if (emailError) {
        console.error('❌ Error fetching by email:', emailError);
      } else {
        console.log(`📊 Found ${paymentsByEmail?.length || 0} payments by email:`, paymentsByEmail);
        
        if (paymentsByEmail && paymentsByEmail.length > 0) {
          const payment = paymentsByEmail[0];
          console.log('⚠️ Found payment by email:', {
            id: payment.id,
            is_paid: payment.is_paid,
            payment_status: payment.payment_status,
            user_id: payment.user_id,
            email: payment.email,
            willBePaid: payment.is_paid === true && payment.payment_status === 'settled'
          });
          
          // ✅ AUTO-FIX: Link payment to current user if not linked
          if (!payment.user_id) {
            console.log('🔧 Auto-linking payment to current user...');
            try {
              const { data: updatedPayment, error: updateError } = await supabase
                .from('user_payments')
                .update({ 
                  user_id: user.id,
                  updated_at: new Date().toISOString()
                })
                .eq('id', payment.id)
                .select('*')
                .single();

              if (updateError) {
                console.error('❌ Failed to auto-link payment:', updateError);
              } else {
                console.log('✅ Successfully auto-linked payment:', updatedPayment);
                // Invalidate cache to refresh data
                queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
                return {
                  ...updatedPayment,
                  created_at: safeParseDate(updatedPayment.created_at),
                  updated_at: safeParseDate(updatedPayment.updated_at),
                };
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
      }

      // ✅ STRATEGY 3: Broad search for debugging (check all payments for this email)
      console.log('🔍 Step 3: Broad search for debugging...');
      let { data: allPayments, error: allError } = await supabase
        .from('user_payments')
        .select(`*`)
        .or(`email.eq.${user.email},user_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (!allError && allPayments) {
        console.log(`📊 All related payments found:`, allPayments);
        allPayments.forEach((payment, index) => {
          console.log(`Payment ${index + 1}:`, {
            id: payment.id,
            user_id: payment.user_id,
            email: payment.email,
            is_paid: payment.is_paid,
            payment_status: payment.payment_status,
            created_at: payment.created_at
          });
        });
      }

      console.log('❌ No payment status found for user');
      console.log(`🔍 === PAYMENT STATUS DEBUG END ===`);
      return null;
    },
    enabled: true,
    staleTime: 10000, // Reduced stale time for debugging
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refetch every 30 seconds for debugging
  });

  // ✅ Enhanced real-time subscription
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
        console.log('👤 No user for real-time subscription');
        return;
      }

      console.log(`📡 Setting up real-time subscription for user: ${user.id} (${user.email})`);

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
            table: 'user