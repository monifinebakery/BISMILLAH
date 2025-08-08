// src/services/auth/config.ts
// Session cache configuration
export const CACHE_DURATION = 30000;

// Error messages mapping
export const ERROR_MESSAGES: Record<string, string> = {
  'Database error saving new user': 'Terjadi masalah database. Silakan hubungi administrator.',
  'Signups not allowed': 'Pendaftaran akun baru sedang dinonaktifkan.',
  'captcha verification process failed': 'Verifikasi CAPTCHA gagal. Silakan coba lagi.',
  'email rate limit exceeded': 'Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.',
  'over_email_send_rate_limit': 'Terlalu banyak permintaan email. Silakan coba lagi dalam 5 menit.',
  'Invalid email': 'Format email tidak valid',
  'User not found': 'Email tidak terdaftar dalam sistem.',
  'expired': 'Kode sudah kadaluarsa.',
  'invalid': 'Kode tidak valid.',
  'too many attempts': 'Terlalu banyak percobaan.',
  'token has expired or is invalid': 'Kode OTP sudah kadaluarsa.'
};