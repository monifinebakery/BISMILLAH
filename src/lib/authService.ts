// src/services/authService.ts - COMPLETE ENHANCED VERSION WITH SAFE SESSION HANDLING

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';

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
    'too many attempts': 'Terlalu banyak percobaan. Silakan minta kode baru.'
  };
  
  const message = Object.entries(errorMessages).find(([key]) => 
    error.message?.includes(key)
  )?.[1] || error.message || fallbackMessage;
  
  toast.error(message);
};

// ✅ STEP 1: Send OTP - Following Supabase Docs Pattern
export const sendEmailOtp = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true
): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    try { cleanupAuthState(); } catch {} // Silent cleanup

    console.log('🔍 Step 1: Sending OTP to:', email);
    
    // ✅ Following Supabase docs pattern exactly
    const otpOptions: any = {
      shouldCreateUser: allowSignup, // Control user creation
    };

    // Add captcha token if provided
    if (captchaToken?.trim()) {
      otpOptions.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: otpOptions,
    });

    if (error) {
      console.error('📛 OTP send error:', error);

      // ✅ Handle specific "Signups not allowed" case
      if (error.message?.includes('Signups not allowed') && allowSignup) {
        console.log('🔍 Signup disabled, trying existing users only...');
        // Retry with shouldCreateUser: false for existing users
        return await sendEmailOtp(email, captchaToken, false);
      }

      handleAuthError(error, 'Gagal mengirim kode verifikasi');
      return false;
    }

    // ✅ Success response should have user: null, session: null (as per docs)
    console.log('✅ OTP sent successfully. Response:', data);
    
    if (data.user === null && data.session === null) {
      toast.success('Kode verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
      return true;
    } else {
      // Unexpected response format
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

// ✅ STEP 2: Verify OTP - Following Supabase Docs Pattern
export const verifyEmailOtp = async (email: string, token: string): Promise<boolean> => {
  try {
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    // Clean token (remove spaces, keep original case as some OTPs might be case-sensitive)
    const cleanToken = token.replace(/\s/g, '');

    console.log('🔍 Step 2: Verifying OTP for:', email);

    // ✅ Following Supabase docs pattern exactly
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: cleanToken,
      type: 'email', // Must specify type as 'email'
    });
    
    if (error) {
      console.error('📛 OTP verification error:', error);
      handleAuthError(error, 'Verifikasi gagal. Silakan coba lagi.');
      return false;
    }
    
    // ✅ Success response should have valid session (as per docs)
    if (data.session && data.user) {
      console.log('✅ OTP verified successfully. User logged in:', data.user.email);
      toast.success('Login berhasil! Selamat datang.');
      
      // Auto-link payments after successful login
      setTimeout(() => autoLinkUserPayments().catch(console.error), 1000);
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

// ✅ Magic Link - Also following docs pattern
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

    console.log('🔍 Sending magic link to:', email);
    
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
      
      // Handle signup disabled case
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

// ✅ Unified send function with automatic fallback
export const sendAuth = async (
  email: string, 
  method: 'otp' | 'magic' = 'otp', 
  captchaToken: string | null = null,
  allowSignup: boolean = true
): Promise<boolean> => {
  try {
    console.log(`🔍 Sending ${method} auth for:`, email, 'allowSignup:', allowSignup);
    
    if (method === 'otp') {
      const otpResult = await sendEmailOtp(email, captchaToken, allowSignup);
      
      // ✅ Fallback to magic link if OTP completely fails and signup is disabled
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

// ✅ Password Reset
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

// ✅ Magic Link Callback Handler
export const handleMagicLinkCallback = async (code: string) => {
  try {
    console.log('[AuthService] Processing magic link callback...');
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) throw error;
    
    if (data.session && data.user) {
      console.log('[AuthService] Magic link authentication successful:', data.user.email);
      toast.success('Login berhasil! Selamat datang.');
      
      // Auto-link payments after successful magic link
      setTimeout(() => autoLinkUserPayments().catch(console.error), 1000);
      return { session: data.session, user: data.user };
    }
    
    throw new Error('No session created from magic link');
  } catch (error) {
    console.error('[AuthService] Error in magic link callback:', error);
    throw error;
  }
};

// ✅ ENHANCED SESSION MANAGEMENT - Safe session handling
export const getCurrentUser = async () => {
  try {
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[AuthService] Session error:', sessionError);
      return null;
    }
    
    if (!session) {
      console.log('[AuthService] No session found - user not logged in');
      return null;
    }
    
    // If we have a session, get the user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[AuthService] Get user error:', error);
      
      // If session is invalid, try to refresh
      if (error.message?.includes('session missing') || error.message?.includes('invalid')) {
        console.log('[AuthService] Attempting session refresh...');
        const refreshResult = await refreshSession();
        
        if (refreshResult) {
          // Try getting user again after refresh
          const { data: { user: refreshedUser }, error: refreshedError } = await supabase.auth.getUser();
          if (!refreshedError && refreshedUser) {
            return refreshedUser;
          }
        }
      }
      
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[AuthService] Error getting current user:', error);
    return null;
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AuthService] Error getting session:', error);
      return null;
    }
    
    if (!session) {
      console.log('[AuthService] No session available');
      return null;
    }
    
    // Check if session is expired
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      console.log('[AuthService] Session expired, attempting refresh...');
      return await refreshSession();
    }
    
    return session;
  } catch (error) {
    console.error('[AuthService] Error getting current session:', error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AuthService] Error checking authentication:', error);
      return false;
    }
    
    // Check if session exists and is not expired
    if (!session) {
      return false;
    }
    
    // Check if session is expired
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      console.log('[AuthService] Session expired');
      return false;
    }
    
    return !!session.user;
  } catch (error) {
    console.error('[AuthService] Error checking authentication:', error);
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
    
    try { cleanupAuthState(); } catch {}
    toast.success('Logout berhasil');
    return true;
  } catch (error) {
    console.error('[AuthService] Error in signOut:', error);
    toast.error('Terjadi kesalahan saat logout');
    return false;
  }
};

export const refreshSession = async (): Promise<Session | null> => {
  try {
    console.log('[AuthService] Refreshing session...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[AuthService] Session refresh error:', error);
      
      // If refresh fails, session is likely invalid - clean up
      if (error.message?.includes('refresh_token_not_found') || 
          error.message?.includes('invalid_grant')) {
        console.log('[AuthService] Session invalid, cleaning up...');
        await cleanupInvalidSession();
      }
      
      return null;
    }
    
    if (data.session) {
      console.log('[AuthService] Session refreshed successfully');
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('[AuthService] Error refreshing session:', error);
    return null;
  }
};

// ✅ NEW: Clean up invalid session
const cleanupInvalidSession = async () => {
  try {
    console.log('[AuthService] Cleaning up invalid session...');
    
    // Clear Supabase session
    await supabase.auth.signOut({ scope: 'local' });
    
    // Clean up any local state
    try {
      cleanupAuthState();
    } catch (cleanupError) {
      console.warn('Cleanup auth state failed:', cleanupError);
    }
    
    console.log('[AuthService] Invalid session cleaned up');
  } catch (error) {
    console.error('[AuthService] Error cleaning up invalid session:', error);
  }
};

// ✅ UTILITY FUNCTIONS
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    // Try to send OTP with shouldCreateUser: false to check if user exists
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    
    // If no error, user exists and OTP was sent
    if (!error) return true;
    
    // If "User not found", user doesn't exist
    if (error.message?.includes('User not found')) return false;
    
    // For other errors, assume user might exist (better safe than sorry)
    console.warn('Unclear user existence check:', error.message);
    return true;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[AuthService] Auth state changed:', event, session?.user?.email);
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
};

// ✅ ENHANCED PAYMENT INTEGRATION - Safe auth checks
export const linkPaymentToUser = async (orderId: string, user: any): Promise<any> => {
  try {
    const { data: payment, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (findError || !payment) throw new Error('Order ID tidak ditemukan. Silakan periksa kembali.');
    if (payment.user_id && payment.user_id !== user.id) throw new Error('Order ini sudah terhubung dengan akun lain.');

    const { data: updatedPayment, error: updateError } = await supabase
      .from('user_payments')
      .update({ user_id: user.id, email: user.email })
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (updateError) throw new Error('Gagal menghubungkan order. Silakan coba lagi.');

    toast.success('Order berhasil terhubung dengan akun Anda!');
    return updatedPayment;
  } catch (error: any) {
    console.error('Error linking payment to user:', error);
    toast.error(error.message);
    throw error;
  }
};

export const autoLinkUserPayments = async (): Promise<number> => {
  try {
    // Check if user is authenticated first
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      console.log('[AuthService] User not authenticated, skipping auto-link');
      return 0;
    }
    
    const user = await getCurrentUser();
    if (!user?.email) {
      console.log('[AuthService] No user email found for auto-link');
      return 0;
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: unlinkedPayments, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .is('user_id', null)
      .eq('is_paid', true)
      .gte('created_at', last24Hours)
      .or(`email.eq.${user.email},email.eq.unlinked@payment.com`);

    if (findError || !unlinkedPayments?.length) return 0;

    const { error: updateError } = await supabase
      .from('user_payments')
      .update({ user_id: user.id, email: user.email })
      .in('id', unlinkedPayments.map(p => p.id));

    if (updateError) {
      console.error('Error auto-linking payments:', updateError);
      return 0;
    }

    if (unlinkedPayments.length > 0) {
      toast.success(`${unlinkedPayments.length} pembayaran berhasil terhubung dengan akun Anda!`);
    }

    return unlinkedPayments.length;
  } catch (error) {
    console.error('Error in auto-link payments:', error);
    return 0;
  }
};

export const checkUnlinkedPayments = async (): Promise<{ hasUnlinked: boolean; count: number }> => {
  try {
    // Check authentication first
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return { hasUnlinked: false, count: 0 };
    }
    
    const user = await getCurrentUser();
    if (!user?.email) {
      return { hasUnlinked: false, count: 0 };
    }

    const { data: unlinkedPayments, error } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid')
      .is('user_id', null)
      .eq('is_paid', true)
      .or(`email.eq.${user.email},email.eq.unlinked@payment.com`);

    if (error) {
      console.error('Error checking unlinked payments:', error);
      return { hasUnlinked: false, count: 0 };
    }

    const count = unlinkedPayments?.length || 0;
    return { hasUnlinked: count > 0, count };
  } catch (error) {
    console.error('Error checking unlinked payments:', error);
    return { hasUnlinked: false, count: 0 };
  }
};

export const getUserPaymentStatus = async (): Promise<{
  isPaid: boolean;
  paymentRecord: any | null;
  needsLinking: boolean;
}> => {
  try {
    // Check authentication first
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return { isPaid: false, paymentRecord: null, needsLinking: false };
    }
    
    const user = await getCurrentUser();
    if (!user) {
      return { isPaid: false, paymentRecord: null, needsLinking: false };
    }

    // Check linked payments first
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

    // Check unlinked payments by email
    const { data: unlinkedPayments } = await supabase
      .from('user_payments')
      .select('*')
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .or(`email.eq.${user.email},email.eq.unlinked@payment.com`)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (unlinkedPayments?.length) {
      return { isPaid: true, paymentRecord: unlinkedPayments[0], needsLinking: true };
    }

    return { isPaid: false, paymentRecord: null, needsLinking: false };
  } catch (error) {
    console.error('Error getting user payment status:', error);
    return { isPaid: false, paymentRecord: null, needsLinking: false };
  }
};

export const verifyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_payments')
      .select('id')
      .eq('order_id', orderId)
      .single();
    return !error && !!data;
  } catch (error) {
    console.error('Error verifying order:', error);
    return false;
  }
};

export const getRecentUnlinkedOrders = async (): Promise<string[]> => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: payments, error } = await supabase
      .from('user_payments')
      .select('order_id')
      .is('user_id', null)
      .eq('is_paid', true)
      .gte('created_at', last24Hours)
      .order('created_at', { ascending: false })
      .limit(5);

    return error ? [] : payments?.map(p => p.order_id).filter(Boolean) || [];
  } catch (error) {
    console.error('Error getting recent orders:', error);
    return [];
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