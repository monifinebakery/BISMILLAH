import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, HelpCircle, Clock, RefreshCw, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp, sendMagicLink, sendAuth } from '@/lib/authService'; // ✅ Updated imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// ✅ FIXED: Use dynamic import for hCaptcha to avoid TypeScript issues
let HCaptcha: any = null;

interface EmailAuthPageProps {
  appName?: string;
  appDescription?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  logoUrl?: string;
  onLoginSuccess?: () => void;
  redirectUrl?: string;
  allowSignup?: boolean; // ✅ NEW: Control signup
  defaultMethod?: 'otp' | 'magic'; // ✅ NEW: Default auth method
  showMethodToggle?: boolean; // ✅ NEW: Show method toggle
}

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "3c246758-c42c-406c-b258-87724508b28a";
const HCAPTCHA_ENABLED = import.meta.env.VITE_HCAPTCHA_ENABLED !== 'false';
const DEBUG_LOGS = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

const EmailAuthPage: React.FC<EmailAuthPageProps> = ({
  appName = import.meta.env.VITE_APP_NAME || 'Sistem HPP',
  appDescription = import.meta.env.VITE_APP_DESCRIPTION || 'Hitung Harga Pokok Penjualan dengan mudah',
  primaryColor = '#181D31',
  accentColor = '#F0F0F0',
  supportEmail = 'admin@sistemhpp.com',
  logoUrl,
  onLoginSuccess,
  redirectUrl = '/',
  allowSignup = true, // ✅ NEW: Default allow signup
  defaultMethod = 'otp', // ✅ NEW: Default to OTP
  showMethodToggle = true, // ✅ NEW: Show toggle by default
}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<'otp' | 'magic'>(defaultMethod); // ✅ NEW: Auth method state
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState<NodeJS.Timeout | null>(null);
  const [hCaptchaToken, setHCaptchaToken] = useState<string | null>(null);
  const [hCaptchaKey, setHCaptchaKey] = useState(0);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false); // ✅ NEW: Track magic link
  const [otpExpired, setOtpExpired] = useState(false); // ✅ NEW: Track OTP expiry
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const debugLog = (message: string, ...args: any[]) => {
    if (DEBUG_LOGS) {
      console.log(`[EmailAuth] ${message}`, ...args);
    }
  };

  const startCooldown = (seconds: number) => {
    setCooldownTime(seconds);
    if (cooldownTimer) clearInterval(cooldownTimer);
    const timer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCooldownTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCooldownTimer(timer);
  };

  const resetHCaptcha = () => {
    if (HCAPTCHA_ENABLED) {
      setHCaptchaToken(null);
      setHCaptchaKey(prev => prev + 1);
      debugLog('hCaptcha reset');
    }
  };

  const resetForm = () => {
    setOtpSent(false);
    setMagicLinkSent(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setOtpExpired(false); // ✅ Reset expired state
    resetHCaptcha();
  };

  // ✅ ENHANCED: Unified send auth function with better error handling
  const handleSendAuth = async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }
    
    if (HCAPTCHA_ENABLED && !hCaptchaToken && hCaptchaKey > 0) {
      toast.error('Harap selesaikan verifikasi captcha.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setOtpExpired(false);
    
    try {
      debugLog(`Attempting to send ${authMethod} for email:`, email, 'at time:', new Date().toISOString());
      
      // ✅ Use new unified sendAuth function
      const success = await sendAuth(
        email, 
        authMethod, 
        HCAPTCHA_ENABLED ? hCaptchaToken : null,
        allowSignup,
        false // Don't skip captcha for initial send
      );
      
      debugLog(`sendAuth (${authMethod}) returned success:`, success);
      
      if (success) {
        if (authMethod === 'otp') {
          setOtpSent(true);
          setOtpExpired(false);
          debugLog('OTP sent successfully');
        } else {
          setMagicLinkSent(true);
          debugLog('Magic link sent successfully');
        }
        startCooldown(60);
      } else {
        toast.error(`Gagal mengirim ${authMethod === 'otp' ? 'kode verifikasi' : 'magic link'}. Silakan coba lagi.`);
        startCooldown(30);
        debugLog(`send${authMethod} failed`);
      }
    } catch (error) {
      console.error('Error in handleSendAuth:', error);
      toast.error(`Terjadi kesalahan saat mengirim ${authMethod === 'otp' ? 'kode verifikasi' : 'magic link'}.`);
      startCooldown(30);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED: Resend with skip captcha for better UX
  const handleResendAuth = async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }

    setIsLoading(true);
    setError('');
    setOtpExpired(false);
    
    try {
      debugLog(`Attempting to resend ${authMethod} for email:`, email, 'at time:', new Date().toISOString());
      
      // ✅ Use sendAuth for resend with skip captcha for OTP
      let success;
      if (authMethod === 'otp') {
        // Skip captcha for resend to improve UX
        success = await sendAuth(email, authMethod, null, allowSignup, true);
      } else {
        success = await sendAuth(email, authMethod, null, allowSignup, false);
      }
      
      if (success) {
        if (authMethod === 'otp') {
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
          toast.success('Kode baru telah dikirim. Kode berlaku 5 menit.');
        } else {
          toast.success('Magic link baru telah dikirim ke email Anda.');
        }
        startCooldown(60);
      } else {
        toast.error(`Gagal mengirim ulang ${authMethod === 'otp' ? 'kode verifikasi' : 'magic link'}. Silakan coba lagi.`);
        startCooldown(30);
      }
    } catch (error) {
      console.error('Error in handleResendAuth:', error);
      toast.error(`Terjadi kesalahan saat mengirim ulang ${authMethod === 'otp' ? 'kode verifikasi' : 'magic link'}.`);
      startCooldown(30);
    } finally {
      setIsLoading(false);
      resetHCaptcha();
    }
  };

  // ✅ ENHANCED: Handle OTP input change with better validation
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.toUpperCase();
    setOtp(newOtp);
    setError('');
    setOtpExpired(false);

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
      setOtpExpired(false);
      
      if (!isVerifying) {
        handleVerifyOtp(newOtp.join(''));
      }
    }
  };

  // ✅ ENHANCED: Verify OTP with comprehensive error handling
  const handleVerifyOtp = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    setIsVerifying(true);
    setError('');
    setOtpExpired(false);

    try {
      debugLog('Verifying OTP for email:', email, 'at time:', new Date().toISOString());
      
      const result = await verifyEmailOtp(email, otpCode);
      
      if (result === true) {
        // ✅ Success
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          toast.success('Login berhasil! Mengarahkan ke dashboard...');
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        }
      } else if (result === 'expired') {
        // ✅ Handle expired token
        setOtpExpired(true);
        setError('Kode OTP sudah kadaluarsa. Silakan minta kode baru.');
        setOtp(['', '', '', '', '', '']);
        
        // Auto-suggest resend after 2 seconds
        setTimeout(() => {
          if (window.confirm('Kode OTP sudah kadaluarsa. Kirim kode baru sekarang?')) {
            handleResendAuth();
          }
        }, 2000);
        
        inputRefs.current[0]?.focus();
      } else if (result === 'rate_limited') {
        // ✅ Handle rate limiting
        setError('Terlalu banyak percobaan. Tunggu beberapa menit sebelum mencoba lagi.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        // ✅ Other errors (invalid, etc.)
        setError('Kode OTP tidak valid. Silakan coba lagi.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error in handleVerifyOtp:', error);
      setError('Terjadi kesalahan saat verifikasi. Silakan coba lagi.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ Handle method change
  const handleMethodChange = (newMethod: 'otp' | 'magic') => {
    if (isLoading || cooldownTime > 0) return;
    
    setAuthMethod(newMethod);
    resetForm();
    debugLog('Auth method changed to:', newMethod);
  };

  // ✅ Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    resetForm();
    debugLog('Email changed. Form reset.');
  };

  // ✅ FIXED: Load hCaptcha dynamically
  useEffect(() => {
    if (HCAPTCHA_ENABLED && !HCaptcha) {
      import('@hcaptcha/react-hcaptcha')
        .then((module) => {
          HCaptcha = module.default;
          setHCaptchaKey(prev => prev + 1);
        })
        .catch((error) => {
          console.error('Failed to load hCaptcha:', error);
        });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
    };
  }, [cooldownTimer]);

  const isFormValid = email && email.includes('@') && (!HCAPTCHA_ENABLED || hCaptchaKey === -1 || hCaptchaToken);

  // ✅ Get button text based on method and state
  const getButtonText = () => {
    if (cooldownTime > 0) return `Tunggu ${cooldownTime}s`;
    if (isLoading) {
      return authMethod === 'otp' ? 'Mengirim Kode...' : 'Mengirim Magic Link...';
    }
    return authMethod === 'otp' ? 'Kirim Kode Verifikasi' : 'Kirim Magic Link';
  };

  const getResendButtonText = () => {
    if (cooldownTime > 0) return `Tunggu ${cooldownTime}s`;
    if (isLoading) {
      return authMethod === 'otp' ? 'Mengirim Ulang...' : 'Mengirim Ulang...';
    }
    return authMethod === 'otp' ? 'Kirim Ulang Kode' : 'Kirim Ulang Magic Link';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 font-inter"
      style={{ 
        '--hpp-primary': primaryColor, 
        '--hpp-accent': accentColor 
      } as React.CSSProperties}
    >
      <Card className="w-full max-w-md shadow-xl border-0 rounded-lg overflow-hidden">
        <div 
          className="h-2"
          style={{ backgroundColor: primaryColor }}
        ></div>
        <CardHeader className="space-y-1 pt-6">
          <div className="flex justify-center mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-16 w-auto" />
            ) : (
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle 
            className="text-2xl font-bold text-center"
            style={{ color: primaryColor }}
          >
            {appName}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            {appDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent && !magicLinkSent ? (
            <div className="space-y-4">
              {/* ✅ NEW: Method Toggle */}
              {showMethodToggle && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">Metode Login:</p>
                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleMethodChange('otp')}
                      className={`px-4 py-2 text-sm rounded-lg transition-all ${
                        authMethod === 'otp' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      disabled={isLoading || cooldownTime > 0}
                    >
                      <Mail className="w-4 h-4 inline mr-1" />
                      Kode OTP
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                    className="pl-10 py-6 text-base rounded-md border border-gray-300 focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                      '--tw-ring-opacity': '0.5'
                    } as React.CSSProperties}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>
              
              {HCAPTCHA_ENABLED && HCaptcha && hCaptchaKey > 0 && (
                <div className="flex justify-center">
                  <HCaptcha
                    key={hCaptchaKey}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token: string) => {
                      setHCaptchaToken(token);
                      debugLog('hCaptcha verified');
                    }}
                    onExpire={() => {
                      setHCaptchaToken(null);
                      debugLog('hCaptcha expired');
                    }}
                    onError={(error: any) => {
                      console.error('hCaptcha error:', error);
                      setHCaptchaToken(null);
                      // Disable hCaptcha on error
                      setHCaptchaKey(-1);
                    }}
                    theme="light"
                    size="normal"
                  />
                </div>
              )}
              
              {/* ✅ Show message if hCaptcha failed to load */}
              {HCAPTCHA_ENABLED && hCaptchaKey === -1 && (
                <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  ⚠️ Captcha tidak dapat dimuat. Anda masih bisa melanjutkan tanpa captcha.
                </div>
              )}
              
              <Button
                onClick={handleSendAuth}
                className="w-full py-6 text-base font-medium text-white rounded-md shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: primaryColor,
                  '--hover-bg': `${primaryColor}dd`
                } as React.CSSProperties}
                disabled={isLoading || cooldownTime > 0 || !isFormValid}
                type="button"
              >
                {cooldownTime > 0 ? (
                  <>
                    <Clock className="mr-2 h-5 w-5" />
                    Tunggu {cooldownTime}s
                  </>
                ) : isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {getButtonText()}
                  </>
                ) : (
                  getButtonText()
                )}
              </Button>

              {/* ✅ ENHANCED: Info about method with expiry info */}
              <div className="text-xs text-center text-gray-500">
                {authMethod === 'otp' ? (
                  'Kami akan mengirim kode 6 digit ke email Anda (berlaku 5 menit)'
                ) : (
                  'Kami akan mengirim link khusus ke email Anda untuk login'
                )}
              </div>
            </div>
          ) : magicLinkSent ? (
            // ✅ NEW: Magic Link Sent State
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Magic Link Dikirim!</h3>
              <p className="text-gray-600 leading-relaxed mb-2">
                Kami telah mengirim <strong>magic link</strong> ke
              </p>
              <p className="font-semibold text-gray-800 mb-4">{email}</p>
              <p className="text-sm text-gray-600">
                Silakan cek kotak masuk atau folder spam Anda dan klik link untuk login otomatis.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 mb-4">
                <strong>Tips:</strong> Link akan expired dalam 1 jam. Jika tidak menerima email, coba kirim ulang.
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleResendAuth}
                disabled={isLoading || cooldownTime > 0}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getResendButtonText()}
              </Button>
            </div>
          ) : (
            // ✅ ENHANCED: OTP Input State with Enhanced Error Handling
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Cek Email Anda</h3>
              <p className="text-gray-600 leading-relaxed mb-2">
                Kami telah mengirim <strong>kode verifikasi</strong> ke
              </p>
              <p className="font-semibold text-gray-800 mb-4">{email}</p>
              <p className="text-sm text-gray-600">
                Silakan cek kotak masuk atau folder spam Anda dan masukkan kode 6 digit di bawah ini:
              </p>
              
              {/* ✅ Enhanced Error Message with Expiry Handling */}
              {error && (
                <div className={`border rounded p-3 mb-4 ${
                  otpExpired 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <AlertCircle className={`w-4 h-4 mr-2 ${
                      otpExpired ? 'text-orange-600' : 'text-red-600'
                    }`} />
                    <span className={`text-sm ${
                      otpExpired ? 'text-orange-800' : 'text-red-800'
                    }`}>{error}</span>
                  </div>
                  {otpExpired && (
                    <button
                      onClick={handleResendAuth}
                      disabled={isLoading || cooldownTime > 0}
                      className="mt-2 text-sm text-orange-700 hover:text-orange-900 underline disabled:opacity-50"
                    >
                      Kirim kode baru sekarang
                    </button>
                  )}
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Masukkan Kode OTP (6 digit)</Label>
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
                      className={`w-12 h-12 text-center text-lg font-bold border-2 rounded-lg focus:outline-none transition-all ${
                        otpExpired 
                          ? 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                      disabled={isVerifying}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <Button
                onClick={() => handleVerifyOtp(otp.join(''))}
                disabled={otp.some(digit => digit === '') || isVerifying}
                className="w-full py-3 text-base font-medium text-white rounded-md shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Memverifikasi...
                  </div>
                ) : (
                  'Verifikasi Kode'
                )}
              </Button>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 mb-4">
                <strong>Tips:</strong> Kode akan expired dalam 5 menit. Jika tidak menerima email, coba kirim ulang.
              </div>
              
              {/* Resend Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleResendAuth}
                disabled={isLoading || cooldownTime > 0}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getResendButtonText()}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pt-0">
          <div className="text-xs text-center text-gray-500 flex items-center justify-center">
            <HelpCircle className="h-3 w-3 mr-1" />
            <span>
              Butuh bantuan? <a 
                href={`mailto:${supportEmail}`} 
                className="hover:underline transition-colors duration-200"
                style={{ color: primaryColor }}
              >
                Hubungi admin
              </a>
            </span>
          </div>
          {cooldownTime > 0 && (
            <div className="text-xs text-center text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-200">
              <Clock className="inline h-3 w-3 mr-1" />
              Untuk mencegah spam, tunggu {cooldownTime} detik sebelum mengirim email lagi
            </div>
          )}
          {DEBUG_LOGS && (
            <div className="text-xs text-gray-500 text-center font-mono bg-gray-100 p-2 rounded">
              Debug: {authMethod.toUpperCase()} | hCaptcha {HCAPTCHA_ENABLED ? 'Enabled' : 'Disabled'} | Token: {hCaptchaToken ? '✓' : '✗'} | Sent: {otpSent || magicLinkSent ? 'Yes' : 'No'} | Expired: {otpExpired ? 'Yes' : 'No'}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailAuthPage;