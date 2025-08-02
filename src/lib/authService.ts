// src/services/authService.ts - Fixed for Magic Link

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';

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
 * ✅ FIXED: Magic Link dengan proper handling untuk signup disabled
 */
export const sendMagicLink = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
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

    console.log('🔗 Sending magic link to:', email);

    // STRATEGY 1: Try for existing users first (shouldCreateUser: false)
    let options: any = {
      redirectTo: getRedirectUrl(),
      shouldCreateUser: false, // Try existing users first
    };

    // Add captcha token if available
    if (captchaToken && typeof captchaToken === 'string' && captchaToken.trim()) {
      options.captchaToken = captchaToken;
    }

    let { error } = await supabase.auth.signInWithOtp({
      email,
      options
    });

    // If user not found, try admin creation then magic link
    if (error && (error.message?.includes('User not found') || error.message?.includes('Invalid login'))) {
      console.log('🔗 User not found, trying admin user creation...');
      
      try {
        // Create user via admin API
        const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: false, // Don't auto-confirm, let magic link handle it
          password: Math.random().toString(36).slice(-12), // Random password
        });

        if (!adminError && adminUser.user) {
          console.log('✅ User created via admin API, sending magic link...');
          
          // Now send magic link to the created user
          const magicLinkResult = await supabase.auth.signInWithOtp({
            email,
            options: {
              redirectTo: getRedirectUrl(),
              shouldCreateUser: false, // User now exists
              ...(captchaToken && { captchaToken })
            }
          });
          
          error = magicLinkResult.error;
        } else {
          console.error('❌ Admin user creation failed:', adminError);
          // Fall back to password reset approach
          return await sendPasswordResetEmail(email);
        }
      } catch (adminErr) {
        console.error('❌ Admin API not available:', adminErr);
        // Fall back to password reset approach
        return await sendPasswordResetEmail(email);
      }
    }

    // Handle signup disabled error
    if (error && error.message?.includes('Signups not allowed')) {
      console.log('🔗 Signups disabled, trying password reset approach...');
      
      // Use password reset as alternative
      toast.info('Mengirim link login alternatif...');
      return await sendPasswordResetEmail(email);
    }

    if (error) {
      console.error('Magic link error:', error);
      
      if (error.message?.includes('captcha verification process failed')) {
        toast.error('Verifikasi CAPTCHA gagal. Silakan refresh halaman dan coba lagi.');
      } else if (error.message?.includes('email rate limit exceeded') ||
                  error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.');
      } else if (error.message?.includes('Invalid email')) {
        toast.error('Format email tidak valid');
      } else {
        toast.error(error.message || 'Gagal mengirim magic link');
      }
      return false;
    }

    toast.success('Link login telah dikirim ke email Anda. Silakan cek email dan klik link untuk masuk.');
    return true;
  } catch (error) {
    console.error('Error sending magic link:', error);
    toast.error('Terjadi kesalahan saat mengirim link login');
    return false;
  }
};

/**
 * ✅ MAIN FUNCTION: Use magic link (alias for compatibility)
 */
export const sendEmailOtp = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  return await sendMagicLink(email, captchaToken);
};

// Remove verifyEmailOtp since we're using magic links, not OTP codes
export const verifyEmailOtp = async (email: string, token: string): Promise<boolean> => {
  // This shouldn't be called for magic links, but keep for compatibility
  toast.error('Magic link tidak memerlukan kode verifikasi. Silakan cek email Anda dan klik link yang dikirim.');
  return false;
};

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