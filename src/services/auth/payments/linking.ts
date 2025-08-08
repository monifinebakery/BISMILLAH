// src/services/auth/payments/linking.ts
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { PaymentRecord } from '@/services/auth/types';
import { clearSessionCache } from '@/services/auth/core/session';

export const linkPaymentToUser = async (orderId: string, user: any): Promise<PaymentRecord> => {
  try {
    logger.api('/link-payment', 'Linking order to user:', { orderId, email: user.email });
    
    // Check if already linked to this user
    const { data: existingLink, error: existingError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .limit(1);

    if (!existingError && existingLink?.length) {
      logger.success('Payment already linked to this user');
      toast.success('Order sudah terhubung dengan akun Anda!');
      return existingLink[0];
    }

    // Find unlinked payment
    const { data: payments, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
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

    // Check for constraint conflict
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
        return payment;
      }
      throw new Error(`Akun Anda sudah memiliki pembayaran dengan Order ID: ${existing.order_id}. Satu akun hanya bisa memiliki satu pembayaran aktif.`);
    }

    // Update payment with user ID
    const updateData: any = { 
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    if (!payment.email || payment.email.trim() === '' || payment.email !== user.email) {
      updateData.email = user.email;
    }

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

    logger.success('Payment linked successfully:', {
      orderId: updatedPayment.order_id,
      userId: updatedPayment.user_id,
      email: updatedPayment.email
    });
    toast.success('Order berhasil terhubung dengan akun Anda!');
    clearSessionCache();
    return updatedPayment;
    
  } catch (error: any) {
    logger.error('Error linking payment to user:', error);
    toast.error(error.message);
    throw error;
  }
};

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