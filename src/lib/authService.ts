// src/services/authService.ts - DUAL AUTHENTICATION (EMAIL + ORDER) - UPDATED

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';

// ✅ CACHE: Simple session cache to avoid repeated calls
let sessionCache: { session: Session | null; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

// ✅ UTILS
const getRedirectUrl = () => {
  if (import.meta.env.VITE_AUTH_REDIRECT_URL) return import.meta.env.VITE_AUTH_REDIRECT_URL;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/callback`;
  return import.meta.env.DEV 
    ? 'https://dev3--gleaming-peony-f4a091.netlify.app/auth/callback'
    : 'https://kalkulator.monifine.my.id/auth/callback';
};

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const handleAuthError = (error: any, fallbackMessage: string) => {
  console.error('Auth error:', error);
  
  const errorMessages: Record<string, string> = {
    'Database error saving new user': 'Terjadi masalah database. Silakan hubungi administrator.',
    'Signups not allowed': 'Pendaftaran akun baru sedang dinonaktifkan. Silakan hubungi administrator.',
    'captcha verification process failed': 'Verifikasi CAPTCHA gagal. Silakan refresh halaman dan coba lagi.',
    'email rate limit exceeded': 'Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.',
    'over_email_send_rate_limit': 'Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.',
    'Invalid email': 'Format email tidak valid',
    'User not found': 'Email tidak terdaftar dalam sistem. Silakan hubungi administrator.',
    'expired': 'Kode sudah kadaluarsa. Silakan minta kode baru.',
    'invalid': 'Kode tidak valid. Silakan periksa kembali.',
    'too many attempts': 'Terlalu banyak percobaan. Silakan minta kode baru.',
    'token has expired or is invalid': 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.'
  };
  
  const message = Object.entries(errorMessages).find(([key]) => 
    error.message?.includes(key)
  )?.[1] || error.message || fallbackMessage;
  
  toast.error(message);
};

// ✅ Clear cache when session changes
const clearSessionCache = () => {
  sessionCache = null;
};

// ✅ OPTIMIZED: Fast session check with cache
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    // Check cache first
    if (sessionCache && (Date.now() - sessionCache.timestamp) < CACHE_DURATION) {
      return sessionCache.session;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AuthService] Error getting session:', error);
      return null;
    }
    
    // Update cache
    sessionCache = { session, timestamp: Date.now() };
    
    // Quick expiry check without refresh for better performance
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      console.log('[AuthService] Session expired');
      sessionCache = { session: null, timestamp: Date.now() };
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[AuthService] Error getting current session:', error);
    return null;
  }
};

// ✅ OPTIMIZED: Fast authentication check
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    return !!session?.user;
  } catch (error) {
    console.error('[AuthService] Error checking authentication:', error);
    return false;
  }
};

// ✅ OPTIMIZED: Fast user getter
export const getCurrentUser = async () => {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return null;
    }
    
    // Return user from session directly (faster than getUser() call)
    return session.user;
  } catch (error) {
    console.error('[AuthService] Error getting current user:', error);
    return null;
  }
};

// ✅ ENHANCED: Email OTP with better timing and debugging
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

    try { cleanupAuthState(); } catch {}
    clearSessionCache();

    const timestamp = new Date().toISOString();
    console.log('🔍 Step 1: Sending OTP to:', email, 'Time:', timestamp);
    
    const otpOptions: any = {
      shouldCreateUser: allowSignup,
    };

    // Skip captcha for resend or if explicitly disabled
    if (!skipCaptcha && captchaToken?.trim()) {
      otpOptions.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: otpOptions,
    });

    if (error) {
      console.error('📛 OTP send error:', error);

      if (error.message?.includes('Signups not allowed') && allowSignup) {
        console.log('🔍 Signup disabled, trying existing users only...');
        return await sendEmailOtp(email, captchaToken, false, skipCaptcha);
      }

      handleAuthError(error, 'Gagal mengirim kode verifikasi');
      return false;
    }

    console.log('✅ OTP sent successfully at:', new Date().toISOString(), 'Response:', data);
    
    if (data.user === null && data.session === null) {
      toast.success('Kode verifikasi telah dikirim ke email Anda. Kode berlaku 5 menit.');
      return true;
    } else {
      console.warn('⚠️ Unexpected OTP response format:', data);
      toast.success('Kode verifikasi dikirim. Silakan cek email Anda.');
      return true;
    }
  } catch (error) {
    console.error('📛 Unexpected error in sendEmailOtp:', error);
    handleAuthError(error, 'Terjadi kesalahan jaringan');
    return false;
  }
};

// ✅ ENHANCED: OTP verification with better error handling and timing
export const verifyEmailOtp = async (email: string, token: string): Promise<boolean | string> => {
  try {
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    // Enhanced token cleaning
    const cleanToken = token
      .replace(/\s/g, '')           // Remove all spaces
      .replace(/[^0-9A-Za-z]/g, '') // Remove non-alphanumeric
      .toUpperCase()                // Uppercase for consistency
      .slice(0, 6);                 // Take only first 6 chars

    if (cleanToken.length !== 6) {
      toast.error('Kode OTP harus 6 karakter');
      return false;
    }

    const timestamp = new Date().toISOString();
    console.log('🔍 Step 2: Verifying OTP for:', email, 'Time:', timestamp, 'Token length:', cleanToken.length);

    const verifyStartTime = Date.now();
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: cleanToken,
      type: 'email',
    });
    
    const verifyDuration = Date.now() - verifyStartTime;
    console.log('🔍 Verification took:', verifyDuration, 'ms');
    
    if (error) {
      console.error('📛 OTP verification error:', error);
      
      // Enhanced error handling with specific return values
      if (error.message?.includes('expired') || error.message?.includes('token has expired')) {
        console.log('🕐 Token expired, returning expired status');
        return 'expired';
      }
      
      if (error.message?.includes('invalid') && !error.message?.includes('expired')) {
        console.log('❌ Token invalid, returning false');
        toast.error('Kode OTP tidak valid. Silakan periksa kembali.');
        return false;
      }
      
      if (error.message?.includes('too many attempts')) {
        console.log('🚫 Too many attempts, returning rate_limited status');
        return 'rate_limited';
      }
      
      handleAuthError(error, 'Verifikasi gagal. Silakan coba lagi.');
      return false;
    }
    
    if (data.session && data.user) {
      console.log('✅ OTP verified successfully. User logged in:', data.user.email);
      clearSessionCache();
      toast.success('Login berhasil! Selamat datang.');
      return true;
    } else {
      console.warn('⚠️ OTP verified but no session created:', data);
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
  } catch (error) {
    console.error('📛 Unexpected error in verifyEmailOtp:', error);
    handleAuthError(error, 'Terjadi kesalahan jaringan saat verifikasi');
    return false;
  }
};

export const sendMagicLink = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true
): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    try { cleanupAuthState(); } catch {}
    clearSessionCache();

    console.log('🔍 Sending magic link to:', email, 'Time:', new Date().toISOString());
    
    const magicLinkOptions: any = {
      emailRedirectTo: getRedirectUrl(),
      shouldCreateUser: allowSignup,
    };

    if (captchaToken?.trim()) {
      magicLinkOptions.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: magicLinkOptions,
    });

    if (error) {
      console.error('📛 Magic link error:', error);
      
      if (error.message?.includes('Signups not allowed') && allowSignup) {
        console.log('🔍 Signup disabled for magic link, trying existing users only...');
        return await sendMagicLink(email, captchaToken, false);
      }

      handleAuthError(error, 'Gagal mengirim magic link');
      return false;
    }

    console.log('✅ Magic link sent successfully:', data);
    toast.success('Magic link telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    return true;
  } catch (error) {
    console.error('📛 Unexpected error in sendMagicLink:', error);
    handleAuthError(error, 'Terjadi kesalahan jaringan');
    return false;
  }
};

// ✅ ENHANCED: Unified send auth with better debugging
export const sendAuth = async (
  email: string, 
  method: 'otp' | 'magic' = 'otp', 
  captchaToken: string | null = null,
  allowSignup: boolean = true,
  skipCaptcha: boolean = false
): Promise<boolean> => {
  try {
    console.log(`🔍 Sending ${method} auth for:`, email, 'allowSignup:', allowSignup, 'skipCaptcha:', skipCaptcha);
    
    if (method === 'otp') {
      const otpResult = await sendEmailOtp(email, captchaToken, allowSignup, skipCaptcha);
      
      if (!otpResult && !allowSignup) {
        console.log('🔍 OTP failed for existing user, trying magic link fallback...');
        toast.info('Mencoba metode alternatif...');
        return await sendMagicLink(email, captchaToken, false);
      }
      
      return otpResult;
    } else {
      return await sendMagicLink(email, captchaToken, allowSignup);
    }
  } catch (error) {
    console.error('📛 Error in unified sendAuth:', error);
    return false;
  }
};

export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AuthService] Sign out error:', error);
      toast.error('Gagal logout');
      return false;
    }
    
    clearSessionCache();
    try { cleanupAuthState(); } catch {}
    toast.success('Logout berhasil');
    return true;
  } catch (error) {
    console.error('[AuthService] Error in signOut:', error);
    toast.error('Terjadi kesalahan saat logout');
    return false;
  }
};

// ✅ ORDER VERIFICATION FUNCTIONS
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
    
    const { data: payments, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);

    console.log('🔍 Found payments:', { payments, findError, count: payments?.length });

    if (findError) {
      console.error('🔍 Search error:', findError);
      throw new Error('Gagal mencari order. Silakan coba lagi.');
    }

    if (!payments || payments.length === 0) {
      throw new Error('Order ID tidak ditemukan atau belum dibayar. Silakan periksa kembali.');
    }

    const payment = payments[0];
    console.log('🔍 Found payment:', payment);

    if (payment.user_id && payment.user_id !== user.id) {
      throw new Error('Order ini sudah terhubung dengan akun lain.');
    }

    const { data: updatedPayment, error: updateError } = await supabase
      .from('user_payments')
      .update({ 
        user_id: user.id, 
        email: user.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('🔍 Update error:', updateError);
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

// ✅ PAYMENT STATUS FUNCTIONS
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

export const autoLinkUserPayments = async (): Promise<number> => {
  return 0;
};

export const checkUnlinkedPayments = async (): Promise<{ hasUnlinked: boolean; count: number }> => {
  return { hasUnlinked: false, count: 0 };
};

export const getRecentUnlinkedOrders = async (): Promise<string[]> => {
  return [];
};

// ✅ UTILITY FUNCTIONS
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[AuthService] Auth state changed:', event, session?.user?.email);
    clearSessionCache();
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
};

export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(),
    });

    if (error) {
      handleAuthError(error, 'Gagal mengirim link reset password');
      return false;
    }

    toast.success('Link reset password telah dikirim ke email Anda');
    return true;
  } catch (error) {
    handleAuthError(error, 'Terjadi kesalahan saat mengirim link reset password');
    return false;
  }
};

export const handleMagicLinkCallback = async (code: string) => {
  try {
    console.log('[AuthService] Processing magic link callback...');
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) throw error;
    
    if (data.session && data.user) {
      console.log('[AuthService] Magic link authentication successful:', data.user.email);
      clearSessionCache();
      toast.success('Login berhasil! Selamat datang.');
      return { session: data.session, user: data.user };
    }
    
    throw new Error('No session created from magic link');
  } catch (error) {
    console.error('[AuthService] Error in magic link callback:', error);
    throw error;
  }
};

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
      clearSessionCache();
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('[AuthService] Error refreshing session:', error);
    return null;
  }
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    
    if (!error) return true;
    if (error.message?.includes('User not found')) return false;
    
    console.warn('Unclear user existence check:', error.message);
    return true;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

// ✅ ALIASES for backward compatibility
export const onAuthStateChangeWithPaymentLinking = onAuthStateChange;
export const hasValidSession = isAuthenticated;
export const checkEmailVerificationStatus = async () => {
  const session = await getCurrentSession();
  if (!session?.user) return { isVerified: false, needsVerification: false };
  
  const isVerified = !!session.user.email_confirmed_at;
  return { isVerified, needsVerification: !isVerified && !!session.user.email };
};

export { supabase };