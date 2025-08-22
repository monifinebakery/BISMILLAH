// src/components/auth/EmailAuthPage.tsx - SIMPLIFIED OTP VERIFICATION
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ TAMBAHKAN INI
import { Mail, Lock, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp } from '@/services/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext'; // ✅ TAMBAHKAN INI

// ✅ Environment variables
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "3c246758-c42c-406c-b258-87724508b28a";
const HCAPTCHA_ENABLED = import.meta.env.VITE_HCAPTCHA_ENABLED !== 'false';

// ✅ Komponen hCaptcha yang dimuat secara dinamis
let HCaptcha: React.ComponentType<any> | null = null;


// ✅ Simplified Props Interface
interface EmailAuthPageProps {
  appName?: string;
  appDescription?: string;
  primaryColor?: string;
  supportEmail?: string;
  logoUrl?: string;
  onLoginSuccess?: () => void;
  redirectUrl?: string;
}

// ✅ Simplified Auth States
type AuthState = 'idle' | 'sending' | 'sent' | 'verifying' | 'error' | 'expired' | 'success';
type OtpResult = 'expired' | 'rate_limited' | 'invalid' | true;

const EmailAuthPage: React.FC<EmailAuthPageProps> = ({
  appName = 'Sistem HPP',
  appDescription = 'Masukkan email Anda dan kode OTP yang dikirim untuk login',
  primaryColor = 'from-orange-500 to-red-500',
  supportEmail = 'cs@monifinebakery.com',
  logoUrl,
  onLoginSuccess,
  redirectUrl = '/',
}) => {
  // ✅ Get triggerRedirectCheck from AuthContext
  const { triggerRedirectCheck } = useAuth();
  const navigate = useNavigate();
  
  // ✅ State Management
  const [email, setEmail] = useState('');
  // (removed duplicate state; see typed declaration below)
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [error, setError] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);

  // ✅ OTP state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

  // ✅ hCaptcha state
  const [hCaptchaToken, setHCaptchaToken] = useState<string | null>(null);
  const [hCaptchaKey, setHCaptchaKey] = useState(0);
  const [hCaptchaLoaded, setHCaptchaLoaded] = useState(false);
  const [hCaptchaLoadError, setHCaptchaLoadError] = useState(false);
  
  // ✅ Refs for OTP inputs, timer, and mounted state
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // ✅ Load hCaptcha dynamically with fallback
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (HCAPTCHA_ENABLED && !HCaptcha) {
      // Set a timeout to mark hCaptcha as loaded even if it fails (CSP workaround)
      timeoutId = setTimeout(() => {
        if (mountedRef.current && !hCaptchaLoaded) {
          logger.warn('hCaptcha failed to load, likely due to CSP. Proceeding without captcha.');
          setHCaptchaLoadError(true);
          setHCaptchaLoaded(true);
        }
      }, 5000); // 5 second timeout
      
      import('@hcaptcha/react-hcaptcha')
        .then((module) => {
          if (mountedRef.current) {
            clearTimeout(timeoutId);
            HCaptcha = module.default;
            setHCaptchaLoaded(true);
            setHCaptchaKey(1);
          }
        })
        .catch((error) => {
          logger.error('Failed to load hCaptcha:', error);
          if (mountedRef.current) {
            clearTimeout(timeoutId);
            setHCaptchaLoadError(true);
            setHCaptchaLoaded(true); // Still mark as loaded to proceed
          }
        });
    } else if (!HCAPTCHA_ENABLED) {
      setHCaptchaLoaded(true);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // ✅ Cleanup timer and set mounted state on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ✅ Simplified Cooldown Timer with mounted check
  const startCooldown = (seconds: number) => {
    if (!mountedRef.current) return;
    
    setCooldownTime(seconds);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        return;
      }
      
      setCooldownTime((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ✅ Reset Form State
  const resetForm = () => {
    if (!mountedRef.current) return;
    
    setOtp(['', '', '', '', '', '']);
    setError('');
    setAuthState('idle');
    resetHCaptcha();
  };

  // ✅ Reset hCaptcha
  const resetHCaptcha = () => {
    if (!mountedRef.current) return;
    
    if (HCAPTCHA_ENABLED && hCaptchaLoaded) {
      setHCaptchaToken(null);
      setHCaptchaKey(prev => prev + 1);
    }
  };

  // ✅ Simplified Email Validation
  const isValidEmail = (email: string) => {
    return email && email.includes('@') && email.length > 5;
  };

  // ✅ Check if form is valid
  const isFormValid = () => {
    const emailValid = isValidEmail(email);
    // If hCaptcha failed to load (likely due to CSP), don't require it
    const captchaValid = !HCAPTCHA_ENABLED || !hCaptchaLoaded || hCaptchaLoadError || hCaptchaToken;
    return emailValid && captchaValid;
  };

  // ✅ Handle Email Change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (authState !== 'idle') {
      resetForm();
    }
  };

  // ✅ Send OTP with mounted check
  const handleSendOtp = async () => {
    if (!mountedRef.current) return;
    
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }

    if (HCAPTCHA_ENABLED && hCaptchaLoaded && !hCaptchaLoadError && !hCaptchaToken) {
      toast.error('Harap selesaikan verifikasi captcha.');
      return;
    }

    setAuthState('sending');
    setError('');

    try {
      const success = await sendEmailOtp(
        email,
        HCAPTCHA_ENABLED ? hCaptchaToken : null,
        true,
        false
      );
      
      if (!mountedRef.current) return;
      
      if (success) {
        setAuthState('sent');
        startCooldown(60);
        toast.success('Kode OTP telah dikirim ke email Anda.');
        
        // Focus first OTP input
        setTimeout(() => {
          if (mountedRef.current) {
            inputRefs.current[0]?.focus();
          }
        }, 100);
      } else {
        setAuthState('error');
        setError('Gagal mengirim kode OTP. Silakan coba lagi.');
        startCooldown(30);
      }
    } catch (error) {
      logger.error('Error sending OTP:', error);
      if (mountedRef.current) {
        setAuthState('error');
        setError('Terjadi kesalahan saat mengirim kode OTP.');
        startCooldown(30);
      }
    }
  };

  // ✅ Resend OTP with mounted check
  const handleResendOtp = async () => {
    if (!mountedRef.current) return;
    
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }

    setAuthState('sending');
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      const success = await sendEmailOtp(
        email,
        null,
        true,
        true
      );
      
      if (!mountedRef.current) return;
      
      if (success) {
        setAuthState('sent');
        startCooldown(60);
        toast.success('Kode OTP baru telah dikirim.');
        inputRefs.current[0]?.focus();
      } else {
        setAuthState('error');
        setError('Gagal mengirim ulang kode OTP.');
        startCooldown(30);
      }
    } catch (error) {
      logger.error('Error resending OTP:', error);
      if (mountedRef.current) {
        setAuthState('error');
        setError('Terjadi kesalahan saat mengirim ulang kode OTP.');
        startCooldown(30);
      }
    }
  };

  // ✅ Handle OTP Input Change
  const handleOtpChange = (index: number, value: string) => {
    if (!mountedRef.current) return;
    
    // Only allow single character
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.toUpperCase();
    setOtp(newOtp);
    setError('');
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ✅ Handle Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ✅ Handle Paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\s/g, '').toUpperCase();
    
    if (pastedData.length === 6 && /^[0-9A-Z]{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
    }
  };

  // ✅ SIMPLIFIED: Verify OTP - Let AuthGuard handle redirection completely
  const handleVerifyOtp = async () => {
    if (!mountedRef.current) return;
    
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    setAuthState('verifying');
    setError('');

    try {
      logger.debug('EmailAuth: Starting OTP verification...');
      const result = await verifyEmailOtp(email, otpCode) as OtpResult;
      
      if (!mountedRef.current) return;
      
      if (result === true) {
        logger.debug('EmailAuth: OTP verification successful');
        
        // ✅ SIMPLIFIED: Set success state and let AuthGuard handle redirect
        setAuthState('success');
        toast.success('Login berhasil! Mengarahkan ke dashboard...');
        
        // ✅ Call triggerRedirectCheck from AuthContext to ensure proper redirect
        triggerRedirectCheck();
        
        // ✅ Force immediate redirect to dashboard after successful OTP verification
        // This ensures redirect happens even if AuthGuard fails
        logger.info('EmailAuth: Forcing immediate redirect to dashboard');
        
        // Gunakan window.location.replace langsung untuk memastikan redirect terjadi
        // window.location.replace menggantikan halaman saat ini dalam history browser
        // sehingga pengguna tidak bisa kembali ke halaman login dengan tombol back
        logger.info('EmailAuth: Using direct window.location.replace redirect');
        window.location.replace('/');
        
        // Sebagai fallback, jika masih di halaman yang sama setelah beberapa waktu
        // Gunakan timeout yang lebih pendek untuk mempercepat redirect
        setTimeout(() => {
          if (window.location.pathname === '/auth') {
            logger.warn('EmailAuth: Still on auth page after redirect, forcing again with reload');
            window.location.href = '/';
            // Force reload halaman untuk memastikan redirect terjadi
            setTimeout(() => window.location.reload(), 200);
          }
        }, 500);
        
        // ✅ Only call onLoginSuccess callback if provided (for custom logic)
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
      } else if (result === 'expired') {
        setAuthState('expired');
        setError('Kode OTP sudah kadaluarsa. Silakan minta kode baru.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (result === 'rate_limited') {
        setAuthState('error');
        setError('Terlalu banyak percobaan. Tunggu beberapa menit.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (result === 'invalid') {
        setAuthState('error');
        setError('Kode OTP tidak valid. Silakan coba lagi.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setAuthState('error');
        setError('Kode OTP tidak valid. Silakan coba lagi.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      if (mountedRef.current) {
        setAuthState('error');
        setError('Terjadi kesalahan saat verifikasi. Silakan coba lagi.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }
  };

  // ✅ Get Button States
  const isLoading = authState === 'sending' || authState === 'verifying';
  const isSent = authState === 'sent' || authState === 'expired';
  const isSuccess = authState === 'success';
  const canSend = isFormValid() && cooldownTime === 0 && !isLoading;
  const canVerify = otp.every(digit => digit !== '') && !isLoading && !isSuccess;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-full max-w-md border rounded-xl overflow-hidden">
        {/* Header Accent */}
        <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
        
        <CardHeader className="space-y-4 pt-8">
          <div className="flex justify-center mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-16 w-auto" />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            {appName}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            {appDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isSent ? (
            // ✅ Email Input Form with hCaptcha
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={handleEmailChange}
                    className="pl-10 py-3 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* ✅ hCaptcha Widget */}
              {HCAPTCHA_ENABLED && hCaptchaLoaded && HCaptcha && hCaptchaKey > 0 && (
                <div className="flex justify-center">
                  <HCaptcha
                    key={hCaptchaKey}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token: string) => {
                      if (mountedRef.current) {
                        setHCaptchaToken(token);
                        logger.info('hCaptcha verified');
                      }
                    }}
                    onExpire={() => {
                      if (mountedRef.current) {
                        setHCaptchaToken(null);
                        logger.info('hCaptcha expired');
                      }
                    }}
                    onError={(error: any) => {
              logger.error('hCaptcha error:', error);
              if (mountedRef.current) {
                setHCaptchaToken(null);
                setHCaptchaLoadError(true);
                // Don't show error toast, just silently disable captcha
                logger.warn('hCaptcha failed to load, likely due to CSP. Disabling captcha requirement.');
              }
            }}
                    theme="light"
                    size="normal"
                  />
                </div>
              )}

              {/* ✅ Show message if hCaptcha failed to load */}
              {HCAPTCHA_ENABLED && !hCaptchaLoaded && (
                <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  ⚠️ Captcha sedang dimuat... Tunggu sebentar.
                </div>
              )}
              
              {/* ✅ Show message if hCaptcha failed due to CSP */}
              {HCAPTCHA_ENABLED && hCaptchaLoadError && (
                <div className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  ℹ️ Sistem mendeteksi pembatasan keamanan browser. Captcha akan dilewati secara otomatis.
                </div>
              )}
              
              <Button
                onClick={handleSendOtp}
                className="w-full py-3 text-base font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg border transition-all duration-200 disabled:opacity-50"
                disabled={!canSend}
              >
                {cooldownTime > 0 ? (
                  <>
                    <Clock className="mr-2 h-5 w-5" />
                    Tunggu {cooldownTime}s
                  </>
                ) : isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Mengirim Kode...
                  </>
                ) : (
                  'Kirim Kode Verifikasi'
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Kami akan mengirim kode 6 digit ke email Anda (berlaku 5 menit)
              </p>
            </div>
          ) : (
            // ✅ OTP Verification Form
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Cek Email Anda</h3>
                <p className="text-gray-600">
                  Kode verifikasi telah dikirim ke
                </p>
                <p className="font-semibold text-gray-800">{email}</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`border rounded-lg p-3 ${
                  authState === 'expired' 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <AlertCircle className={`w-4 h-4 mr-2 ${
                      authState === 'expired' ? 'text-orange-600' : 'text-red-600'
                    }`} />
                    <span className={`text-sm ${
                      authState === 'expired' ? 'text-orange-800' : 'text-red-800'
                    }`}>
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {authState === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 text-green-600 animate-spin" />
                    <span className="text-sm text-green-800">
                      Login berhasil! AuthGuard akan mengarahkan ke dashboard...
                    </span>
                  </div>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 block text-center">
                  Masukkan Kode OTP (6 digit)
                </Label>
                <div className="flex justify-center space-x-2">
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
                      className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                      disabled={isLoading || isSuccess}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOtp}
                disabled={!canVerify}
                className="w-full py-3 text-base font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg border transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Memverifikasi...
                  </>
                ) : isSuccess ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Berhasil! AuthGuard mengarahkan...
                  </>
                ) : (
                  'Verifikasi Kode'
                )}
              </Button>
              
              {/* Info & Resend */}
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>Tips:</strong> Kode akan expired dalam 5 menit. Periksa folder spam jika tidak menerima email.
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={isLoading || cooldownTime > 0 || isSuccess}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  {cooldownTime > 0 ? `Tunggu ${cooldownTime}s` : 'Kirim Ulang Kode'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Cooldown Message */}
        {cooldownTime > 0 && (
          <div className="px-6 pb-6">
            <div className="text-xs text-center text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-200">
              <Clock className="inline h-3 w-3 mr-1" />
              Tunggu {cooldownTime} detik untuk mencegah spam
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailAuthPage;
