// src/services/authService.ts
// 🎯 SIMPLE EMAIL OTP AUTH SERVICE

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
 * 🎯 SEND EMAIL OTP - Simple and reliable
 */
export const sendEmailOtp = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    // Clean up auth state
    try {
      cleanupAuthState();
    } catch (cleanupError) {
      console.warn('Cleanup auth state failed:', cleanupError);
    }

    console.log('📧 Sending email OTP to:', email);

    // Prepare OTP options
    let otpOptions: any = {
      channel: 'email',
      shouldCreateUser: true, // Allow new user creation
    };

    // Add captcha if provided
    if (captchaToken && typeof captchaToken === 'string' && captchaToken.trim()) {
      otpOptions.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: otpOptions,
    });

    if (error) {
      console.error('❌ Email OTP error:', error);
      
      // Still show success to user to avoid revealing system details
      toast.success('Kode verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
      return true; // Return true to proceed to verification page
    }

    console.log('✅ Email OTP sent successfully');
    toast.success('Kode verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    return true;

  } catch (error) {
    console.error('🚨 Critical error in sendEmailOtp:', error);
    
    // Show success even on error to avoid revealing system issues
    toast.success('Kode verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    return true;
  }
};

/**
 * ✅ VERIFY EMAIL OTP
 * Note: OTP expires in 10 minutes (configurable in Supabase Dashboard)
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
 * ✅ Password reset
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(),
    });

    if (error) {
      console.error('❌ Password reset error:', error);
    }

    // Always show success message
    toast.success('Jika email Anda terdaftar, Anda akan menerima link reset password dalam beberapa menit.');
    return true;
  } catch (error) {
    console.error('🚨 Critical error sending password reset:', error);
    toast.success('Permintaan reset password telah diproses. Silakan cek email Anda.');
    return true;
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

// Export supabase client for direct use if needed
export { supabase };