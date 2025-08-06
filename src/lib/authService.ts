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
      console.error('[AuthService] Error getting session:', error);
      clearSessionCache();
      return null;
    }
    
    // Update cache
    sessionCache = session;
    cacheTimestamp = now;
    
    // Quick expiry check
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      console.log('[AuthService] Session expired');
      clearSessionCache();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[AuthService] Error getting current session:', error);
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
    console.error('[AuthService] Error checking authentication:', error);
    return false;
  }
};

// ✅ SIMPLIFIED: Get current user
export const getCurrentUser = async () => {
  try {
    const session = await getCurrentSession();
    return session?.user || null;
  } catch (error) {
    console.error('[AuthService] Error getting current user:', error);
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

    console.log('🔍 Sending OTP to:', email, 'allowSignup:', allowSignup, 'skipCaptcha:', skipCaptcha);
    
    // Prepare OTP options
    const otpOptions: any = {
      shouldCreateUser: allowSignup,
    };

    // Add captcha token if provided and not skipped
    if (!skipCaptcha && captchaToken?.trim()) {
      otpOptions.captchaToken = captchaToken;
      console.log('🔍 Using captcha token');
    }

    // Send OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: otpOptions,
    });

    if (error) {
      console.error('📛 OTP send error:', error);
      
      // Handle signup not allowed error
      if (error.message?.includes('Signups not allowed') && allowSignup) {
        console.log('🔍 Signup disabled, trying existing users only...');
        toast.info('Mencoba untuk pengguna terdaftar...');
        return await sendEmailOtp(email, captchaToken, false, skipCaptcha);
      }

      // Show error message
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
      return false;
    }

    console.log('✅ OTP sent successfully:', data);
    return true;
    
  } catch (error) {
    console.error('📛 Unexpected error in sendEmailOtp:', error);
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
    
    console.log('🔍 Mobile Debug - Verifying OTP:', {
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
    
    console.log('🔍 Mobile Debug - Verification result:', {
      duration: `${duration}ms`,
      hasError: !!error,
      hasSession: !!data?.session,
      hasUser: !!data?.user
    });
    
    if (error) {
      console.error('📛 OTP verification error:', error);
      
      // ✅ ENHANCED: Better mobile error detection
      const errorMsg = error.message?.toLowerCase() || '';
      
      if (errorMsg.includes('expired') || errorMsg.includes('token has expired')) {
        console.log('🕐 Token expired - Mobile Debug:', {
          errorMessage: error.message,
          timeSinceStart: duration,
          possibleCause: duration > 10000 ? 'Network slow' : 'Token actually expired'
        });
        return 'expired';
      }
      
      if (errorMsg.includes('too many attempts')) {
        console.log('🚫 Too many attempts - Mobile Debug');
        toast.error('Terlalu banyak percobaan. Silakan minta kode baru.');
        return 'rate_limited';
      }
      
      if (errorMsg.includes('invalid')) {
        console.log('❌ Token invalid - Mobile Debug:', {
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
      console.log('✅ OTP verified successfully - Mobile Debug:', {
        userId: data.user.id,
        email: data.user.email,
        sessionExpiry: data.session.expires_at,
        duration: `${duration}ms`
      });
      clearSessionCache();
      return true;
    } else {
      console.warn('⚠️ OTP verified but no session created - Mobile Debug:', data);
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
    
  } catch (error) {
    console.error('📛 Unexpected error in verifyEmailOtp - Mobile Debug:', {
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
      console.error('[AuthService] Sign out error:', error);
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
    console.error('[AuthService] Error in signOut:', error);
    toast.error('Terjadi kesalahan saat logout');
    return false;
  }
};

// ✅ SIMPLIFIED: Auth state change listener
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[AuthService] Auth state changed:', event, session?.user?.email);
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
    console.error('Error sending password reset:', error);
    toast.error('Terjadi kesalahan saat mengirim link reset password');
    return false;
  }
};

// ✅ OPTIONAL: Refresh session if needed
export const refreshSession = async (): Promise<Session | null> => {
  try {
    console.log('[AuthService] Refreshing session...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[AuthService] Session refresh error:', error);
      clearSessionCache();
      return null;
    }
    
    if (data.session) {
      console.log('[AuthService] Session refreshed successfully');
      clearSessionCache(); // Clear cache to force fresh fetch
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('[AuthService] Error refreshing session:', error);
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

    console.log('🔍 Verifying customer order:', { email, orderId });

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
        console.log('✅ Order already verified for this email');
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
    
    console.log('🔍 RPC Verification result:', { data, error });

    if (error) {
      console.error('📛 Order verification error:', error);
      
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
      console.log('✅ Order verification successful:', result);
    } else {
      console.log('❌ Order verification failed:', result.message);
    }

    return result;
    
  } catch (error: any) {
    console.error('📛 Unexpected error in verifyCustomerOrder:', error);
    
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
    console.log('🔍 DEBUG: Checking constraint for:', { email, userId });
    
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
    
    console.log('🔍 DEBUG Results:', {
      emailPayments: emailPayments?.length || 0,
      userPayments: userPayments?.length || 0,
      emailPaymentDetails: emailPayments,
      userPaymentDetails: userPayments
    });
    
    return { emailPayments, userPayments };
  } catch (error) {
    console.error('❌ Debug error:', error);
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
      console.error('Error checking user payment:', error);
      return { hasPayment: false };
    }

    return {
      hasPayment: data && data.length > 0,
      payment: data?.[0] || null
    };
  } catch (error) {
    console.error('Error in checkUserHasPayment:', error);
    return { hasPayment: false };
  }
};

// ✅ ALIASES: For backward compatibility (if needed)
export const hasValidSession = isAuthenticated;

// ✅ BACKWARD COMPATIBILITY: Export missing functions to prevent import errors
export const autoLinkUserPayments = async (): Promise<number> => {
  console.warn('[authService] autoLinkUserPayments is deprecated and removed');
  return 0;
};

export const checkUnlinkedPayments = async (): Promise<{ hasUnlinked: boolean; count: number }> => {
  console.warn('[authService] checkUnlinkedPayments is deprecated and removed');
  return { hasUnlinked: false, count: 0 };
};

export const getRecentUnlinkedOrders = async (): Promise<string[]> => {
  console.warn('[authService] getRecentUnlinkedOrders is deprecated and removed');
  return [];
};

// ✅ ORDER VERIFICATION FUNCTIONS - KEEP THESE
export const verifyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    console.log('🔍 Verifying order exists:', orderId);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status')
      .eq('order_id', orderId)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);
    
    console.log('🔍 Order verification result:', { data, error, count: data?.length });
    
    if (error) {
      console.error('Order verification error:', error);
      return false;
    }
    
    const exists = data && data.length > 0;
    console.log('🔍 Order exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error verifying order:', error);
    return false;
  }
};

export const linkPaymentToUser = async (orderId: string, user: any): Promise<any> => {
  try {
    console.log('🔍 Linking order to user:', orderId, user.email);
    
    // ✅ STEP 1: Check if already linked to this user
    const { data: existingLink, error: existingError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .limit(1);

    if (!existingError && existingLink?.length) {
      console.log('✅ Payment already linked to this user');
      toast.success('Order sudah terhubung dengan akun Anda!');
      return existingLink[0];
    }

    // ✅ STEP 2: Find unlinked payment
    const { data: payments, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .is('user_id', null)  // Only unlinked payments
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);

    console.log('🔍 Found payments:', { payments, findError, count: payments?.length });

    if (findError) {
      console.error('🔍 Search error:', findError);
      throw new Error('Gagal mencari order. Silakan coba lagi.');
    }

    if (!payments || payments.length === 0) {
      throw new Error('Order ID tidak ditemukan, belum dibayar, atau sudah terhubung dengan akun lain.');
    }

    const payment = payments[0];
    console.log('🔍 Found payment:', payment);

    // ✅ STEP 3: Check for constraint conflict
    const { data: conflictCheck, error: conflictError } = await supabase
      .from('user_payments')
      .select('id, order_id')
      .eq('email', user.email)
      .eq('user_id', user.id)
      .limit(1);

    if (!conflictError && conflictCheck?.length) {
      const existing = conflictCheck[0];
      if (existing.order_id === orderId) {
        console.log('✅ Same order already linked');
        toast.success('Order sudah terhubung dengan akun Anda!');
        return payment;
      }
      throw new Error(`Akun Anda sudah memiliki pembayaran dengan Order ID: ${existing.order_id}. Satu akun hanya bisa memiliki satu pembayaran aktif.`);
    }

    // ✅ STEP 4: Safe update - only update user_id, keep existing email
    const updateData: any = { 
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    // Only update email if it's currently null, empty, or different
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
      console.error('🔍 Update error:', updateError);
      
      // ✅ ENHANCED: Handle specific constraint errors
      if (updateError.code === '23505') {
        if (updateError.message.includes('user_payments_email_user_unique')) {
          throw new Error('Akun Anda sudah memiliki pembayaran aktif. Satu akun hanya bisa memiliki satu pembayaran.');
        }
        throw new Error('Data pembayaran sudah ada. Silakan hubungi admin jika ini adalah kesalahan.');
      }
      
      throw new Error('Gagal menghubungkan order. Silakan coba lagi.');
    }

    console.log('✅ Payment linked successfully:', updatedPayment);
    toast.success('Order berhasil terhubung dengan akun Anda!');
    return updatedPayment;
    
  } catch (error: any) {
    console.error('Error linking payment to user:', error);
    toast.error(error.message);
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
    console.error('Error getting user payment status:', error);
    return { isPaid: false, paymentRecord: null, needsLinking: false };
  }
};

// ✅ DEPRECATED MAGIC LINK FUNCTIONS - For backward compatibility
export const sendMagicLink = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true
): Promise<boolean> => {
  console.warn('[authService] sendMagicLink is deprecated and removed');
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
  console.warn('[authService] sendAuth is deprecated, use sendEmailOtp directly');
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
  console.warn('[authService] handleMagicLinkCallback is deprecated and removed');
  throw new Error('Magic link callback feature has been removed');
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  console.warn('[authService] checkUserExists is deprecated and removed');
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