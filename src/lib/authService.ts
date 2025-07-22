// src/services/authService.ts

import { supabase } from '@/integrations/supabase/client'; // Pastikan path ini benar untuk client Supabase Anda
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils'; // Pastikan utilitas ini relevan dan sesuai tujuan
import { Session } from '@supabase/supabase-js';

// Tentukan URL redirect berdasarkan environment
const getRedirectUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'https://sync--gleaming-peony-f4a091.netlify.app/'; // URL lokal Anda untuk pengembangan
  }
  // Untuk produksi, gunakan subdomain utama aplikasi Anda yang sudah terdaftar di Supabase Auth Settings
  return 'https://kalkulator.monifine.my.id/';
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
 * Mengirim kode OTP ke alamat email yang diberikan.
 * Fungsi ini akan selalu mengirim OTP atau link konfirmasi, dan mengembalikan boolean sukses.
 * Pesan toast akan digeneralisasi karena UI akan selalu menampilkan input OTP.
 * @param email Alamat email untuk mengirim OTP.
 * @param captchaToken Token hCaptcha (opsional, bisa null jika captcha tidak diaktifkan).
 * @returns Promise yang mengembalikan boolean (true jika berhasil, false jika gagal).
 */
export const sendEmailOtp = async (email: string, captchaToken: string | null = null): Promise<boolean> => {
  try {
    // Pertimbangkan tujuan cleanupAuthState():
    // Jika tujuannya untuk menghapus sesi yang ada sebelum mengirim OTP login/daftar,
    // pastikan ini adalah perilaku yang diinginkan dan tidak mengganggu alur.
    // supabase.auth.signInWithOtp umumnya tidak memerlukan cleanup eksplisit.
    cleanupAuthState(); // Pastikan fungsi ini didefinisikan dan sesuai dengan kebutuhan Anda

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        channel: 'email',
        shouldCreateUser: true, // Rekomendasi: true agar pengguna baru bisa mendaftar/login dengan OTP
        captchaToken: captchaToken, // Meneruskan token hCaptcha ke Supabase
      },
    });

    if (error) {
      console.error('Email OTP error:', error);

      // Tingkatkan penanganan pesan error spesifik untuk captcha dan rate limit
      if (error.message?.includes('captcha verification process failed')) {
        toast.error('Verifikasi CAPTCHA gagal. Pastikan Anda bukan robot dan coba lagi.');
      } else if (error.message?.includes('email rate limit exceeded') ||
                  error.message?.includes('over_email_send_rate_limit')) {
        toast.error('Terlalu banyak permintaan email. Silakan coba lagi dalam beberapa menit.');
      } else {
        toast.error(error.message || 'Gagal mengirim kode'); // Pesan lebih umum
      }
      return false;
    }

    // Pesan sukses digeneralisasi karena UI akan selalu menampilkan input OTP
    toast.success('Kode atau link konfirmasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    
    return true;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    toast.error('Terjadi kesalahan saat mengirim kode'); // Pesan lebih umum
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
      type: 'email' // Tipe verifikasi adalah 'email'
    });
    
    if (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Kode tidak valid atau sudah kadaluarsa.'); // Pesan error lebih informatif
      return false;
    }
    
    // Periksa apakah sesi berhasil dibuat
    if (data.session) {
      toast.success('Login berhasil! Anda akan diarahkan.');
      // Di sini Anda bisa menambahkan logika redirect ke halaman dashboard atau halaman lain
      // Contoh: window.location.href = '/dashboard';
      return true;
    } else {
      // Kasus ini jarang, tapi bisa terjadi jika verifikasi teknis berhasil
      // tapi sesi pengguna tidak langsung terdeteksi atau dibuat.
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
