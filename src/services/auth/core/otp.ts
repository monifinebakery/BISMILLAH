// src/services/auth/core/otp.ts - Simple OTP authentication
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '../utils';
import { toast } from 'sonner';
import { safeStorageSet } from '@/utils/auth/safeStorage'; // ✅ FIX: Thread-safe storage


export const sendEmailOtp = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true,
  skipCaptcha: boolean = true
): Promise<boolean> => {
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    logger.api('/auth/otp', 'Sending OTP to:', { email, allowSignup, skipCaptcha });
    
    // 🕐 Add more generous OTP timeout settings
    const otpOptions: Record<string, unknown> = {
      shouldCreateUser: allowSignup,
      // Try to increase OTP validity (though this might be server-side config)
      data: {
        otpType: 'email',
        requestedAt: new Date().toISOString()
      }
    };
    
    console.log('🕐 [DEBUG] Sending OTP request to Supabase:', {
      email,
      otpOptions,
      timestamp: new Date().toISOString(),
      localTime: new Date().toLocaleString('id-ID')
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
        // ✅ FIXED: Add delay to prevent rapid retry which can trigger rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await sendEmailOtp(email, null, false, true);
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
    
    // 🕐 Add detailed timing info for debugging
    console.log('🕐 [DEBUG] OTP Verification Request:', {
      email,
      token: cleanToken,
      requestTime: new Date().toISOString(),
      localTime: new Date().toLocaleString('id-ID'),
      timestamp: startTime
    });
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: cleanToken,
      type: 'email',
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('🕐 [DEBUG] OTP Verification Response:', {
      duration: `${duration}ms`,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.status,
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      responseTime: new Date().toISOString()
    });
    
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
        duration: `${duration}ms`,
        sessionExpiresAt: data.session.expires_at,
        accessToken: data.session.access_token ? 'present' : 'missing'
      });
      
      // ✅ ENHANCED: Verify session is properly created and valid
      if (!data.session.access_token || !data.user.id) {
        logger.error('OTP verified but session is incomplete:', {
          hasAccessToken: !!data.session.access_token,
          hasUserId: !!data.user.id,
          userId: data.user.id
        });
        toast.error('Sesi tidak lengkap. Silakan coba login ulang.');
        return false;
      }
      
      // ✅ CRITICAL: Session is now created by Supabase
      // AuthContext onAuthStateChange will automatically pick up this session
      // No need to manually manage session state here
      
      logger.debug('[OTP] Verification successful, AuthContext will detect session change');
      
      // ✅ CRITICAL: Set otpVerifiedAt flag for AuthGuard session handling
      try {
        await safeStorageSet('otpVerifiedAt', Date.now().toString()); // ✅ FIX: Thread-safe set
        if (import.meta.env.DEV) {
          console.log('🔑 [OTP] Set otpVerifiedAt flag for session persistence');
        }
      } catch (storageError) {
        logger.warn('Failed to set otpVerifiedAt flag:', storageError);
      }
      
      // ✅ CRITICAL: Trigger payment status refresh after successful login
      try {
        // Dispatch custom event to trigger payment refresh
        window.dispatchEvent(new CustomEvent('auth-refresh-request', {
          detail: { reason: 'otp_verification_success', timestamp: Date.now() }
        }));
        if (import.meta.env.DEV) {
          console.log('🔄 [OTP] Triggered payment refresh after login');
        }
      } catch (eventError) {
        logger.warn('Failed to trigger payment refresh:', eventError);
      }
      
      // ✅ ENHANCED: Force a small delay to ensure session is fully committed
      await new Promise(resolve => setTimeout(resolve, 300)); // Increased delay for payment sync
      
      toast.success('Login berhasil!');
      return true;
    } else {
      // Even if no session is returned, if there's no error, consider it successful
      // This can happen with Supabase's auth flow
      logger.warn('OTP verified but no session/user in response - checking current session', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        dataKeys: Object.keys(data || {})
      });
      
      // Check current session to verify login success
      try {
        const { data: currentSessionData, error: sessionError } = await supabase.auth.getSession();
        if (currentSessionData?.session?.user && !sessionError) {
          logger.success('Confirmed login success via session check');
          
          // ✅ CRITICAL: Set otpVerifiedAt flag for AuthGuard session handling
          try {
            await safeStorageSet('otpVerifiedAt', Date.now().toString()); // ✅ FIX: Thread-safe set
            if (import.meta.env.DEV) {
              console.log('🔑 [OTP] Set otpVerifiedAt flag via session check');
            }
          } catch (storageError) {
            logger.warn('Failed to set otpVerifiedAt flag:', storageError);
          }
          
          toast.success('Login berhasil!');
          return true;
        }
      } catch (sessionCheckError) {
        logger.error('Error checking current session:', sessionCheckError);
      }
      
      toast.error('Verifikasi berhasil tetapi sesi tidak dibuat. Silakan coba login ulang.');
      return false;
    }
    
  } catch (error) {
    logger.error('Unexpected error in verifyEmailOtp:', error);
    toast.error('Terjadi kesalahan jaringan saat verifikasi');
    return false;
  }
};