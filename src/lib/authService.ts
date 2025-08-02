// src/services/authService.ts
// 🎯 SIMPLE EMAIL OTP AUTH + VERIFICATION COMPONENT

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/lib/authUtils';
import { Session } from '@supabase/supabase-js';
import { Mail, Lock, RefreshCw, AlertCircle } from 'lucide-react';

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
 * 📧 EMAIL VERIFICATION COMPONENT
 */
interface EmailVerificationPageProps {
  email?: string;
  onVerifySuccess?: () => void;
  onBackToLogin?: () => void;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  email = 'kalkulatorhppbymonifine@gmail.com',
  onVerifySuccess,
  onBackToLogin
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.toUpperCase();
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields filled
    if (newOtp.every(digit => digit !== '') && !isVerifying) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\s/g, '').toUpperCase();
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('').slice(0, 6);
      setOtp(newOtp);
      setError('');
      
      if (!isVerifying) {
        handleVerifyOtp(newOtp.join(''));
      }
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const success = await verifyEmailOtp(email, otpCode);
      
      if (success) {
        onVerifySuccess?.();
      } else {
        setError('Kode OTP tidak valid. Silakan coba lagi.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Terjadi kesalahan saat verifikasi. Silakan coba lagi.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError('');

    try {
      const success = await sendEmailOtp(email);
      
      if (success) {
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mengirim ulang kode.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 text-center mb-2">Sistem HPP</h1>
          <p className="text-gray-600 text-center text-sm">Hitung Harga Pokok Penjualan dengan mudah</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Email Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-600" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-2">
            Cek Email Anda
          </h2>

          {/* Description */}
          <div className="text-center text-gray-600 mb-6">
            <p className="mb-2">
              Kami telah mengirim kode verifikasi ke
            </p>
            <p className="font-semibold text-gray-800 mb-4">{email}.</p>
            <p className="text-sm">
              Silakan cek kotak masuk atau folder spam Anda dan masukkan kode 6 digit di bawah ini:
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* OTP Input */}
          <div className="flex justify-center space-x-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9A-Z]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-10 h-10 text-center text-lg font-medium border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerifyOtp(otp.join(''))}
            disabled={otp.some(digit => digit === '') || isVerifying}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Memverifikasi...
              </div>
            ) : (
              'Verifikasi Kode'
            )}
          </button>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Tips:</strong> Kode akan expired dalam 5 menit. Jika tidak menerima email, coba kirim ulang.
            </p>
          </div>

          {/* Resend */}
          <div className="text-center mb-4">
            {canResend ? (
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="text-blue-600 hover:text-blue-700 text-sm focus:outline-none disabled:opacity-50"
              >
                {isResending ? 'Mengirim ulang...' : 'Kirim Ulang Kode'}
              </button>
            ) : (
              <span className="text-gray-500 text-sm">
                Kirim ulang dalam {countdown} detik
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="text-center">
            <span className="text-gray-500 text-sm mr-1">Butuh bantuan?</span>
            <button
              onClick={onBackToLogin}
              className="text-blue-600 hover:text-blue-700 text-sm focus:outline-none"
            >
              Hubungi admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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