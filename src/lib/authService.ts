// src/services/authService.ts

import { supabase } from '@/integrations/supabase/client'; // Pastikan path ini benar untuk client Supabase Anda
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils'; // Pastikan utilitas ini relevan dan sesuai tujuan
import { Session } from '@supabase/supabase-js';

// Tentukan URL redirect berdasarkan environment
const getRedirectUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'https://sync--gleaming-peony-f4a091.netlify.app/auth/callback'; // URL callback untuk development
  }
  // Untuk produksi, gunakan subdomain utama aplikasi Anda yang sudah terdaftar di Supabase Auth Settings
  return 'https://kalkulator.monifine.my.id/auth/callback';
};

/**
 * Mengirim email reset password ke alamat email yang diberikan.
 * @param email Alamat email untuk mengirim link reset password.
 * @returns Promise yang mengembalikan boolean (true jika berhasil, false jika gagal).
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(), // Menggunakan fungsi dinamis
    });

    if (error) {
      console.error('Password reset error:', error);

      // Tangani error rate limit spesifik dari Supabase
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
 * Mengirim magic link ke alamat email yang diberikan.
 * Fungsi ini akan mengirim magic link untuk login/signup otomatis.
 * @param email Alamat email untuk mengirim magic link.
 * @param captchaToken Token hCaptcha (opsional, bisa null jika captcha tidak diaktifkan).
 * @returns Promise yang mengembalikan boolean (true jika berhasil, false jika gagal).
 */
export const sendMagicLink = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  try {
    console.log('[AuthService] Sending magic link to:', email);
    
    // Cleanup auth state sebelum mengirim magic link (opsional)
    cleanupAuthState(); // Pastikan fungsi ini didefinisikan dan sesuai dengan kebutuhan Anda

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Magic link akan redirect ke callback URL
        emailRedirectTo: getRedirectUrl(),
        shouldCreateUser: true, // Allow new user signup
        // Pass captcha token if provided
        ...(captchaToken && { captchaToken })
      },
    });

    if (error) {
      console.error('[AuthService] Magic link error:', error);

      // Handle specific error cases
      if (error.message?.includes('captcha verification process failed')) {
        toast.error('Verifikasi CAPTCHA gagal. Pastikan Anda bukan robot dan coba lagi.');
      } else if (error.message?.includes('email rate limit exceeded') ||
                  error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam beberapa menit.');
      } else if (error.message?.includes('invalid_email')) {
        toast.error('Alamat email tidak valid.');
      } else if (error.message?.includes('signup_disabled')) {
        toast.error('Pendaftaran akun baru sedang dinonaktifkan.');
      } else {
        toast.error(error.message || 'Gagal mengirim magic link');
      }
      return false;
    }

    console.log('[AuthService] Magic link sent successfully:', data);
    toast.success('Magic link telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    
    return true;
  } catch (error) {
    console.error('[AuthService] Error sending magic link:', error);
    toast.error('Terjadi kesalahan saat mengirim magic link');
    return false;
  }
};

/**
 * Legacy function untuk backward compatibility (will call sendMagicLink)
 * @deprecated Use sendMagicLink instead
 */
export const sendEmailOtp = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  console.warn('[AuthService] sendEmailOtp is deprecated, use sendMagicLink instead');
  return sendMagicLink(email, captchaToken);
};

/**
 * Verifikasi kode OTP yang dikirim ke email.
 * Note: Untuk magic link, verifikasi dilakukan otomatis saat user klik link.
 * Function ini tetap ada untuk backward compatibility.
 * @param email Email yang digunakan untuk mengirim OTP.
 * @param token Kode OTP yang diterima pengguna.
 * @returns Promise yang mengembalikan boolean (true jika berhasil, false jika gagal).
 */
export const verifyEmailOtp = async (email: string, token: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email' // Tipe verifikasi adalah 'email'
    });
    
    if (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Kode tidak valid atau sudah kadaluarsa.');
      return false;
    }
    
    // Periksa apakah sesi berhasil dibuat
    if (data.session) {
      toast.success('Login berhasil! Anda akan diarahkan.');
      return true;
    } else {
      toast.error('Verifikasi berhasil, tetapi sesi tidak ditemukan. Silakan coba login ulang.');
      return false;
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    toast.error('Terjadi kesalahan saat verifikasi kode');
    return false;
  }
};

/**
 * Handle magic link callback setelah user klik link di email
 * @param code Authorization code dari URL callback
 * @returns Promise yang mengembalikan data session atau error
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
      return { session: data.session, user: data.user };
    }
    
    throw new Error('No session created');
  } catch (error) {
    console.error('[AuthService] Error in magic link callback:', error);
    throw error;
  }
};

/**
 * Memeriksa apakah pengguna saat ini terotentikasi.
 * @returns Promise yang mengembalikan boolean yang menunjukkan apakah pengguna terotentikasi.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session; // Mengembalikan true jika ada sesi, false jika null
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Mendapatkan sesi saat ini.
 * @returns Promise yang mengembalikan sesi saat ini atau null.
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

/**
 * Mendapatkan user saat ini.
 * @returns Promise yang mengembalikan user saat ini atau null.
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
 * Sign out pengguna saat ini.
 * @returns Promise yang mengembalikan boolean (true jika berhasil, false jika gagal).
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
    cleanupAuthState();
    toast.success('Logout berhasil');
    return true;
  } catch (error) {
    console.error('[AuthService] Error in signOut:', error);
    toast.error('Terjadi kesalahan saat logout');
    return false;
  }
};

/**
 * Listen to auth state changes
 * @param callback Callback function untuk handle perubahan auth state
 * @returns Function untuk unsubscribe
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
 * Check if user has valid session
 * @returns Promise<boolean>
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
 * Check if session is expired
 * @param session Current session
 * @returns boolean
 */
const isSessionExpired = (session: Session): boolean => {
  if (!session.expires_at) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at < now;
};

/**
 * Refresh current session if needed
 * @returns Promise<Session | null>
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

// Export supabase client untuk penggunaan langsung jika diperlukan
export { supabase };