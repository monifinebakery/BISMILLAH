// src/services/auth/payments/access.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { UserAccessStatus, PaymentRecord } from '@/services/auth/types';
import { isAuthenticated, getCurrentUser } from '@/services/auth/core/authentication';
import { linkPaymentToUser } from './linking';

export const getUserAccessStatus = async (): Promise<UserAccessStatus> => {
  try {
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

    // Check if user has linked payment
    const { data: linkedPayments, error: linkedError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('updated_at', { ascending: false })
      .limit(1);

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

    // User has linked payment - FULL ACCESS
    if (linkedPayments && linkedPayments.length > 0) {
      logger.success('[AccessCheck] User has valid linked payment');
      return {
        hasAccess: true,
        isAuthenticated: true,
        paymentRecord: linkedPayments[0],
        needsOrderVerification: false,
        needsLinking: false,
        message: 'Akses penuh tersedia'
      };
    }

    // Check if there's unlinked payment with same email
    const { data: unlinkedPayments, error: unlinkedError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('email', user.email)
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!unlinkedError && unlinkedPayments && unlinkedPayments.length > 0) {
      logger.info('[AccessCheck] Found unlinked payment for user email');
      
      // Auto-link the payment
      try {
        const autoLinked = await linkPaymentToUser(unlinkedPayments[0].order_id, user);
        if (autoLinked) {
          logger.success('[AccessCheck] Auto-linked payment successful');
          return {
            hasAccess: true,
            isAuthenticated: true,
            paymentRecord: autoLinked,
            needsOrderVerification: false,
            needsLinking: false,
            message: 'Pembayaran berhasil terhubung otomatis'
          };
        }
      } catch (autoLinkError) {
        logger.warn('[AccessCheck] Auto-link failed:', autoLinkError);
      }

      return {
        hasAccess: false,
        isAuthenticated: true,
        paymentRecord: unlinkedPayments[0] as PaymentRecord,
        needsOrderVerification: false,
        needsLinking: true,
        message: 'Pembayaran ditemukan, perlu menghubungkan dengan akun'
      };
    }

    // No payment found - need order verification
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