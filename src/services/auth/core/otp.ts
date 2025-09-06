// src/services/auth/core/otp.ts - Simple OTP authentication
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { validateEmail, getErrorMessage } from '@/services/auth/utils';


export const sendEmailOtp = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true,
  skipCaptcha: boolean = false
): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    logger.api('/auth/otp', 'Sending OTP to:', { email, allowSignup, skipCaptcha });
    
    const otpOptions: any = {
      shouldCreateUser: allowSignup,
    };
    
    // No captcha validation - simple OTP authentication
    logger.debug('Proceeding with OTP send (no captcha validation)');

    console.log('🔧 [DEBUG] Sending OTP request to Supabase:', {
      email,
      otpOptions,
      skipCaptcha,
      captchaToken: captchaToken ? 'HAS_TOKEN' : 'NO_TOKEN'
    });
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: otpOptions,
    });
    
    console.log('🔧 [DEBUG] Supabase OTP response:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.status,
      errorDetails: error
    });

    if (error) {
      logger.error('OTP send error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Signups not allowed') && allowSignup) {
        logger.info('Signup disabled, trying existing users only...');
        toast.info('Mencoba untuk pengguna terdaftar...');
        return await sendEmailOtp(email, captchaToken, false, skipCaptcha);
      }
      
      // Handle 500 Internal Server Error
      if (error.status === 500 || error.message?.includes('500')) {
        logger.error('Supabase 500 error - possible configuration issue');
        toast.error('Server error: Periksa konfigurasi Supabase (CAPTCHA harus dinonaktifkan)');
        return false;
      }
      
      // Handle rate limiting
      if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('too many')) {
        toast.error('Terlalu banyak permintaan. Tunggu beberapa menit sebelum mencoba lagi.');
        return false;
      }
      
      // Handle CAPTCHA-related errors
      if (error.message?.includes('captcha') || error.message?.includes('CAPTCHA')) {
        toast.error('Error CAPTCHA: Pastikan CAPTCHA dinonaktifkan di Supabase dashboard.');
        return false;
      }
      
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
      return false;
    }

    logger.success('OTP sent successfully:', { hasData: !!data });
    toast.success('Kode OTP telah dikirim ke email Anda');
    return true;
    
  } catch (error) {
    logger.error('Unexpected error in sendEmailOtp:', error);
    toast.error('Terjadi kesalahan jaringan');
    return false;
  }
};

export const verifyEmailOtp = async (
  email: string, 
  token: string
): Promise<boolean | 'expired' | 'rate_limited'> => {
  try {
    if (!email || !token) {
      toast.error('Email dan kode OTP harus diisi');
      return false;
    }

    const cleanToken = token
      .replace(/\s/g, '')
      .replace(/[^0-9A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 6);

    if (cleanToken.length !== 6) {
      toast.error('Kode OTP harus 6 karakter');
      return false;
    }

    logger.debug('Verifying OTP:', { email, tokenLength: cleanToken.length });
    const startTime = Date.now();
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: cleanToken,
      type: 'email',
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      logger.error('OTP verification error:', error);
      
      const errorMsg = error.message?.toLowerCase() || '';
      
      if (errorMsg.includes('expired') || errorMsg.includes('token has expired')) {
        toast.error('Kode OTP sudah kadaluarsa. Silakan minta kode baru.');
        return 'expired';
      }
      
      if (errorMsg.includes('too many attempts')) {
        toast.error('Terlalu banyak percobaan. Silakan minta kode baru.');
        return 'rate_limited';
      }
      
      if (errorMsg.includes('invalid')) {
        toast.error('Kode OTP tidak valid. Silakan periksa kembali.');
        return false;
      }
      
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return false;
    }
    
    if (data.session && data.user) {
      logger.success('OTP verified successfully:', {
        userId: data.user.id,
        email: data.user.email,
        duration: `${duration}ms`
      });
      
      // ✅ CRITICAL: Session is now created by Supabase
      // AuthContext onAuthStateChange will automatically pick up this session
      // No need to manually manage session state here
      
      logger.debug('[OTP] Verification successful, AuthContext will detect session change');
      
      toast.success('Login berhasil!');
      return true;
    } else {
      logger.warn('OTP verified but no session created');
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
    
  } catch (error) {
    logger.error('Unexpected error in verifyEmailOtp:', error);
    toast.error('Terjadi kesalahan jaringan saat verifikasi');
    return false;
  }
};