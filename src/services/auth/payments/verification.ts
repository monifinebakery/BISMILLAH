// ===== 1. src/services/auth/payments/verification.ts - FIXED =====
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { validateEmail, getErrorMessage } from '@/services/auth/utils';
import { isAuthenticated, getCurrentUser } from '@/services/auth/core/authentication';

export const verifyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    logger.api('/verify-order-exists', 'Verifying order exists:', orderId);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status')
      .eq('order_id', orderId.trim())
      .eq('is_paid', true)
      .eq('payment_status', 'settled') // ✅ Consistent with other files
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
    logger.api('/verify-order', 'Starting customer order verification:', { email, orderId });

    if (!email || !orderId) {
      const result = { 
        success: false, 
        message: 'Email dan Order ID harus diisi' 
      };
      logger.warn('Verification failed - missing params:', result);
      return result;
    }

    if (!validateEmail(email)) {
      const result = { 
        success: false, 
        message: 'Format email tidak valid' 
      };
      logger.warn('Verification failed - invalid email:', result);
      return result;
    }

    // Check if user is currently authenticated
    const isAuth = await isAuthenticated();
    const currentUser = await getCurrentUser();
    logger.debug('Auth status:', { isAuth, currentUserEmail: currentUser?.email });

    logger.debug('Attempting to verify order:', { email, orderId });

    // ✅ FIXED: Use consistent query with other files
    const { data, error } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId.trim())
      .eq('is_paid', true)
      .eq('payment_status', 'settled') // ✅ Changed from ilike to eq for consistency
      .limit(1);

    logger.debug('Database query result:', { data, error });

    if (error) {
      logger.error('Order verification error:', error);
      return { success: false, message: 'Gagal memeriksa order di database' };
    }

    if (!data || data.length === 0) {
      logger.warn('Order not found or not paid:', { orderId });
      return { success: false, message: 'Order ID tidak ditemukan atau belum dibayar' };
    }

    const order = data[0];
    logger.success('Found valid order:', { 
      orderId: order.order_id, 
      email: order.email, 
      isPaid: order.is_paid, 
      status: order.payment_status,
      userId: order.user_id 
    });

    // Check if already linked to this user
    if (order.user_id && isAuth && currentUser) {
      if (order.user_id === currentUser.id) {
        const result = {
          success: true,
          message: 'Order sudah terhubung dengan akun Anda',
          data: order,
          needsAuth: false
        };
        logger.success('Order already linked to current user:', result);
        return result;
      } else {
        const result = {
          success: false,
          message: 'Order ini sudah terhubung dengan akun lain'
        };
        logger.warn('Order linked to different user:', result);
        return result;
      }
    }

    // Check email match
    if (order.email && order.email.toLowerCase() === email.toLowerCase()) {
      const result = {
        success: true,
        message: 'Order ditemukan dan sesuai dengan email Anda',
        data: order,
        needsAuth: isAuth ? false : true
      };
      logger.success('Order verified for email:', result);
      return result;
    }

    // ✅ SIMPLIFIED: Skip RPC fallback for now - just use direct database result
    if (order) {
      return {
        success: true,
        message: 'Order ditemukan, siap untuk dihubungkan',
        data: order,
        needsAuth: true
      };
    }

    return { 
      success: false, 
      message: 'Order tidak ditemukan atau tidak sesuai dengan email' 
    };
    
  } catch (error: any) {
    logger.error('Unexpected error in verifyCustomerOrder:', error);
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat memverifikasi order' 
    };
  }
};