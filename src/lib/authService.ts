// src/services/authService.ts - FULL VERSION WITH PAYMENT INTEGRATION

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';

// ✅ FIXED: Smart auto-detection for redirect URL
const getRedirectUrl = () => {
  // If manually set in environment, use that
  if (import.meta.env.VITE_AUTH_REDIRECT_URL) {
    return import.meta.env.VITE_AUTH_REDIRECT_URL;
  }
  
  // Auto-detect based on current domain
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    
    // Always use current origin + /auth/callback
    return `${currentOrigin}/auth/callback`;
  }
  
  // Server-side fallback (should rarely be used)
  if (import.meta.env.DEV) {
    return 'https://dev3--gleaming-peony-f4a091.netlify.app/auth/callback';
  }
  
  return 'https://kalkulator.monifine.my.id/auth/callback';
};

/**
 * Mengirim email reset password ke alamat email yang diberikan.
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(),
    });

    if (error) {
      console.error('Password reset error:', error);

      if (error.message?.includes('email rate limit exceeded') ||
          error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam beberapa menit.');
      } else {
        toast.error(error.message || 'Gagal mengirim link reset password');
      }
      return false;
    }

    toast.success('Link reset password telah dikirim ke email Anda');
    return true;
  } catch (error) {
    console.error('Error sending password reset link:', error);
    toast.error('Terjadi kesalahan saat mengirim link reset password');
    return false;
  }
};

/**
 * ✅ MAGIC LINK: Send magic link for passwordless authentication
 */
export const sendMagicLink = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    // Clean up auth state (optional - remove if causing issues)
    try {
      cleanupAuthState();
    } catch (cleanupError) {
      console.warn('Cleanup auth state failed:', cleanupError);
      // Continue anyway
    }

    console.log('🔍 Sending magic link to:', email);
    
    // Prepare magic link options
    let magicLinkOptions: any = {
      emailRedirectTo: getRedirectUrl(),
      shouldCreateUser: true, // ✅ Allow new user creation since you're OK with new users
    };

    // Only add captcha token if it's a valid string
    if (captchaToken && typeof captchaToken === 'string' && captchaToken.trim()) {
      magicLinkOptions.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: magicLinkOptions,
    });

    if (error) {
      console.error('📛 Magic link error:', error);
      console.error('📛 Error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.__isAuthError ? 'AuthError' : 'Unknown'
      });

      // ✅ IMPROVED: More specific error handling
      if (error.message?.includes('Database error saving new user')) {
        console.error('📛 Database schema issue detected');
        toast.error('Terjadi masalah database. Silakan hubungi administrator atau coba lagi nanti.');
      } else if (error.message?.includes('Signups not allowed for otp')) {
        console.error('📛 Signup disabled for OTP');
        toast.error('Pendaftaran akun baru sedang dinonaktifkan. Silakan hubungi administrator atau gunakan akun yang sudah ada.');
      } else if (error.message?.includes('captcha verification process failed')) {
        toast.error('Verifikasi CAPTCHA gagal. Silakan refresh halaman dan coba lagi.');
      } else if (error.message?.includes('email rate limit exceeded') ||
                  error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.');
      } else if (error.message?.includes('Invalid email')) {
        toast.error('Format email tidak valid');
      } else if (error.message?.includes('signup_disabled')) {
        toast.error('Pendaftaran akun baru sedang dinonaktifkan.');
      } else {
        toast.error(error.message || 'Gagal mengirim magic link');
      }
      return false;
    }

    console.log('✅ Magic link sent successfully:', data);
    toast.success('Magic link telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    return true;
  } catch (error) {
    console.error('📛 Unexpected error in sendMagicLink:', error);
    toast.error('Terjadi kesalahan jaringan. Silakan periksa koneksi internet Anda.');
    return false;
  }
};

/**
 * ✅ OTP: Send OTP code for email verification (alternative to magic link)
 */
export const sendEmailOtp = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    // Clean up auth state (optional - remove if causing issues)
    try {
      cleanupAuthState();
    } catch (cleanupError) {
      console.warn('Cleanup auth state failed:', cleanupError);
      // Continue anyway
    }

    console.log('🔍 Attempting OTP send for:', email);
    
    // Method 1: Try with shouldCreateUser = false first (for existing users)
    let otpOptions: any = {
      channel: 'email',
      shouldCreateUser: false, // ✅ Try existing users first
    };

    // Only add captcha token if it's a valid string
    if (captchaToken && typeof captchaToken === 'string' && captchaToken.trim()) {
      otpOptions.captchaToken = captchaToken;
    }

    console.log('🔍 Trying with shouldCreateUser: false');
    let { error } = await supabase.auth.signInWithOtp({
      email,
      options: otpOptions,
    });

    // If user doesn't exist, try creating new user
    if (error && error.message?.includes('User not found')) {
      console.log('🔍 User not found, trying with shouldCreateUser: true');
      
      otpOptions.shouldCreateUser = true;
      
      const result = await supabase.auth.signInWithOtp({
        email,
        options: otpOptions,
      });
      
      error = result.error;
    }

    if (error) {
      console.error('📛 Email OTP error:', error);
      console.error('📛 Error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.__isAuthError ? 'AuthError' : 'Unknown'
      });

      // ✅ IMPROVED: More specific error handling
      if (error.message?.includes('Database error saving new user')) {
        console.error('📛 Database schema issue detected');
        toast.error('Terjadi masalah database. Silakan hubungi administrator atau coba lagi nanti.');
      } else if (error.message?.includes('Signups not allowed for otp')) {
        console.error('📛 Signup disabled for OTP');
        toast.error('Pendaftaran akun baru sedang dinonaktifkan. Silakan hubungi administrator atau gunakan akun yang sudah ada.');
      } else if (error.message?.includes('captcha verification process failed')) {
        toast.error('Verifikasi CAPTCHA gagal. Silakan refresh halaman dan coba lagi.');
      } else if (error.message?.includes('email rate limit exceeded') ||
                  error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.');
      } else if (error.message?.includes('Invalid email')) {
        toast.error('Format email tidak valid');
      } else if (error.message?.includes('User not found')) {
        toast.error('Email tidak terdaftar dalam sistem. Silakan hubungi administrator untuk mendaftarkan akun Anda.');
      } else {
        toast.error(error.message || 'Gagal mengirim kode verifikasi');
      }
      return false;
    }

    console.log('✅ OTP sent successfully');
    toast.success('Kode verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    return true;
  } catch (error) {
    console.error('📛 Unexpected error in sendEmailOtp:', error);
    toast.error('Terjadi kesalahan jaringan. Silakan periksa koneksi internet Anda.');
    return false;
  }
};

/**
 * ✅ IMPROVED: Better OTP verification with retry logic
 */
export const verifyEmailOtp = async (email: string, token: string): Promise<boolean> => {
  try {
    // Validate inputs
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    // Clean token (remove spaces, convert to uppercase if needed)
    const cleanToken = token.replace(/\s/g, '').toUpperCase();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: 'email'
    });
    
    if (error) {
      console.error('OTP verification error:', error);
      
      // ✅ IMPROVED: More specific error messages
      if (error.message?.includes('expired')) {
        toast.error('Kode OTP sudah kadaluarsa. Silakan minta kode baru.');
      } else if (error.message?.includes('invalid') || error.message?.includes('wrong')) {
        toast.error('Kode OTP tidak valid. Silakan periksa kembali.');
      } else if (error.message?.includes('too many attempts')) {
        toast.error('Terlalu banyak percobaan. Silakan minta kode baru.');
      } else {
        toast.error(error.message || 'Verifikasi gagal. Silakan coba lagi.');
      }
      return false;
    }
    
    // Check if session was created
    if (data.session && data.user) {
      toast.success('Login berhasil! Selamat datang.');
      
      // ✅ NEW: Auto-link payments after successful login
      setTimeout(async () => {
        try {
          await autoLinkUserPayments();
        } catch (linkError) {
          console.error('Auto-link payments failed after OTP verification:', linkError);
        }
      }, 1000);
      
      return true;
    } else {
      console.warn('OTP verified but no session created:', data);
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    toast.error('Terjadi kesalahan jaringan saat verifikasi');
    return false;
  }
};

/**
 * ✅ MAGIC LINK: Handle magic link callback after user clicks link in email
 */
export const handleMagicLinkCallback = async (code: string) => {
  try {
    console.log('[AuthService] Processing magic link callback...');
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[AuthService] Magic link callback error:', error);
      throw error;
    }
    
    if (data.session && data.user) {
      console.log('[AuthService] Magic link authentication successful:', data.user.email);
      toast.success('Login berhasil! Selamat datang.');
      
      // ✅ NEW: Auto-link payments after successful magic link
      setTimeout(async () => {
        try {
          await autoLinkUserPayments();
        } catch (linkError) {
          console.error('Auto-link payments failed after magic link:', linkError);
        }
      }, 1000);
      
      return { session: data.session, user: data.user };
    }
    
    throw new Error('No session created from magic link');
  } catch (error) {
    console.error('[AuthService] Error in magic link callback:', error);
    throw error;
  }
};

/**
 * ✅ NEW: Check if user exists before attempting OTP
 */
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    // Try to send OTP with shouldCreateUser: false
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        channel: 'email',
        shouldCreateUser: false,
      },
    });

    // If no error, user exists
    if (!error) {
      return true;
    }

    // If "User not found" error, user doesn't exist
    if (error.message?.includes('User not found')) {
      return false;
    }

    // For other errors, assume user might exist
    console.warn('Unclear user existence check:', error);
    return true;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false; // Assume user doesn't exist on error
  }
};

/**
 * Memeriksa apakah pengguna saat ini terotentikasi.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
    
    return !!session && !!session.user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * ✅ IMPROVED: Better session handling
 */
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

/**
 * ✅ Get current user
 */
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

/**
 * ✅ Sign out pengguna saat ini
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AuthService] Sign out error:', error);
      toast.error('Gagal logout');
      return false;
    }
    
    // Cleanup auth state after signout
    try {
      cleanupAuthState();
    } catch (cleanupError) {
      console.warn('Cleanup after signout failed:', cleanupError);
    }
    
    toast.success('Logout berhasil');
    return true;
  } catch (error) {
    console.error('[AuthService] Error in signOut:', error);
    toast.error('Terjadi kesalahan saat logout');
    return false;
  }
};

/**
 * ✅ Listen to auth state changes
 */
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[AuthService] Auth state changed:', event, session?.user?.email);
    callback(event, session);
  });
  
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * ✅ Check if user has valid session
 */
export const hasValidSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AuthService] Session check error:', error);
      return false;
    }
    
    return !!session && !isSessionExpired(session);
  } catch (error) {
    console.error('[AuthService] Error checking session:', error);
    return false;
  }
};

/**
 * ✅ Check if session is expired
 */
const isSessionExpired = (session: Session): boolean => {
  if (!session.expires_at) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at < now;
};

/**
 * ✅ Refresh current session if needed
 */
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

/**
 * ✅ NEW: Helper function to check if user needs to verify email
 */
export const checkEmailVerificationStatus = async (): Promise<{
  isVerified: boolean;
  needsVerification: boolean;
}> => {
  try {
    const session = await getCurrentSession();
    
    if (!session || !session.user) {
      return { isVerified: false, needsVerification: false };
    }
    
    const isVerified = !!session.user.email_confirmed_at;
    const needsVerification = !isVerified && !!session.user.email;
    
    return { isVerified, needsVerification };
  } catch (error) {
    console.error('Error checking email verification:', error);
    return { isVerified: false, needsVerification: false };
  }
};

// ========================================
// ✅ NEW: PAYMENT INTEGRATION FUNCTIONS
// ========================================

/**
 * ✅ NEW: Link payment to user by Order ID
 */
export const linkPaymentToUser = async (orderId: string, user: any): Promise<any> => {
  try {
    // Find payment by order_id
    const { data: payment, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (findError || !payment) {
      throw new Error('Order ID tidak ditemukan. Silakan periksa kembali.');
    }

    if (payment.user_id && payment.user_id !== user.id) {
      throw new Error('Order ini sudah terhubung dengan akun lain.');
    }

    // Link payment to current user
    const { data: updatedPayment, error: updateError } = await supabase
      .from('user_payments')
      .update({
        user_id: user.id,
        email: user.email
      })
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error('Gagal menghubungkan order. Silakan coba lagi.');
    }

    toast.success('Order berhasil terhubung dengan akun Anda!');
    return updatedPayment;
  } catch (error: any) {
    console.error('Error linking payment to user:', error);
    toast.error(error.message);
    throw error;
  }
};

/**
 * ✅ NEW: Auto-link unlinked payments for user after login
 */
export const autoLinkUserPayments = async (): Promise<number> => {
  try {
    const user = await getCurrentUser();
    if (!user?.email) return 0;

    // Find unlinked payments for this email (within last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: unlinkedPayments, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .is('user_id', null)
      .eq('is_paid', true) // Only link successful payments
      .gte('created_at', last24Hours)
      .or(`email.eq.${user.email},email.eq.unlinked@payment.com`);

    if (findError || !unlinkedPayments || unlinkedPayments.length === 0) {
      return 0;
    }

    // Link payments to user
    const { error: updateError } = await supabase
      .from('user_payments')
      .update({
        user_id: user.id,
        email: user.email
      })
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

/**
 * ✅ NEW: Check if user has any unlinked payments
 */
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

    return {
      hasUnlinked: (unlinkedPayments?.length || 0) > 0,
      count: unlinkedPayments?.length || 0
    };
  } catch (error) {
    console.error('Error checking unlinked payments:', error);
    return { hasUnlinked: false, count: 0 };
  }
};

/**
 * ✅ NEW: Get user's payment status
 */
export const getUserPaymentStatus = async (): Promise<{
  isPaid: boolean;
  paymentRecord: any | null;
  needsLinking: boolean;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { isPaid: false, paymentRecord: null, needsLinking: false };
    }

    // Check for linked payments first
    const { data: linkedPayments, error: linkedError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!linkedError && linkedPayments && linkedPayments.length > 0) {
      return {
        isPaid: true,
        paymentRecord: linkedPayments[0],
        needsLinking: false
      };
    }

    // Check for unlinked payments by email
    const { data: unlinkedPayments, error: unlinkedError } = await supabase
      .from('user_payments')
      .select('*')
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .or(`email.eq.${user.email},email.eq.unlinked@payment.com`)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!unlinkedError && unlinkedPayments && unlinkedPayments.length > 0) {
      return {
        isPaid: true,
        paymentRecord: unlinkedPayments[0],
        needsLinking: true
      };
    }

    return { isPaid: false, paymentRecord: null, needsLinking: false };
  } catch (error) {
    console.error('Error getting user payment status:', error);
    return { isPaid: false, paymentRecord: null, needsLinking: false };
  }
};

/**
 * ✅ NEW: Enhanced auth state change handler with payment linking
 */
export const onAuthStateChangeWithPaymentLinking = (
  callback: (event: string, session: Session | null) => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[AuthService] Auth state changed:', event, session?.user?.email);
    
    // Auto-link payments when user signs in
    if (event === 'SIGNED_IN' && session?.user) {
      setTimeout(async () => {
        try {
          await autoLinkUserPayments();
        } catch (error) {
          console.error('Auto-link payments failed:', error);
        }
      }, 1000); // Wait 1 second after sign in
    }
    
    callback(event, session);
  });
  
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * ✅ NEW: Verify order exists before showing popup
 */
export const verifyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const { data: payment, error } = await supabase
      .from('user_payments')
      .select('id')
      .eq('order_id', orderId)
      .single();

    return !error && !!payment;
  } catch (error) {
    console.error('Error verifying order:', error);
    return false;
  }
};

/**
 * ✅ NEW: Get recent orders for auto-suggestion
 */
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

    if (error || !payments) return [];

    return payments.map(p => p.order_id).filter(Boolean);
  } catch (error) {
    console.error('Error getting recent orders:', error);
    return [];
  }
};

// Export supabase client untuk penggunaan langsung jika diperlukan
export { supabase };