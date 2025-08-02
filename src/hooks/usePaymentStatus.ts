// src/hooks/usePaymentStatus.ts - OPTIMIZED FOR YOUR TABLE STRUCTURE

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
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

      console.log(`🔍 === PAYMENT STATUS DETECTION START ===`);
      console.log(`👤 User ID: ${user.id}`);
      console.log(`📧 User Email: ${user.email}`);
      console.log(`📧 User Email Type: ${typeof user.email}`);
      console.log(`📧 User Email Length: ${user.email?.length}`);

      // ✅ STRATEGY 1: Check by user_id first (properly linked payments)
      console.log('🔍 Step 1: Checking payments by user_id...');
      let { data: paymentsByUserId, error: userIdError } = await supabase
        .from('user_payments')
        .select(`*`)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (userIdError) {
        console.error('❌ Error fetching by user_id:', userIdError);
      } else {
        console.log(`📊 Found ${paymentsByUserId?.length || 0} payments by user_id`);
        
        if (paymentsByUserId && paymentsByUserId.length > 0) {
          // Look for a paid payment
          const paidPayment = paymentsByUserId.find(p => 
            p.is_paid === true && p.payment_status === 'settled'
          );
          
          if (paidPayment) {
            console.log('✅ Found PAID payment by user_id:', {
              id: paidPayment.id,
              is_paid: paidPayment.is_paid,
              payment_status: paidPayment.payment_status,
              amount: paidPayment.amount,
              email: paidPayment.email
            });
            
            return {
              ...paidPayment,
              created_at: safeParseDate(paidPayment.created_at),
              updated_at: safeParseDate(paidPayment.updated_at),
              payment_date: safeParseDate(paidPayment.payment_date),
            };
          } else {
            console.log('⚠️ Found payments by user_id but none are paid/settled:', 
              paymentsByUserId.map(p => ({
                id: p.id,
                is_paid: p.is_paid,
                payment_status: p.payment_status
              }))
            );
          }
        }
      }

      // ✅ STRATEGY 2: Check by email (unlinked payments)
      console.log('🔍 Step 2: Checking payments by email...');
      let { data: paymentsByEmail, error: emailError } = await supabase
        .from('user_payments')
        .select(`*`)
        .eq('email', user.email)
        .order('updated_at', { ascending: false });

      if (emailError) {
        console.error('❌ Error fetching by email:', emailError);
      } else {
        console.log(`📊 Found ${paymentsByEmail?.length || 0} payments by email`);
        
        if (paymentsByEmail && paymentsByEmail.length > 0) {
          // Look for a paid payment
          const paidPayment = paymentsByEmail.find(p => 
            p.is_paid === true && p.payment_status === 'settled'
          );
          
          if (paidPayment) {
            console.log('✅ Found PAID payment by email:', {
              id: paidPayment.id,
              is_paid: paidPayment.is_paid,
              payment_status: paidPayment.payment_status,
              user_id: paidPayment.user_id,
              amount: paidPayment.amount,
              needsLinking: !paidPayment.user_id
            });
            
            // ✅ AUTO-LINK: If payment is not linked to user, link it
            if (!paidPayment.user_id) {
              console.log('🔧 Auto-linking PAID payment to current user...');
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

                if (updateError) {
                  console.error('❌ Failed to auto-link payment:', updateError);
                } else {
                  console.log('✅ Successfully auto-linked PAID payment');
                  // Force refresh after linking
                  setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
                  }, 1000);
                  
                  return {
                    ...updatedPayment,
                    created_at: safeParseDate(updatedPayment.created_at),
                    updated_at: safeParseDate(updatedPayment.updated_at),
                    payment_date: safeParseDate(updatedPayment.payment_date),
                  };
                }
              } catch (linkError) {
                console.error('❌ Error during auto-linking:', linkError);
              }
            }

            return {
              ...paidPayment,
              created_at: safeParseDate(paidPayment.created_at),
              updated_at: safeParseDate(paidPayment.updated_at),
              payment_date: safeParseDate(paidPayment.payment_date),
            };
          } else {
            console.log('⚠️ Found payments by email but none are paid/settled:', 
              paymentsByEmail.map(p => ({
                id: p.id,
                is_paid: p.is_paid,
                payment_status: p.payment_status
              }))
            );
          }
        }
      }

      // ✅ STRATEGY 3: Debug - show exact query being executed
      console.log('🔍 Step 3: Running exact email query for debug...');
      console.log(`Query: SELECT * FROM user_payments WHERE email = '${user.email}'`);
      
      let { data: exactEmailQuery, error: exactError } = await supabase
        .from('user_payments')
        .select(`*`)
        .eq('email', user.email);
        
      console.log('📊 Exact email query result:', exactEmailQuery);
      console.log('📊 Exact email query error:', exactError);

      // ✅ STRATEGY 4: Try case-insensitive search
      console.log('🔍 Step 4: Trying case-insensitive email search...');
      let { data: iLikeQuery, error: iLikeError } = await supabase
        .from('user_payments')
        .select(`*`)
        .ilike('email', user.email);
        
      console.log('📊 Case-insensitive query result:', iLikeQuery);

      // ✅ STRATEGY 5: Complete debug - show all payments for this user/email
      console.log('🔍 Step 3: Complete debug search...');
      let { data: allPayments, error: debugError } = await supabase
        .from('user_payments')
        .select(`*`)
        .or(`email.eq.${user.email},user_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (!debugError && allPayments && allPayments.length > 0) {
        console.log(`🐛 DEBUG: All ${allPayments.length} payments for this user:`);
        allPayments.forEach((payment, index) => {
          console.log(`Payment ${index + 1}:`, {
            id: payment.id,
            user_id: payment.user_id,
            email: payment.email,
            is_paid: payment.is_paid,
            payment_status: payment.payment_status,
            amount: payment.amount,
            isPaidAndSettled: payment.is_paid === true && payment.payment_status === 'settled'
          });
        });
      }

      console.log('❌ No PAID payment found for user');
      console.log(`🔍 === PAYMENT STATUS DETECTION END ===`);
      return null;
    },
    enabled: true,
    staleTime: 5000, // Short stale time for debugging
    refetchOnWindowFocus: true,
    refetchInterval: 15000, // Auto-refetch every 15 seconds
  });

  // ✅ Real-time subscription with proper cleanup
  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Cleanup existing subscription
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (!user) {
        console.log('👤 No user for real-time subscription');
        return;
      }

      console.log(`📡 Setting up real-time payment subscription for: ${user.email}`);

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
            console.log('📡 Real-time payment update (by user_id):', payload);
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
            console.log('📡 Real-time payment update (by email):', payload);
            queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });
    };

    setupSubscription();

    // Listen for auth changes
    authSubscription = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
            console.log('🔄 Auth state changed, refreshing payment subscription');
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

  // ✅ FINAL LOGIC: User is paid if they have a payment with is_paid=true AND payment_status='settled'
  const isPaid = paymentStatus?.is_paid === true && paymentStatus?.payment_status === 'settled';
  const needsPayment = !isPaid;
  const hasUnlinkedPayment = paymentStatus && !paymentStatus.user_id;

  // Enhanced logging for final decision
  console.log('💰 FINAL PAYMENT STATUS:', {
    hasPaymentRecord: !!paymentStatus,
    is_paid: paymentStatus?.is_paid,
    payment_status: paymentStatus?.payment_status,
    isPaidCondition: paymentStatus?.is_paid === true,
    isSettledCondition: paymentStatus?.payment_status === 'settled',
    FINAL_IS_PAID: isPaid,
    needsPayment: needsPayment,
    hasUnlinkedPayment: hasUnlinkedPayment
  });

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid,
    needsPayment,
    hasUnlinkedPayment,
    userName: paymentStatus?.customer_name || null
  };
};