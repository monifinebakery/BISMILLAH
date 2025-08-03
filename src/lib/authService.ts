// src/services/authService.ts - COMPACT VERSION

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

// ✅ CORE AUTH FUNCTIONS
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
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

// ✅ UNIFIED: Send auth (OTP or Magic Link)
export const sendAuth = async (
  email: string, 
  method: 'otp' | 'magic' = 'otp', 
  captchaToken: string | null = null
): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    try { cleanupAuthState(); } catch {} // Silent cleanup

    console.log(`🔍 Sending ${method} to:`, email);
    
    const baseOptions: any = {
      ...(method === 'otp' ? { channel: 'email' } : { emailRedirectTo: getRedirectUrl() }),
      shouldCreateUser: method === 'magic', // Magic link allows new users, OTP tries existing first
    };

    if (captchaToken?.trim()) baseOptions.captchaToken = captchaToken;

    let { error } = await supabase.auth.signInWithOtp({ email, options: baseOptions });

    // ✅ FALLBACK: If OTP fails for new user, try with shouldCreateUser: true
    if (error?.message?.includes('User not found') && method === 'otp') {
      console.log('🔍 User not found, trying with shouldCreateUser: true');
      const { error: retryError } = await supabase.auth.signInWithOtp({
        email,
        options: { ...baseOptions, shouldCreateUser: true }
      });
      error = retryError;
    }

    // ✅ FALLBACK: If signup disabled for OTP, try magic link
    if (error?.message?.includes('Signups not allowed') && method === 'otp') {
      console.log('🔍 OTP signup disabled, trying magic link fallback...');
      return await sendAuth(email, 'magic', captchaToken);
    }

    if (error) {
      handleAuthError(error, `Gagal mengirim ${method === 'otp' ? 'kode verifikasi' : 'magic link'}`);
      return false;
    }

    const successMessage = method === 'otp' 
      ? 'Kode verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.'
      : 'Magic link telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.';
    
    toast.success(successMessage);
    return true;
  } catch (error) {
    handleAuthError(error, 'Terjadi kesalahan jaringan');
    return false;
  }
};

// ✅ ALIASES for backward compatibility
export const sendEmailOtp = (email: string, captchaToken?: string | null) => 
  sendAuth(email, 'otp', captchaToken);

export const sendMagicLink = (email: string, captchaToken?: string | null) => 
  sendAuth(email, 'magic', captchaToken);

export const verifyEmailOtp = async (email: string, token: string): Promise<boolean> => {
  try {
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    const cleanToken = token.replace(/\s/g, '').toUpperCase();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: 'email'
    });
    
    if (error) {
      handleAuthError(error, 'Verifikasi gagal. Silakan coba lagi.');
      return false;
    }
    
    if (data.session && data.user) {
      toast.success('Login berhasil! Selamat datang.');
      
      // Auto-link payments after successful login
      setTimeout(() => autoLinkUserPayments().catch(console.error), 1000);
      return true;
    }
    
    toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
    return false;
  } catch (error) {
    handleAuthError(error, 'Terjadi kesalahan jaringan saat verifikasi');
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

// ✅ SESSION MANAGEMENT
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[AuthService] Get user error:', error);
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
      console.error('Error getting current session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return !error && !!session?.user;
  } catch (error) {
    console.error('Error checking authentication:', error);
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
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('[AuthService] Session refresh error:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('[AuthService] Error refreshing session:', error);
    return null;
  }
};

// ✅ UTILITY FUNCTIONS
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { channel: 'email', shouldCreateUser: false },
    });
    return !error || !error.message?.includes('User not found');
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

// ✅ PAYMENT INTEGRATION (Simplified)
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
    const user = await getCurrentUser();
    if (!user?.email) return 0;

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
    const user = await getCurrentUser();
    if (!user?.email) return { hasUnlinked: false, count: 0 };

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
    const user = await getCurrentUser();
    if (!user) return { isPaid: false, paymentRecord: null, needsLinking: false };

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