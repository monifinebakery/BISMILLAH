import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils'; // Pastikan utilitas ini masih relevan
import { Session } from '@supabase/supabase-js';

// Tentukan URL redirect berdasarkan environment
const getRedirectUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/'; // URL lokal Anda
  }
  // Untuk produksi, gunakan subdomain utama aplikasi Anda
  return 'https://app.monifine.my.id/';
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

      // Tangani error rate limit spesifik
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
 * Mengirim kode OTP ke alamat email yang diberikan.
 * @param email Alamat email untuk mengirim OTP.
 * @returns Promise yang mengembalikan boolean (true jika berhasil, false jika gagal).
 */
export const sendEmailOtp = async (email: string): Promise<boolean> => {
  try {
    // Membersihkan state otentikasi yang ada terlebih dahulu untuk mencegah konflik
    cleanupAuthState();

    const { error } = await supabase.auth.signInWithOtp({
      email
    });

    if (error) {
      console.error('Email OTP error:', error);

      // Tangani error rate limit spesifik
      if (error.message?.includes('email rate limit exceeded') ||
          error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam beberapa menit.');
      } else {
        toast.error(error.message || 'Gagal mengirim kode OTP');
      }
      return false;
    }

    toast.success('Kode OTP telah dikirim ke email Anda');
    return true;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    toast.error('Terjadi kesalahan saat mengirim kode OTP');
    return false;
  }
};

/**
 * Verifikasi kode OTP yang dikirim ke email.
 * @param email Email yang digunakan untuk mengirim OTP.
 * @param token Kode OTP yang diterima pengguna.
 * @returns Promise yang mengembalikan boolean (true jika berhasil, false jika gagal).
 */
export const verifyEmailOtp = async (email: string, token: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    if (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Kode OTP tidak valid');
      return false;
    }
    
    if (data.session) {
      toast.success('Login berhasil');
      return true;
    } else {
      toast.error('Gagal verifikasi OTP');
      return false;
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    toast.error('Terjadi kesalahan saat verifikasi kode OTP');
    return false;
  }
};

/**
 * Memeriksa apakah pengguna saat ini terotentikasi.
 * @returns Promise yang mengembalikan boolean yang menunjukkan apakah pengguna terotentikasi.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
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
