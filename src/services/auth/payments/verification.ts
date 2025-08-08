// src/services/auth/payments/verification.ts - DEBUG VERSION
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

    // ✅ DEBUG: Check if order exists at all
    logger.orderVerification('🔍 Step 1: Checking if order exists in database', { orderId });
    
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId.trim());
    
    logger.orderVerification('📊 All orders with this ID', { 
      orderId,
      allOrders,
      allOrdersError,
      count: allOrders?.length || 0
    });

    // ✅ DEBUG: Check paid orders
    logger.orderVerification('🔍 Step 2: Checking paid orders', { orderId });
    
    const { data: paidOrders, error: paidOrdersError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId.trim())
      .eq('is_paid', true);
    
    logger.orderVerification('📊 Paid orders with this ID', { 
      orderId,
      paidOrders,
      paidOrdersError,
      count: paidOrders?.length || 0
    });

    // ✅ DEBUG: Check settled orders
    logger.orderVerification('🔍 Step 3: Checking settled orders', { orderId });
    
    const { data: settledOrders, error: settledOrdersError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId.trim())
      .eq('is_paid', true)
      .eq('payment_status', 'settled');
    
    logger.orderVerification('📊 Settled orders with this ID', { 
      orderId,
      settledOrders,
      settledOrdersError,
      count: settledOrders?.length || 0
    });

    // Main verification query
    logger.orderVerification('🔍 Step 4: Main verification query', { email, orderId });
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('*')
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
      logger.orderVerification('❌ No valid order found', { 
        orderId,
        hasAllOrders: allOrders?.length > 0,
        hasPaidOrders: paidOrders?.length > 0,
        hasSettledOrders: settledOrders?.length > 0
      });
      
      // Provide more specific error message
      if (allOrders?.length > 0) {
        const order = allOrders[0];
        if (!order.is_paid) {
          return { success: false, message: 'Order ditemukan tapi belum dibayar' };
        }
        if (order.payment_status !== 'settled') {
          return { success: false, message: `Order ditemukan tapi status pembayaran: ${order.payment_status}` };
        }
      }
      
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
      emailMatch: order.email?.toLowerCase() === email.toLowerCase()
    });

    // Check if already linked to current user
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

    // Check email match
    logger.orderVerification('🔍 Checking email match', {
      orderEmail: order.email,
      inputEmail: email,
      orderEmailLower: order.email?.toLowerCase(),
      inputEmailLower: email.toLowerCase(),
      match: order.email?.toLowerCase() === email.toLowerCase()
    });

    if (order.email && order.email.toLowerCase() === email.toLowerCase()) {
      const result = {
        success: true,
        message: 'Order ditemukan dan sesuai dengan email Anda',
        data: order,
        needsAuth: isAuth ? false : true
      };
      logger.orderVerification('✅ Email match successful', result);
      return result;
    }

    // If we reach here, order exists but email doesn't match
    logger.orderVerification('❌ Order found but email mismatch', {
      orderId,
      orderEmail: order.email,
      inputEmail: email,
      orderEmailLower: order.email?.toLowerCase(),
      inputEmailLower: email.toLowerCase()
    });

    return { 
      success: false, 
      message: `Order ditemukan tapi email tidak sesuai. Order email: ${order.email}, Input email: ${email}` 
    };
    
  } catch (error: any) {
    logger.error('❌ Unexpected error in verifyCustomerOrder:', error);
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat memverifikasi order' 
    };
  }
};