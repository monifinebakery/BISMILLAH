// src/services/authService.ts - ENHANCED WITH PROPER ORDER VERIFICATION LOGIC

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// ✅ TYPES
export interface PaymentRecord {
  id: string;
  order_id: string;
  email: string;
  user_id?: string;
  is_paid: boolean;
  payment_status: string;
  amount?: number;
  created_at: string;
  updated_at: string;
}

export interface UserAccessStatus {
  hasAccess: boolean;
  isAuthenticated: boolean;
  paymentRecord: PaymentRecord | null;
  needsOrderVerification: boolean;
  needsLinking: boolean;
  message: string;
}

// Session cache
let sessionCache: Session | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000;

// Utils
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getErrorMessage = (error: any): string => {
  const errorMessages: Record<string, string> = {
    'Database error saving new user': 'Terjadi masalah database. Silakan hubungi administrator.',
    'Signups not allowed': 'Pendaftaran akun baru sedang dinonaktifkan.',
    'captcha verification process failed': 'Verifikasi CAPTCHA gagal. Silakan coba lagi.',
    'email rate limit exceeded': 'Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.',
    'over_email_send_rate_limit': 'Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.',
    'Invalid email': 'Format email tidak valid',
    'User not found': 'Email tidak terdaftar dalam sistem.',
    'expired': 'Kode sudah kadaluarsa.',
    'invalid': 'Kode tidak valid.',
    'too many attempts': 'Terlalu banyak percobaan.',
    'token has expired or is invalid': 'Kode OTP sudah kadaluarsa.'
  };
  
  const message = Object.entries(errorMessages).find(([key]) => 
    error.message?.includes(key)
  )?.[1] || error.message || 'Terjadi kesalahan yang tidak diketahui';
  
  return message;
};

const clearSessionCache = () => {
  sessionCache = null;
  cacheTimestamp = 0;
};

// ✅ CORE AUTH FUNCTIONS
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const now = Date.now();
    if (sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return sessionCache;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('[AuthService] Error getting session:', error);
      clearSessionCache();
      return null;
    }
    
    sessionCache = session;
    cacheTimestamp = now;
    
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.info('[AuthService] Session expired');
      clearSessionCache();
      return null;
    }
    
    return session;
  } catch (error) {
    logger.error('[AuthService] Error getting current session:', error);
    clearSessionCache();
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    return !!session?.user;
  } catch (error) {
    logger.error('[AuthService] Error checking authentication:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const session = await getCurrentSession();
    return session?.user || null;
  } catch (error) {
    logger.error('[AuthService] Error getting current user:', error);
    return null;
  }
};

// ✅ ENHANCED: Complete user access validation
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
        paymentRecord: unlinkedPayments[0],
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

// ✅ SIMPLIFIED ACCESS CHECK for components
export const hasAppAccess = async (): Promise<boolean> => {
  const status = await getUserAccessStatus();
  return status.hasAccess;
};

// ✅ OTP FUNCTIONS (unchanged but kept for completeness)
export const sendEmailOtp = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true,
  skipCaptcha: boolean = false
): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    try { 
      cleanupAuthState(); 
    } catch (e) {
      // Ignore cleanup errors
    }
    clearSessionCache();

    logger.api('/auth/otp', 'Sending OTP to:', { email, allowSignup, skipCaptcha });
    
    const otpOptions: any = {
      shouldCreateUser: allowSignup,
    };

    if (!skipCaptcha && captchaToken?.trim()) {
      otpOptions.captchaToken = captchaToken;
      logger.debug('Using captcha token for OTP');
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: otpOptions,
    });

    if (error) {
      logger.error('OTP send error:', error);
      
      if (error.message?.includes('Signups not allowed') && allowSignup) {
        logger.info('Signup disabled, trying existing users only...');
        toast.info('Mencoba untuk pengguna terdaftar...');
        return await sendEmailOtp(email, captchaToken, false, skipCaptcha);
      }

      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
      return false;
    }

    logger.success('OTP sent successfully:', { hasData: !!data });
    return true;
    
  } catch (error) {
    logger.error('Unexpected error in sendEmailOtp:', error);
    toast.error('Terjadi kesalahan jaringan');
    return false;
  }
};

export const verifyEmailOtp = async (
  email: string, 
  token: string
): Promise<boolean | 'expired' | 'rate_limited'> => {
  try {
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    const cleanToken = token
      .replace(/\s/g, '')
      .replace(/[^0-9A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 6);

    if (cleanToken.length !== 6) {
      toast.error('Kode OTP harus 6 karakter');
      return false;
    }

    logger.debug('Verifying OTP:', { email, tokenLength: cleanToken.length });

    const startTime = Date.now();
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: cleanToken,
      type: 'email',
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      logger.error('OTP verification error:', error);
      
      const errorMsg = error.message?.toLowerCase() || '';
      
      if (errorMsg.includes('expired') || errorMsg.includes('token has expired')) {
        return 'expired';
      }
      
      if (errorMsg.includes('too many attempts')) {
        toast.error('Terlalu banyak percobaan. Silakan minta kode baru.');
        return 'rate_limited';
      }
      
      if (errorMsg.includes('invalid')) {
        return false;
      }
      
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return false;
    }
    
    if (data.session && data.user) {
      logger.success('OTP verified successfully:', {
        userId: data.user.id,
        email: data.user.email,
        duration: `${duration}ms`
      });
      clearSessionCache();
      return true;
    } else {
      logger.warn('OTP verified but no session created');
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
    
  } catch (error) {
    logger.error('Unexpected error in verifyEmailOtp:', error);
    toast.error('Terjadi kesalahan jaringan saat verifikasi');
    return false;
  }
};

// ✅ ORDER VERIFICATION & LINKING
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

    logger.success('Payment linked successfully:', updatedPayment);
    toast.success('Order berhasil terhubung dengan akun Anda!');
    return updatedPayment;
    
  } catch (error: any) {
    logger.error('Error linking payment to user:', error);
    toast.error(error.message);
    throw error;
  }
};

// ✅ OTHER FUNCTIONS
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('[AuthService] Sign out error:', error);
      toast.error('Gagal logout');
      return false;
    }
    
    clearSessionCache();
    try { 
      cleanupAuthState(); 
    } catch (e) {
      // Ignore cleanup errors
    }
    
    toast.success('Logout berhasil');
    return true;
  } catch (error) {
    logger.error('[AuthService] Error in signOut:', error);
    toast.error('Terjadi kesalahan saat logout');
    return false;
  }
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.info('[AuthService] Auth state changed:', { event, email: session?.user?.email });
    clearSessionCache();
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
};

// Export supabase client
export { supabase };

// ✅ BACKWARD COMPATIBILITY EXPORTS
export const getUserPaymentStatus = async () => {
  const status = await getUserAccessStatus();
  return {
    isPaid: status.hasAccess,
    paymentRecord: status.paymentRecord,
    needsLinking: status.needsLinking
  };
};