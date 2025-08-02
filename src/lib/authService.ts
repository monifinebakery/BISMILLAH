// src/services/authService.ts

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
 * ✅ UPDATED: Better error handling and debugging for database issues
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

    // ✅ DEBUGGING: Try different approaches based on error
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
      } else if (error.message?.includes('captcha verification process failed')) {
        toast.error('Verifikasi CAPTCHA gagal. Silakan refresh halaman dan coba lagi.');
      } else if (error.message?.includes('email rate limit exceeded') ||
                  error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.');
      } else if (error.message?.includes('Invalid email')) {
        toast.error('Format email tidak valid');
      } else if (error.message?.includes('User not found')) {
        toast.error('Email tidak terdaftar dalam sistem');
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