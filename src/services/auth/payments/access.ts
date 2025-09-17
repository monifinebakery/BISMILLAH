// src/services/auth/payments/access.ts - FIXED VERSION
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { UserAccessStatus, PaymentRecord } from '@/services/auth/types';
import { isAuthenticated, getCurrentUser } from '@/services/auth/core/authentication';

export const getUserAccessStatus = async (): Promise<UserAccessStatus> => {
  try {
    // ✅ Development bypass logic
    const isDev = import.meta.env.MODE === 'development';
    const bypassAuth = isDev && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
    
    if (bypassAuth) {
      logger.debug('[AccessCheck] Development bypass active - granting full access');
      return {
         hasAccess: true,
         isAuthenticated: true,
         paymentRecord: {
           id: 'dev-bypass',
           user_id: 'dev-user',
           order_id: 'DEV-BYPASS',
           is_paid: true,
           payment_status: 'settled',
           email: 'dev@example.com',
           customer_name: 'Development User',
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
           pg_reference_id: null,
           name: 'Development User'
         } as any,
         needsOrderVerification: false,
         needsLinking: false,
         message: 'Development bypass - akses penuh tersedia'
       };
    }
    
    const isAuth = await isAuthenticated();
    const user = await getCurrentUser();

    // Not authenticated - need login
    if (!isAuth || !user) {
      return {
        hasAccess: false,
        isAuthenticated: false,
        paymentRecord: null,
        needsOrderVerification: true,
        needsLinking: false,
        message: 'Silakan login terlebih dahulu'
      };
    }

    logger.info('[AccessCheck] User authenticated, checking payment status:', user.email);

    // ✅ STEP 1: Check if user has linked payment (OPTIMIZED query)
    const { data: linkedPayments, error: linkedError } = await supabase
      .from('user_payments')
      .select('id,user_id,order_id,is_paid,payment_status,email,customer_name,created_at,updated_at') // ✅ FIXED: Select only needed fields
      .eq('user_id', user.id)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(); // ✅ FIXED: Use single() for better performance

    if (linkedError) {
      logger.error('[AccessCheck] Error checking linked payments:', linkedError);
      return {
        hasAccess: false,
        isAuthenticated: true,
        paymentRecord: null,
        needsOrderVerification: true,
        needsLinking: false,
        message: 'Terjadi kesalahan saat memeriksa status pembayaran'
      };
    }

    // ✅ User has linked payment - FULL ACCESS
    if (linkedPayments && !linkedError) {
      logger.success('[AccessCheck] User has valid linked payment:', {
        orderId: linkedPayments.order_id,
        userId: linkedPayments.user_id
      });
      return {
        hasAccess: true,
        isAuthenticated: true,
        paymentRecord: linkedPayments,
        needsOrderVerification: false,
        needsLinking: false,
        message: 'Akses penuh tersedia'
      };
    }

    // ✅ STEP 2: Check for unlinked payments - OPTIMIZED query
    const { data: unlinkedPayments, error: unlinkedError } = await supabase
      .from('user_payments')
      .select('id,order_id,email,customer_name,is_paid,payment_status,created_at') // ✅ FIXED: Select only needed fields
      .eq('email', user.email)
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(); // ✅ FIXED: Use single() for better performance

    if (!unlinkedError && unlinkedPayments) {
      logger.info('[AccessCheck] Found unlinked payment for user email - NO AUTO-LINK');
      
      // ✅ REMOVED AUTO-LINK - Let user manually link via popup
      return {
        hasAccess: false,
        isAuthenticated: true,
        paymentRecord: unlinkedPayments as PaymentRecord,
        needsOrderVerification: false,
        needsLinking: true,
        message: 'Pembayaran ditemukan, silakan hubungkan dengan Order ID'
      };
    }

    // ✅ STEP 3: No payment found - need order verification
    logger.info('[AccessCheck] No payment found for user');
    return {
      hasAccess: false,
      isAuthenticated: true,
      paymentRecord: null,
      needsOrderVerification: true,
      needsLinking: false,
      message: 'Silakan verifikasi Order ID untuk mendapatkan akses'
    };

  } catch (error) {
    logger.error('[AccessCheck] Unexpected error:', error);
    return {
      hasAccess: false,
      isAuthenticated: false,
      paymentRecord: null,
      needsOrderVerification: true,
      needsLinking: false,
      message: 'Terjadi kesalahan sistem'
    };
  }
};

export const hasAppAccess = async (): Promise<boolean> => {
  const status = await getUserAccessStatus();
  return status.hasAccess;
};

// Backward compatibility export
export const getUserPaymentStatus = async () => {
  const status = await getUserAccessStatus();
  return {
    isPaid: status.hasAccess,
    paymentRecord: status.paymentRecord,
    needsLinking: status.needsLinking
  };
};