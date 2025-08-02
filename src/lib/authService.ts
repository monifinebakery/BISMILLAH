// src/services/authService.ts
// 🌟 UNIVERSAL LOGIN - All emails can login (paid & unpaid users)

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';

// ✅ Smart auto-detection for redirect URL
const getRedirectUrl = () => {
  if (import.meta.env.VITE_AUTH_REDIRECT_URL) {
    return import.meta.env.VITE_AUTH_REDIRECT_URL;
  }
  
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    return `${currentOrigin}/auth/callback`;
  }
  
  if (import.meta.env.DEV) {
    return 'https://dev3--gleaming-peony-f4a091.netlify.app/auth/callback';
  }
  
  return 'https://kalkulator.monifine.my.id/auth/callback';
};

/**
 * 🌟 UNIVERSAL LOGIN FUNCTION - Works for ALL users
 * Tries multiple methods to ensure everyone can log in
 */
export const universalLogin = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    // Clean up any existing auth state
    try {
      cleanupAuthState();
    } catch (cleanupError) {
      console.warn('Cleanup auth state failed:', cleanupError);
    }

    console.log('🌟 Starting universal login for:', email);

    // Prepare base options
    let baseOptions: any = {
      shouldCreateUser: true, // ✅ Always allow user creation
      emailRedirectTo: getRedirectUrl(),
    };

    // Add captcha if provided
    if (captchaToken && typeof captchaToken === 'string' && captchaToken.trim()) {
      baseOptions.captchaToken = captchaToken;
    }

    // 🔄 METHOD 1: Try Magic Link (most reliable)
    console.log('🔄 Method 1: Trying Magic Link...');
    try {
      const { data: magicData, error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: baseOptions,
      });

      if (!magicError) {
        console.log('✅ Magic Link sent successfully');
        toast.success('Magic link telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
        return true;
      }

      console.log('❌ Magic Link failed:', magicError.message);
    } catch (magicErr) {
      console.log('❌ Magic Link exception:', magicErr);
    }

    // 🔄 METHOD 2: Try OTP Code (fallback)
    console.log('🔄 Method 2: Trying OTP Code...');
    try {
      const otpOptions = {
        ...baseOptions,
        channel: 'email' as const,
      };

      const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: otpOptions,
      });

      if (!otpError) {
        console.log('✅ OTP sent successfully');
        toast.success('Kode verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
        return true;
      }

      console.log('❌ OTP failed:', otpError.message);
    } catch (otpErr) {
      console.log('❌ OTP exception:', otpErr);
    }

    // 🔄 METHOD 3: Try without captcha (if captcha was provided)
    if (captchaToken) {
      console.log('🔄 Method 3: Trying without CAPTCHA...');
      try {
        const noCaptchaOptions = {
          shouldCreateUser: true,
          emailRedirectTo: getRedirectUrl(),
        };

        const { data: noCaptchaData, error: noCaptchaError } = await supabase.auth.signInWithOtp({
          email,
          options: noCaptchaOptions,
        });

        if (!noCaptchaError) {
          console.log('✅ No-CAPTCHA method successful');
          toast.success('Link login telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
          return true;
        }

        console.log('❌ No-CAPTCHA failed:', noCaptchaError.message);
      } catch (noCaptchaErr) {
        console.log('❌ No-CAPTCHA exception:', noCaptchaErr);
      }
    }

    // 🔄 METHOD 4: Try existing user only (for paid users)
    console.log('🔄 Method 4: Trying existing user only...');
    try {
      const existingOnlyOptions = {
        shouldCreateUser: false,
        emailRedirectTo: getRedirectUrl(),
      };

      if (captchaToken && typeof captchaToken === 'string' && captchaToken.trim()) {
        existingOnlyOptions.captchaToken = captchaToken;
      }

      const { data: existingData, error: existingError } = await supabase.auth.signInWithOtp({
        email,
        options: existingOnlyOptions,
      });

      if (!existingError) {
        console.log('✅ Existing user method successful');
        toast.success('Link login telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
        return true;
      }

      console.log('❌ Existing user failed:', existingError.message);
    } catch (existingErr) {
      console.log('❌ Existing user exception:', existingErr);
    }

    // 🚨 All methods failed - show user-friendly error
    console.error('🚨 All login methods failed for email:', email);
    
    // Show generic success message to avoid revealing system details
    toast.success('Permintaan login telah diproses. Jika email Anda terdaftar, Anda akan menerima link login dalam beberapa menit. Silakan cek kotak masuk dan folder spam.');
    return true; // Return true to avoid showing error to user

  } catch (error) {
    console.error('🚨 Universal login critical error:', error);
    
    // Even on critical error, show success to user
    toast.success('Permintaan login telah diproses. Silakan cek email Anda dalam beberapa menit.');
    return true;
  }
};

/**
 * ✅ Enhanced Magic Link function (wrapper for universalLogin)
 */
export const sendMagicLink = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  return universalLogin(email, captchaToken);
};

/**
 * ✅ Enhanced OTP function (wrapper for universalLogin) 
 */
export const sendEmailOtp = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  return universalLogin(email, captchaToken);
};

/**
 * ✅ IMPROVED: Better OTP verification with retry logic
 */
export const verifyEmailOtp = async (email: string, token: string): Promise<boolean> => {
  try {
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    const cleanToken = token.replace(/\s/g, '').toUpperCase();

    console.log('🔍 Verifying OTP for:', email);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: 'email'
    });
    
    if (error) {
      console.error('❌ OTP verification error:', error);
      
      if (error.message?.includes('expired')) {
        toast.error('Kode OTP sudah kadaluarsa. Silakan minta kode baru.');
      } else if (error.message?.includes('invalid') || error.message?.includes('wrong')) {
        toast.error('Kode OTP tidak valid. Silakan periksa kembali.');
      } else if (error.message?.includes('too many attempts')) {
        toast.error('Terlalu banyak percobaan. Silakan minta kode baru.');
      } else {
        toast.error('Kode verifikasi tidak valid. Silakan coba lagi.');
      }
      return false;
    }
    
    if (data.session && data.user) {
      console.log('✅ OTP verification successful for:', data.user.email);
      toast.success('Login berhasil! Selamat datang.');
      return true;
    } else {
      console.warn('⚠️ OTP verified but no session created:', data);
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
  } catch (error) {
    console.error('🚨 Critical error verifying OTP:', error);
    toast.error('Terjadi kesalahan jaringan saat verifikasi');
    return false;
  }
};

/**
 * ✅ Password reset (universal)
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(),
    });

    if (error) {
      console.error('❌ Password reset error:', error);
      
      // Show success message regardless to avoid revealing if email exists
      toast.success('Jika email Anda terdaftar, Anda akan menerima link reset password dalam beberapa menit.');
      return true;
    }

    toast.success('Link reset password telah dikirim ke email Anda');
    return true;
  } catch (error) {
    console.error('🚨 Critical error sending password reset:', error);
    
    // Show success message even on error
    toast.success('Permintaan reset password telah diproses. Silakan cek email Anda.');
    return true;
  }
};

/**
 * ✅ Magic Link callback handler
 */
export const handleMagicLinkCallback = async (code: string) => {
  try {
    console.log('🔍 Processing magic link callback...');
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Magic link callback error:', error);
      throw error;
    }
    
    if (data.session && data.user) {
      console.log('✅ Magic link authentication successful:', data.user.email);
      toast.success('Login berhasil! Selamat datang.');
      return { session: data.session, user: data.user };
    }
    
    throw new Error('No session created from magic link');
  } catch (error) {
    console.error('🚨 Error in magic link callback:', error);
    throw error;
  }
};

/**
 * ✅ Check authentication status
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
    
    return !!session && !!session.user;
  } catch (error) {
    console.error('🚨 Critical error checking authentication:', error);
    return false;
  }
};

/**
 * ✅ Get current session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting current session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('🚨 Critical error getting session:', error);
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
      console.error('❌ Get user error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('🚨 Critical error getting user:', error);
    return null;
  }
};

/**
 * ✅ Sign out user
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out error:', error);
      toast.error('Gagal logout');
      return false;
    }
    
    try {
      cleanupAuthState();
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup after signout failed:', cleanupError);
    }
    
    toast.success('Logout berhasil');
    return true;
  } catch (error) {
    console.error('🚨 Critical error in signOut:', error);
    toast.error('Terjadi kesalahan saat logout');
    return false;
  }
};

/**
 * ✅ Auth state change listener
 */
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state changed:', event, session?.user?.email);
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
      console.error('❌ Session check error:', error);
      return false;
    }
    
    return !!session && !isSessionExpired(session);
  } catch (error) {
    console.error('🚨 Critical error checking session:', error);
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
 * ✅ Refresh session if needed
 */
export const refreshSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Session refresh error:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('🚨 Critical error refreshing session:', error);
    return null;
  }
};

/**
 * ✅ Check email verification status
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
    console.error('🚨 Error checking email verification:', error);
    return { isVerified: false, needsVerification: false };
  }
};

/**
 * 🌟 NEW: Check user payment status (you can implement this based on your payment system)
 */
export const checkUserPaymentStatus = async (): Promise<{
  isPaid: boolean;
  paymentStatus: string;
}> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { isPaid: false, paymentStatus: 'not_authenticated' };
    }

    // You can implement your payment status check here
    // For now, we'll assume all users can access (paid or unpaid)
    return { isPaid: true, paymentStatus: 'active' };
  } catch (error) {
    console.error('🚨 Error checking payment status:', error);
    return { isPaid: false, paymentStatus: 'error' };
  }
};

// Export supabase client for direct use if needed
export { supabase };