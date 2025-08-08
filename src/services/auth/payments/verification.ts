// src/services/auth/payments/verification.ts
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { validateEmail, getErrorMessage } from '@/services/auth/utils';
import { isAuthenticated, getCurrentUser } from '@/services/auth/core/authentication';
import { linkPaymentToUser } from './linking';

export const verifyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    logger.api('/verify-order-exists', 'Verifying order exists:', orderId);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status')
      .eq('order_id', orderId.trim())
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);
    
    if (error) {
      logger.error('Order verification error:', error);
      return false;
    }
    
    const exists = data && data.length > 0;
    logger.success('Order exists check completed:', { orderId, exists });
    return exists;
  } catch (error) {
    logger.error('Error verifying order:', error);
    return false;
  }
};

export const verifyCustomerOrder = async (email: string, orderId: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
  needsAuth?: boolean;
}> => {
  try {
    if (!email || !orderId) {
      return { 
        success: false, 
        message: 'Email dan Order ID harus diisi' 
      };
    }

    if (!validateEmail(email)) {
      return { 
        success: false, 
        message: 'Format email tidak valid' 
      };
    }

    logger.api('/verify-order', 'Verifying customer order:', { email, orderId });

    // Check if order exists and is valid
    const orderExists = await verifyOrderExists(orderId);
    if (!orderExists) {
      return {
        success: false,
        message: 'Order ID tidak ditemukan atau belum dibayar'
      };
    }

    // Check if user is currently authenticated
    const isAuth = await isAuthenticated();
    const currentUser = await getCurrentUser();

    // If authenticated and email matches current user
    if (isAuth && currentUser && currentUser.email === email) {
      logger.info('User authenticated with matching email, attempting auto-link');
      try {
        const linkedPayment = await linkPaymentToUser(orderId, currentUser);
        return {
          success: true,
          message: 'Order berhasil terhubung dengan akun Anda',
          data: linkedPayment,
          needsAuth: false
        };
      } catch (linkError: any) {
        logger.warn('Auto-link failed:', linkError.message);
        return {
          success: false,
          message: linkError.message,
          needsAuth: false
        };
      }
    }

    // Check if already linked to this email
    const { data: existingOrder, error: existingError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId.trim())
      .eq('email', email.trim())
      .limit(1);

    if (!existingError && existingOrder?.length) {
      const order = existingOrder[0];
      if (order.is_paid && order.payment_status === 'settled') {
        logger.success('Order already verified for this email');
        return {
          success: true,
          message: 'Order sudah terhubung dengan email Anda. Silakan login untuk mendapatkan akses.',
          data: order,
          needsAuth: true // Need to authenticate to get access
        };
      }
    }

    // Try to link order to email (for future authentication)
    const { data, error } = await supabase.rpc('verify_payment_robust', {
      p_email: email.trim(),
      p_order_id: orderId.trim()
    });
    
    if (error) {
      logger.error('Order verification error:', error);
      return { 
        success: false, 
        message: getErrorMessage(error) || 'Gagal memverifikasi order' 
      };
    }

    const result = data || { success: false, message: 'No response from server' };
    
    if (result.success) {
      logger.success('Order verification successful:', result);
      return {
        ...result,
        needsAuth: true // Need to login to get full access
      };
    } else {
      logger.warn('Order verification failed:', result.message);
      return result;
    }
    
  } catch (error: any) {
    logger.error('Unexpected error in verifyCustomerOrder:', error);
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat memverifikasi order' 
    };
  }
};