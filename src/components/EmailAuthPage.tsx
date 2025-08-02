import React, { useState, useEffect } from 'react';
import { Mail, Lock, HelpCircle, Clock } from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/authService'; // ✅ Back to OTP imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Hcaptcha from '@hcaptcha/react-hcaptcha';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface EmailAuthPageProps {
  appName?: string;
  appDescription?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  logoUrl?: string;
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
}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false); // ✅ Back to OTP flow
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState<NodeJS.Timeout | null>(null);
  const [hCaptchaToken, setHCaptchaToken] = useState<string | null>(null);
  const [hCaptchaKey, setHCaptchaKey] = useState(0);
  const [verifying, setVerifying] = useState(false);

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

  const handleSubmitSendOtp = async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }
    
    if (HCAPTCHA_ENABLED && !hCaptchaToken) {
      toast.error('Harap selesaikan verifikasi captcha.');
      return;
    }
    
    setIsLoading(true);
    try {
      debugLog('Attempting to send OTP for email:', email);
      const success = await sendEmailOtp(email, HCAPTCHA_ENABLED ? hCaptchaToken : null);
      debugLog('sendEmailOtp returned success:', success);
      
      if (success) {
        setShowOtpInput(true);
        debugLog('setShowOtpInput(true) called. showOtpInput state should be true now.');
        startCooldown(60);
      } else {
        startCooldown(60);
        setShowOtpInput(false);
        debugLog('sendEmailOtp failed. showOtpInput state set to false.');
      }
    } catch (error) {
      console.error('Error in handleSubmitSendOtp:', error);
      toast.error('Terjadi kesalahan saat mengirim kode.');
    } finally {
      setIsLoading(false);
      resetHCaptcha();
      debugLog('Finally block executed. Current showOtpInput state:', showOtpInput);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Harap masukkan kode 6 digit');
      return;
    }
    
    setVerifying(true);
    try {
      const success = await verifyEmailOtp(email, otp);
      if (success) {
        toast.success('Verifikasi berhasil! Mengarahkan Anda...');
        window.location.href = '/';
      } else {
        setOtp('');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }
    
    if (HCAPTCHA_ENABLED && !hCaptchaToken) {
      toast.error('Harap selesaikan verifikasi captcha terlebih dahulu sebelum mengirim ulang.');
      return;
    }

    setIsLoading(true);
    try {
      debugLog('Attempting to resend OTP for email:', email);
      const success = await sendEmailOtp(email, HCAPTCHA_ENABLED ? hCaptchaToken : null);
      debugLog('sendEmailOtp (resend) returned success:', success);
      
      if (!success) {
        startCooldown(60);
        debugLog('sendEmailOtp (resend) failed.');
      } else {
        startCooldown(60);
        setShowOtpInput(true);
        toast.success('Kode telah dikirim ulang ke email Anda');
        debugLog('setShowOtpInput(true) called after resend. showOtpInput state should be true.');
      }
    } catch (error) {
      console.error('Error in handleResendOtp:', error);
      toast.error('Terjadi kesalahan saat mengirim ulang kode.');
    } finally {
      setIsLoading(false);
      resetHCaptcha();
      debugLog('Finally block (resend) executed. Current showOtpInput state:', showOtpInput);
    }
  };

  useEffect(() => {
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
    };
  }, [cooldownTimer]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    resetHCaptcha();
    setShowOtpInput(false);
    debugLog('Email changed. showOtpInput set to false.');
  };

  const isFormValid = email && email.includes('@') && (!HCAPTCHA_ENABLED || hCaptchaToken);

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
          {!showOtpInput ? (
            <div className="space-y-4">
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
              
              {HCAPTCHA_ENABLED && (
                <div className="flex justify-center">
                  <Hcaptcha
                    key={hCaptchaKey}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token) => {
                      setHCaptchaToken(token);
                      debugLog('hCaptcha verified');
                    }}
                    onExpire={() => {
                      setHCaptchaToken(null);
                      debugLog('hCaptcha expired');
                    }}
                    onError={(error) => {
                      console.error('hCaptcha error:', error);
                      setHCaptchaToken(null);
                    }}
                    theme="light"
                  />
                </div>
              )}
              
              <Button
                onClick={handleSubmitSendOtp}
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
                    Mengirim...
                  </>
                ) : (
                  'Kirim Kode OTP'
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Cek Email Anda</h3>
              <p className="text-gray-600 leading-relaxed">
                Kami telah mengirim kode ke <strong>{email}</strong>.
                Silakan cek kotak masuk atau folder spam Anda dan masukkan kode 6 digit di bawah ini.
                <br/>
                <span className="text-sm text-gray-500">(Untuk pendaftaran baru, mungkin berupa link konfirmasi yang perlu diklik terlebih dahulu.)</span>
              </p>
              
              <div className="mt-4 flex justify-center">
                <Label htmlFor="otp" className="sr-only">Kode</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              <Button 
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || verifying}
                className="w-full mt-4 text-white rounded-md shadow-md transition-colors duration-200"
                style={{ backgroundColor: primaryColor }}
              >
                {verifying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifikasi...
                  </>
                ) : (
                  'Verifikasi Kode'
                )}
              </Button>
              
              {HCAPTCHA_ENABLED && (
                <div className="flex justify-center">
                  <Hcaptcha
                    key={hCaptchaKey}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token) => {
                      setHCaptchaToken(token);
                      debugLog('hCaptcha verified for resend');
                    }}
                    onExpire={() => {
                      setHCaptchaToken(null);
                      debugLog('hCaptcha expired for resend');
                    }}
                    onError={(error) => {
                      console.error('hCaptcha error:', error);
                      setHCaptchaToken(null);
                    }}
                    theme="light"
                  />
                </div>
              )}
              
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={isLoading || cooldownTime > 0 || (HCAPTCHA_ENABLED && !hCaptchaToken)}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldownTime > 0 ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Tunggu {cooldownTime}s
                    </>
                  ) : isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mengirim Ulang...
                    </>
                  ) : (
                    'Kirim Ulang Kode'
                  )}
                </Button>
              </div>
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
              Debug: hCaptcha {HCAPTCHA_ENABLED ? 'Enabled' : 'Disabled'} | Token: {hCaptchaToken ? '✓' : '✗'} | OTP View: {showOtpInput ? 'Yes' : 'No'}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailAuthPage;