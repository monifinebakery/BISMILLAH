// src/services/auth/payments/verification.ts - SIMPLIFIED VERSION (removed auth_email)
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { validateEmail, getErrorMessage } from '@/services/auth/utils';
import { isAuthenticated, getCurrentUser } from '@/services/auth/core/authentication';

export const verifyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    logger.orderVerification('🔍 Starting order existence check', { orderId });
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status')
      .eq('order_id', orderId.trim())
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);
    
    logger.orderVerification('📊 Order existence query result', { 
      orderId, 
      data, 
      error,
      dataLength: data?.length || 0
    });
    
    if (error) {
      logger.error('Order verification error:', error);
      return false;
    }
    
    const exists = data && data.length > 0;
    logger.orderVerification('✅ Order existence check result', { orderId, exists });
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
    logger.orderVerification('🚀 Starting customer order verification', { email, orderId });

    if (!email || !orderId) {
      const result = { 
        success: false, 
        message: 'Email dan Order ID harus diisi' 
      };
      logger.warn('❌ Verification failed - missing params:', result);
      return result;
    }

    if (!validateEmail(email)) {
      const result = { 
        success: false, 
        message: 'Format email tidak valid' 
      };
      logger.warn('❌ Verification failed - invalid email:', result);
      return result;
    }

    // Check current auth status
    const isAuth = await isAuthenticated();
    const currentUser = await getCurrentUser();
    logger.orderVerification('🔐 Auth status check', { 
      isAuth, 
      currentUserEmail: currentUser?.email,
      inputEmail: email
    });

    // ✅ SIMPLIFIED: Main verification query (check order exists and is valid)
    logger.orderVerification('🔍 Main verification query', { email, orderId });
    
    const { data, error } = await supabase
      .from('user_payments')
      .select(`
        id,
        user_id,
        order_id,
        email,
        payment_status,
        is_paid,
        pg_reference_id,
        created_at,
        updated_at
      `)
      .eq('order_id', orderId.trim())
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);

    logger.orderVerification('📊 Main query result', { 
      email,
      orderId,
      data, 
      error,
      dataLength: data?.length || 0
    });

    if (error) {
      logger.error('❌ Order verification error:', error);
      return { success: false, message: 'Gagal memeriksa order di database' };
    }

    if (!data || data.length === 0) {
      logger.orderVerification('❌ No valid order found', { orderId });
      return { success: false, message: 'Order ID tidak ditemukan atau belum dibayar' };
    }

    const order = data[0];
    logger.orderVerification('✅ Found valid order', { 
      orderId: order.order_id, 
      orderEmail: order.email, 
      inputEmail: email,
      isPaid: order.is_paid, 
      status: order.payment_status,
      userId: order.user_id,
      isUnlinked: !order.user_id
    });

    // ✅ SIMPLIFIED: Check if already linked to current user
    if (order.user_id && isAuth && currentUser) {
      if (order.user_id === currentUser.id) {
        const result = {
          success: true,
          message: 'Order sudah terhubung dengan akun Anda',
          data: order,
          needsAuth: false
        };
        logger.orderVerification('✅ Order already linked to current user', result);
        return result;
      } else {
        const result = {
          success: false,
          message: 'Order ini sudah terhubung dengan akun lain'
        };
        logger.orderVerification('❌ Order linked to different user', result);
        return result;
      }
    }

    // ✅ SIMPLIFIED: Email validation (only check main email field)
    logger.orderVerification('🔍 Checking email match and unlinked status', {
      orderEmail: order.email,
      inputEmail: email,
      isUnlinked: !order.user_id,
      isWebhookEmail: order.email?.includes('@payment.com') || order.email?.includes('@webhook.com')
    });

    // ✅ CASE 1: Order is unlinked (user_id = null) 
    if (!order.user_id) {
      // Check if it's a webhook/system generated email
      const isSystemEmail = order.email && (
        order.email.includes('@payment.com') ||
        order.email.includes('@webhook.com') ||
        order.email === 'unlinked@payment.com' ||
        order.email === 'pending@webhook.com'
      );

      // ✅ SIMPLIFIED: Check main email field only
      if (order.email && order.email.toLowerCase() === email.toLowerCase()) {
        const result = {
          success: true,
          message: 'Order ditemukan dan sesuai dengan email Anda',
          data: order,
          needsAuth: isAuth ? false : true
        };
        logger.orderVerification('✅ Email match for unlinked order', result);
        return result;
      }

      // ✅ For system emails, allow linking if user is authenticated
      if (isSystemEmail && isAuth && currentUser) {
        const result = {
          success: true,
          message: 'Order ditemukan dan dapat dihubungkan ke akun Anda',
          data: order,
          needsAuth: false
        };
        logger.orderVerification('✅ System email - allow authenticated user linking', result);
        return result;
      }

      // ✅ For system emails without auth, require login
      if (isSystemEmail && !isAuth) {
        const result = {
          success: true,
          message: 'Order ditemukan. Silakan login untuk menghubungkan.',
          data: order,
          needsAuth: true
        };
        logger.orderVerification('⚠️ System email - require login', result);
        return result;
      }

      // ✅ For unlinked orders with different emails, allow with warning if authenticated
      if (isAuth && currentUser) {
        const result = {
          success: true,
          message: 'Order ditemukan. Pastikan ini adalah order Anda sebelum menghubungkan.',
          data: order,
          needsAuth: false
        };
        logger.orderVerification('⚠️ Email mismatch but allowing authenticated user', result);
        return result;
      }

      // ✅ Not authenticated, different email
      const result = {
        success: false,
        message: 'Email tidak sesuai dengan order ini. Silakan gunakan email yang benar atau login dengan akun yang sesuai.'
      };
      logger.orderVerification('❌ Email mismatch, not authenticated', result);
      return result;
    }

    // ✅ CASE 2: Order is already linked but not to current user
    logger.orderVerification('❌ Order is linked to different user', {
      orderId,
      orderEmail: order.email,
      inputEmail: email,
      orderUserId: order.user_id,
      currentUserId: currentUser?.id
    });

    return { 
      success: false, 
      message: 'Order ini sudah terhubung dengan akun lain. Silakan hubungi admin jika ini adalah order Anda.' 
    };
    
  } catch (error: any) {
    logger.error('❌ Unexpected error in verifyCustomerOrder:', error);
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat memverifikasi order' 
    };
  }
};