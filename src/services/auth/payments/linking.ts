// src/services/auth/payments/linking.ts - ENHANCED with linked_at
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { PaymentRecord } from '@/services/auth/types';
import { clearSessionCache } from '../core/session';

// ✅ Enhanced cache clearing function
const forceRefreshCache = async () => {
  try {
    clearSessionCache();
    
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      await queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      await queryClient.refetchQueries({ queryKey: ['paymentStatus'] });
      logger.debug('React Query cache refreshed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.success('Cache refresh completed');
  } catch (error) {
    logger.warn('Cache refresh failed:', error);
  }
};

export const linkPaymentToUser = async (orderId: string, user: any): Promise<PaymentRecord> => {
  try {
    // ✅ ENHANCED: Validate user object with better error messages
    if (!user) {
      throw new Error('User not authenticated. Please login first.');
    }
    
    if (!user.id || user.id === 'null' || user.id === null || user.id === undefined) {
      // Try to get fresh user
      const { getCurrentUserValidated } = await import('@/services/auth/core/authentication');
      try {
        const freshUser = await getCurrentUserValidated();
        user = freshUser; // Use fresh user
        logger.info('Got fresh user for linking:', { id: freshUser.id, email: freshUser.email });
      } catch (freshError) {
        throw new Error('Invalid user session. Please logout and login again.');
      }
    }
    
    if (!user.email) {
      throw new Error('User email is missing. Please logout and login again.');
    }
    
    logger.api('/link-payment', 'Linking order to user:', { 
      orderId, 
      email: user.email, 
      userId: user.id,
      userType: typeof user.id
    });
    
    // ✅ STEP 1: Check if already linked to this user
    const { data: existingLink, error: existingError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId.trim())
      .eq('user_id', user.id)
      .limit(1);

    if (!existingError && existingLink?.length) {
      logger.success('Payment already linked to this user');
      toast.success('Order sudah terhubung dengan akun Anda!');
      await forceRefreshCache();
      return existingLink[0];
    }

    // ✅ STEP 2: Find unlinked payment
    const { data: payments, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId.trim())
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);

    if (findError) {
      logger.error('Search error:', findError);
      throw new Error('Gagal mencari order. Silakan coba lagi.');
    }

    if (!payments || payments.length === 0) {
      throw new Error('Order ID tidak ditemukan, belum dibayar, atau sudah terhubung dengan akun lain.');
    }

    const payment = payments[0];
    logger.info('Found payment to link:', { orderId: payment.order_id, email: payment.email });

    // ✅ STEP 3: Check for constraint conflicts
    const { data: conflictCheck, error: conflictError } = await supabase
      .from('user_payments')
      .select('id, order_id')
      .eq('email', user.email)
      .eq('user_id', user.id)
      .limit(1);

    if (!conflictError && conflictCheck?.length) {
      const existing = conflictCheck[0];
      if (existing.order_id === orderId) {
        logger.success('Same order already linked');
        toast.success('Order sudah terhubung dengan akun Anda!');
        await forceRefreshCache();
        return payment;
      }
      throw new Error(`Akun Anda sudah memiliki pembayaran dengan Order ID: ${existing.order_id}. Satu akun hanya bisa memiliki satu pembayaran aktif.`);
    }

    // ✅ STEP 4: Update payment with user ID + linked_at
    const now = new Date().toISOString();
    const updateData: any = { 
      user_id: user.id,
      updated_at: now,
      linked_at: now // ✅ NEW: Track when payment was linked
    };

    // ✅ Enhanced email handling
    if (!payment.email || 
        payment.email.trim() === '' || 
        payment.email.includes('@payment.com') ||
        payment.email.includes('@webhook.com')) {
      updateData.email = user.email;
      logger.info('Updating email to user email');
    }

    // ✅ Set auth_email if not already set
    if (!payment.auth_email) {
      updateData.auth_email = user.email;
      logger.info('Setting auth_email to user email');
    }

    logger.info('Updating payment with user ID and linked_at:', updateData);

    const { data: updatedPayment, error: updateError } = await supabase
      .from('user_payments')
      .update(updateData)
      .eq('id', payment.id)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Update error:', updateError);
      
      if (updateError.code === '23505') {
        if (updateError.message.includes('user_payments_email_user_unique')) {
          throw new Error('Akun Anda sudah memiliki pembayaran aktif. Satu akun hanya bisa memiliki satu pembayaran.');
        }
        throw new Error('Data pembayaran sudah ada. Silakan hubungi admin jika ini adalah kesalahan.');
      }
      
      throw new Error('Gagal menghubungkan order. Silakan coba lagi.');
    }

    if (!updatedPayment) {
      throw new Error('Gagal mendapatkan data pembayaran yang diperbarui');
    }

    logger.success('✅ Payment linked successfully:', {
      orderId: updatedPayment.order_id,
      userId: updatedPayment.user_id,
      email: updatedPayment.email,
      authEmail: updatedPayment.auth_email,
      linkedAt: updatedPayment.linked_at
    });

    toast.success('Order berhasil terhubung dengan akun Anda!');
    
    await forceRefreshCache();
    
    return updatedPayment;
    
  } catch (error: any) {
    logger.error('Error linking payment to user:', error);
    toast.error(error.message);
    throw error;
  }
};

// ✅ Enhanced function to get linking history
export const getPaymentLinkingHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_payments')
      .select('order_id, email, linked_at, created_at')
      .eq('user_id', userId)
      .not('linked_at', 'is', null)
      .order('linked_at', { ascending: false });

    if (error) {
      logger.error('Error getting linking history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in getPaymentLinkingHistory:', error);
    return [];
  }
};

// Rest of the functions...
export const checkUserHasPayment = async (email: string, userId: string): Promise<{
  hasPayment: boolean;
  payment?: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_payments')
      .select('*')
      .eq('email', email)
      .eq('user_id', userId)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);

    if (error) {
      logger.error('Error checking user payment:', error);
      return { hasPayment: false };
    }

    return {
      hasPayment: data && data.length > 0,
      payment: data?.[0] || null
    };
  } catch (error) {
    logger.error('Error in checkUserHasPayment:', error);
    return { hasPayment: false };
  }
};

export const debugConstraintIssue = async (email: string, userId: string) => {
  try {
    logger.debug('DEBUG: Checking constraint for:', { email, userId });
    
    const { data: emailPayments } = await supabase
      .from('user_payments')
      .select('*')
      .eq('email', email);
    
    const { data: userPayments } = await supabase
      .from('user_payments')
      .select('*')
      .eq('user_id', userId);
    
    logger.debug('DEBUG Results:', {
      emailPayments: emailPayments?.length || 0,
      userPayments: userPayments?.length || 0,
      emailPaymentDetails: emailPayments,
      userPaymentDetails: userPayments
    });
    
    return { emailPayments, userPayments };
  } catch (error) {
    logger.error('Debug error:', error);
    return null;
  }
};