// src/services/authService.ts - SIMPLIFIED EMAIL AUTHENTICATION ONLY

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// ✅ SIMPLIFIED: Basic session cache (optional)
let sessionCache: Session | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

// ✅ UTILS: Email validation
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ✅ SIMPLIFIED: Error handling without excessive toast
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

// ✅ Clear cache helper
const clearSessionCache = () => {
  sessionCache = null;
  cacheTimestamp = 0;
};

// ✅ OPTIMIZED: Get current session with simple cache
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    // Check cache first
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
    
    // Update cache
    sessionCache = session;
    cacheTimestamp = now;
    
    // Quick expiry check
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

// ✅ SIMPLIFIED: Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    return !!session?.user;
  } catch (error) {
    logger.error('[AuthService] Error checking authentication:', error);
    return false;
  }
};

// ✅ SIMPLIFIED: Get current user
export const getCurrentUser = async () => {
  try {
    const session = await getCurrentSession();
    return session?.user || null;
  } catch (error) {
    logger.error('[AuthService] Error getting current user:', error);
    return null;
  }
};

// ✅ FIXED: Send Email OTP with correct parameter order
export const sendEmailOtp = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true,
  skipCaptcha: boolean = false
): Promise<boolean> => {
  try {
    // Validate email
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    // Cleanup and clear cache
    try { 
      cleanupAuthState(); 
    } catch (e) {
      // Ignore cleanup errors
    }
    clearSessionCache();

    logger.api('/auth/otp', 'Sending OTP to:', { email, allowSignup, skipCaptcha });
    
    // Prepare OTP options
    const otpOptions: any = {
      shouldCreateUser: allowSignup,
    };

    // Add captcha token if provided and not skipped
    if (!skipCaptcha && captchaToken?.trim()) {
      otpOptions.captchaToken = captchaToken;
      logger.debug('Using captcha token for OTP');
    }

    // Send OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: otpOptions,
    });

    if (error) {
      logger.error('OTP send error:', error);
      
      // Handle signup not allowed error
      if (error.message?.includes('Signups not allowed') && allowSignup) {
        logger.info('Signup disabled, trying existing users only...');
        toast.info('Mencoba untuk pengguna terdaftar...');
        return await sendEmailOtp(email, captchaToken, false, skipCaptcha);
      }

      // Show error message
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

// ✅ FIXED: Verify Email OTP with enhanced mobile debugging
export const verifyEmailOtp = async (
  email: string, 
  token: string
): Promise<boolean | 'expired' | 'rate_limited'> => {
  try {
    // Validate inputs
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    // Clean and validate token
    const cleanToken = token
      .replace(/\s/g, '')           // Remove all spaces
      .replace(/[^0-9A-Za-z]/g, '') // Remove non-alphanumeric
      .toUpperCase()                // Uppercase for consistency
      .slice(0, 6);                 // Take only first 6 chars

    if (cleanToken.length !== 6) {
      toast.error('Kode OTP harus 6 karakter');
      return false;
    }

    // ✅ ENHANCED: Add mobile debugging
    const now = new Date();
    const timestamp = now.toISOString();
    const localTime = now.toLocaleString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    logger.debug('Mobile Debug - Verifying OTP:', {
      email,
      tokenLength: cleanToken.length,
      timestamp,
      localTime,
      timezone,
      userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
    });

    // ✅ ENHANCED: Add timing measurement for mobile
    const startTime = Date.now();
    
    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: cleanToken,
      type: 'email',
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.debug('Mobile Debug - Verification result:', {
      duration: `${duration}ms`,
      hasError: !!error,
      hasSession: !!data?.session,
      hasUser: !!data?.user
    });
    
    if (error) {
      logger.error('OTP verification error:', error);
      
      // ✅ ENHANCED: Better mobile error detection
      const errorMsg = error.message?.toLowerCase() || '';
      
      if (errorMsg.includes('expired') || errorMsg.includes('token has expired')) {
        logger.warn('Token expired - Mobile Debug:', {
          errorMessage: error.message,
          timeSinceStart: duration,
          possibleCause: duration > 10000 ? 'Network slow' : 'Token actually expired'
        });
        return 'expired';
      }
      
      if (errorMsg.includes('too many attempts')) {
        logger.warn('Too many attempts - Mobile Debug');
        toast.error('Terlalu banyak percobaan. Silakan minta kode baru.');
        return 'rate_limited';
      }
      
      if (errorMsg.includes('invalid')) {
        logger.warn('Token invalid - Mobile Debug:', {
          tokenReceived: cleanToken,
          errorMessage: error.message
        });
        return false;
      }
      
      // Other errors
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return false;
    }
    
    // Check if session was created
    if (data.session && data.user) {
      logger.success('OTP verified successfully - Mobile Debug:', {
        userId: data.user.id,
        email: data.user.email,
        sessionExpiry: data.session.expires_at,
        duration: `${duration}ms`
      });
      clearSessionCache();
      return true;
    } else {
      logger.warn('OTP verified but no session created - Mobile Debug:', data);
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
    
  } catch (error) {
    logger.error('Unexpected error in verifyEmailOtp - Mobile Debug:', {
      error,
      stack: error.stack,
      isMobile: navigator.userAgent.includes('Mobile'),
      connection: navigator.onLine ? 'Online' : 'Offline'
    });
    toast.error('Terjadi kesalahan jaringan saat verifikasi');
    return false;
  }
};

// ✅ SIMPLIFIED: Sign out
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

// ✅ SIMPLIFIED: Auth state change listener
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.info('[AuthService] Auth state changed:', { event, email: session?.user?.email });
    clearSessionCache();
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
};

// ✅ OPTIONAL: Password reset (if needed)
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
      return false;
    }

    toast.success('Link reset password telah dikirim ke email Anda');
    return true;
  } catch (error) {
    logger.error('Error sending password reset:', error);
    toast.error('Terjadi kesalahan saat mengirim link reset password');
    return false;
  }
};

// ✅ OPTIONAL: Refresh session if needed
export const refreshSession = async (): Promise<Session | null> => {
  try {
    logger.info('[AuthService] Refreshing session...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('[AuthService] Session refresh error:', error);
      clearSessionCache();
      return null;
    }
    
    if (data.session) {
      logger.success('[AuthService] Session refreshed successfully');
      clearSessionCache(); // Clear cache to force fresh fetch
      return data.session;
    }
    
    return null;
  } catch (error) {
    logger.error('[AuthService] Error refreshing session:', error);
    clearSessionCache();
    return null;
  }
};

// ✅ NEW: Verify customer order using robust verification
export const verifyCustomerOrder = async (email: string, orderId: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  try {
    // Validate inputs
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

    // ✅ ENHANCED: Check if user already has this order
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
          message: 'Order sudah terhubung dengan email Anda',
          data: order
        };
      }
    }

    // Call the database function for robust verification
    const { data, error } = await supabase.rpc('verify_payment_robust', {
      p_email: email.trim(),
      p_order_id: orderId.trim()
    });
    
    logger.debug('RPC Verification result:', { data, error });

    if (error) {
      logger.error('Order verification error:', error);
      
      // ✅ HANDLE constraint errors specifically
      if (error.code === '23505') {
        return {
          success: true,
          message: 'Pembayaran sudah terhubung dengan akun Anda',
          data: null
        };
      }
      
      const errorMsg = getErrorMessage(error);
      return { 
        success: false, 
        message: errorMsg || 'Gagal memverifikasi order' 
      };
    }

    // Return the result from the database function
    const result = data || { success: false, message: 'No response from server' };
    
    if (result.success) {
      logger.success('Order verification successful:', result);
    } else {
      logger.warn('Order verification failed:', result.message);
    }

    return result;
    
  } catch (error: any) {
    logger.error('Unexpected error in verifyCustomerOrder:', error);
    
    // ✅ HANDLE constraint errors in catch block too
    if (error.code === '23505' || error.message?.includes('already exists')) {
      return {
        success: true,
        message: 'Pembayaran sudah terhubung dengan akun Anda',
        data: null
      };
    }
    
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat memverifikasi order' 
    };
  }
};

// ✅ DEBUGGING: Function untuk melihat constraint details
export const debugConstraintIssue = async (email: string, userId: string) => {
  try {
    logger.debug('DEBUG: Checking constraint for:', { email, userId });
    
    // Check all payments for this email
    const { data: emailPayments } = await supabase
      .from('user_payments')
      .select('*')
      .eq('email', email);
    
    // Check all payments for this user_id  
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

// ✅ HELPER: Check if user has existing payment
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

// ✅ ALIASES: For backward compatibility (if needed)
export const hasValidSession = isAuthenticated;

// ✅ BACKWARD COMPATIBILITY: Export missing functions to prevent import errors
export const autoLinkUserPayments = async (): Promise<number> => {
  logger.warn('[authService] autoLinkUserPayments is deprecated and removed');
  return 0;
};

export const checkUnlinkedPayments = async (): Promise<{ hasUnlinked: boolean; count: number }> => {
  logger.warn('[authService] checkUnlinkedPayments is deprecated and removed');
  return { hasUnlinked: false, count: 0 };
};

export const getRecentUnlinkedOrders = async (): Promise<string[]> => {
  logger.warn('[authService] getRecentUnlinkedOrders is deprecated and removed');
  return [];
};

// ✅ COMPLETELY REWRITTEN: Robust order verification
export const verifyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    logger.api('/verify-order-exists', 'Verifying order exists:', orderId);
    
    // ✅ STEP 1: Check if order exists at all (no filters first)
    const { data: allOrders, error: searchError } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status, user_id, email, created_at')
      .eq('order_id', orderId)
      .limit(5);
    
    logger.debug('Raw order search result:', { 
      orderId,
      found: allOrders?.length || 0, 
      orders: allOrders,
      searchError 
    });
    
    if (searchError) {
      logger.error('Order search error:', searchError);
      return false;
    }
    
    if (!allOrders?.length) {
      logger.warn('No orders found with this ID');
      return false;
    }
    
    // ✅ STEP 2: Log all found orders for debugging
    allOrders.forEach((order, index) => {
      logger.debug(`Order ${index + 1}:`, {
        order_id: order.order_id,
        is_paid: order.is_paid,
        is_paid_type: typeof order.is_paid,
        payment_status: order.payment_status,
        user_id: order.user_id ? 'linked' : 'unlinked',
        email: order.email
      });
    });
    
    // ✅ STEP 3: Find valid paid orders with flexible type checking
    const validOrders = allOrders.filter(order => {
      // Handle both boolean and string types for is_paid
      const isPaidBoolean = order.is_paid === true || order.is_paid === 'true' || order.is_paid === '1';
      
      // Handle case variations for payment_status
      const isSettled = order.payment_status?.toLowerCase() === 'settled' || 
                       order.payment_status?.toLowerCase() === 'success' ||
                       order.payment_status === 'SETTLED' ||
                       order.payment_status === 'SUCCESS';
      
      const isValid = isPaidBoolean && isSettled;
      
      logger.debug('Order validation:', {
        order_id: order.order_id,
        isPaidBoolean,
        isSettled,
        isValid,
        raw_is_paid: order.is_paid,
        raw_payment_status: order.payment_status
      });
      
      return isValid;
    });
    
    const hasValidOrder = validOrders.length > 0;
    
    logger.success('Order exists check completed:', { 
      orderId, 
      totalFound: allOrders.length,
      validFound: validOrders.length,
      exists: hasValidOrder,
      validOrders: validOrders.map(o => ({
        id: o.id,
        user_id: o.user_id ? 'linked' : 'unlinked',
        email: o.email
      }))
    });
    
    return hasValidOrder;
    
  } catch (error) {
    logger.error('Exception in verifyOrderExists:', error);
    return false;
  }
};

// ✅ COMPLETELY REWRITTEN: More robust payment linking
export const linkPaymentToUser = async (orderId: string, user: any): Promise<any> => {
  try {
    logger.api('/link-payment', 'Linking order to user:', { orderId, email: user.email });
    
    // ✅ STEP 1: Check if already linked to this user
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

    // ✅ STEP 2: Find all payments with this order_id (no filters yet)
    const { data: allPayments, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .limit(10);

    logger.debug('All payments found for order:', { 
      allPayments: allPayments?.length || 0,
      findError,
      payments: allPayments?.map(p => ({
        id: p.id,
        is_paid: p.is_paid,
        payment_status: p.payment_status,
        user_id: p.user_id ? 'linked' : 'unlinked',
        email: p.email
      }))
    });

    if (findError) {
      logger.error('Search error:', findError);
      throw new Error('Gagal mencari order. Silakan coba lagi.');
    }

    if (!allPayments || allPayments.length === 0) {
      throw new Error('Order ID tidak ditemukan dalam sistem. Pastikan Order ID benar.');
    }

    // ✅ STEP 3: Filter for valid paid orders
    const validPayments = allPayments.filter(payment => {
      const isPaidBoolean = payment.is_paid === true || payment.is_paid === 'true' || payment.is_paid === '1';
      const isSettled = payment.payment_status?.toLowerCase() === 'settled' || 
                       payment.payment_status?.toLowerCase() === 'success' ||
                       payment.payment_status === 'SETTLED' ||
                       payment.payment_status === 'SUCCESS';
      return isPaidBoolean && isSettled;
    });

    if (validPayments.length === 0) {
      throw new Error('Order ini belum dibayar atau pembayaran belum berhasil diproses.');
    }

    // ✅ STEP 4: Check payment ownership and constraints
    const payment = validPayments[0]; // Use first valid payment
    
    logger.debug('Selected payment details:', {
      id: payment.id,
      order_id: payment.order_id,
      hasUserId: !!payment.user_id,
      currentUserId: payment.user_id,
      targetUserId: user.id,
      email: payment.email,
      targetEmail: user.email
    });

    // ✅ STEP 4a: If payment linked to different user
    if (payment.user_id && payment.user_id !== user.id) {
      throw new Error(`Order ini sudah terhubung dengan akun lain. Jika ini adalah order Anda, silakan hubungi admin dengan Order ID: ${orderId}`);
    }

    // ✅ STEP 4b: Email security check for unlinked payments
    if (!payment.user_id && payment.email && payment.email !== user.email) {
      throw new Error(`Order ini terdaftar dengan email lain (${payment.email}). Pastikan Anda login dengan email yang benar untuk order ini.`);
    }

    // ✅ STEP 4c: Check if user already has a different payment
    const { data: userExistingPayments, error: userPaymentError } = await supabase
      .from('user_payments')
      .select('id, order_id')
      .eq('user_id', user.id)
      .neq('order_id', orderId)
      .limit(1);

    if (!userPaymentError && userExistingPayments?.length) {
      const existing = userExistingPayments[0];
      throw new Error(`Akun Anda sudah memiliki pembayaran aktif dengan Order ID: ${existing.order_id}. Satu akun hanya bisa memiliki satu pembayaran aktif.`);
    }

    // ✅ STEP 5: Perform safe update
    const updateData: any = { 
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    // Update email if needed
    if (!payment.email || payment.email !== user.email) {
      updateData.email = user.email;
    }

    logger.debug('Updating payment with data:', updateData);

    const { data: updatedPayment, error: updateError } = await supabase
      .from('user_payments')
      .update(updateData)
      .eq('id', payment.id)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Update error:', updateError);
      
      // Handle specific constraint errors
      if (updateError.code === '23505') {
        if (updateError.message.includes('user_payments_email_user_unique')) {
          throw new Error('Akun Anda sudah memiliki pembayaran aktif. Satu akun hanya bisa memiliki satu pembayaran.');
        }
        throw new Error('Data pembayaran sudah ada. Silakan hubungi admin jika ini adalah kesalahan.');
      }
      
      throw new Error(`Gagal menghubungkan order: ${updateError.message || 'Unknown error'}`);
    }

    logger.success('Payment linked successfully:', {
      orderId: updatedPayment.order_id,
      paymentId: updatedPayment.id,
      userId: updatedPayment.user_id,
      email: updatedPayment.email
    });
    
    toast.success('Order berhasil terhubung dengan akun Anda!');
    return updatedPayment;
    
  } catch (error: any) {
    logger.error('Error linking payment to user:', error);
    
    // Only show toast for generic errors
    if (!error.message?.includes('sudah terhubung') && 
        !error.message?.includes('terdaftar dengan email lain') && 
        !error.message?.includes('sudah memiliki pembayaran') &&
        !error.message?.includes('belum dibayar')) {
      toast.error(error.message);
    }
    
    throw error;
  }
};

export const getUserPaymentStatus = async (): Promise<{
  isPaid: boolean;
  paymentRecord: any | null;
  needsLinking: boolean;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) return { isPaid: false, paymentRecord: null, needsLinking: false };

    const { data: linkedPayments } = await supabase
      .from('user_payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (linkedPayments?.length) {
      return { isPaid: true, paymentRecord: linkedPayments[0], needsLinking: false };
    }

    return { isPaid: false, paymentRecord: null, needsLinking: true };
  } catch (error) {
    logger.error('Error getting user payment status:', error);
    return { isPaid: false, paymentRecord: null, needsLinking: false };
  }
};

// ✅ DEPRECATED MAGIC LINK FUNCTIONS - For backward compatibility
export const sendMagicLink = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true
): Promise<boolean> => {
  logger.warn('[authService] sendMagicLink is deprecated and removed');
  toast.error('Magic link authentication tidak tersedia. Gunakan OTP.');
  return false;
};

export const sendAuth = async (
  email: string, 
  method: 'otp' | 'magic' = 'otp', 
  captchaToken: string | null = null,
  allowSignup: boolean = true,
  skipCaptcha: boolean = false
): Promise<boolean> => {
  logger.warn('[authService] sendAuth is deprecated, use sendEmailOtp directly');
  if (method === 'otp') {
    return await sendEmailOtp(email, captchaToken, allowSignup, skipCaptcha);
  } else {
    toast.error('Magic link authentication tidak tersedia. Gunakan OTP.');
    return false;
  }
};

// ✅ More compatibility exports
export const onAuthStateChangeWithPaymentLinking = onAuthStateChange;
export const handleMagicLinkCallback = async (code: string) => {
  logger.warn('[authService] handleMagicLinkCallback is deprecated and removed');
  throw new Error('Magic link callback feature has been removed');
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  logger.warn('[authService] checkUserExists is deprecated and removed');
  return true; // Assume user exists for backward compatibility
};

export const checkEmailVerificationStatus = async () => {
  const session = await getCurrentSession();
  if (!session?.user) return { isVerified: false, needsVerification: false };
  
  const isVerified = !!session.user.email_confirmed_at;
  return { isVerified, needsVerification: !isVerified && !!session.user.email };
};

// ✅ ESSENTIAL: Export supabase client
export { supabase };