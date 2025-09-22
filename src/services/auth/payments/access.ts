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
           name: 'Development User', // ✅ Use 'name' instead of customer_name
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
           pg_reference_id: null
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

    // ✅ OPTIMIZED: Single combined query for both linked and unlinked payments
    const { data: payments, error: paymentsError } = await supabase
      .from('user_payments')
      .select('id,user_id,name,order_id,is_paid,payment_status,email,created_at,updated_at')
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .or(`user_id.eq.${user.id},and(user_id.is.null,email.eq.${user.email})`)
      .order('updated_at', { ascending: false })
      .limit(2); // Get max 2 results for efficiency

    if (paymentsError) {
      logger.error('[AccessCheck] Error checking payments:', paymentsError);
      return {
        hasAccess: false,
        isAuthenticated: true,
        paymentRecord: null,
        needsOrderVerification: true,
        needsLinking: false,
        message: 'Terjadi kesalahan saat memeriksa status pembayaran'
      };
    }

    // ✅ Check for linked payment first (highest priority)
    const linkedPayment = payments?.find(p => p.user_id === user.id);
    if (linkedPayment) {
      logger.success('[AccessCheck] User has valid linked payment:', {
        orderId: linkedPayment.order_id,
        userId: linkedPayment.user_id
      });
      return {
        hasAccess: true,
        isAuthenticated: true,
        paymentRecord: linkedPayment as PaymentRecord,
        needsOrderVerification: false,
        needsLinking: false,
        message: 'Akses penuh tersedia'
      };
    }

    // ✅ Check for unlinked payment
    const unlinkedPayment = payments?.find(p => !p.user_id && p.email === user.email);
    if (unlinkedPayment) {
      logger.info('[AccessCheck] Found unlinked payment for user email - NO AUTO-LINK');
      
      return {
        hasAccess: false,
        isAuthenticated: true,
        paymentRecord: unlinkedPayment as PaymentRecord,
        needsOrderVerification: false,
        needsLinking: true,
        message: 'Pembayaran ditemukan, silakan hubungkan dengan Order ID'
      };
    }

    // ✅ No payment found - need order verification
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