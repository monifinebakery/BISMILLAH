import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

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
type AuthState = 'idle' | 'sending' | 'sent' | 'verifying' | 'error' | 'expired';

const EmailAuthPage: React.FC<EmailAuthPageProps> = ({
  appName = 'Sistem HPP',
  appDescription = 'Hitung Harga Pokok Penjualan dengan mudah',
  primaryColor = '#ea580c', // Orange-600
  supportEmail = 'admin@sistemhpp.com',
  logoUrl,
  onLoginSuccess,
  redirectUrl = '/',
}) => {
  // ✅ Simplified State Management
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [error, setError] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  
  // ✅ Refs for OTP inputs and timer
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ✅ Simplified Cooldown Timer
  const startCooldown = (seconds: number) => {
    setCooldownTime(seconds);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
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
    setOtp(['', '', '', '', '', '']);
    setError('');
    setAuthState('idle');
  };

  // ✅ Simplified Email Validation
  const isValidEmail = (email: string) => {
    return email && email.includes('@') && email.length > 5;
  };

  // ✅ Handle Email Change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (authState !== 'idle') {
      resetForm();
    }
  };

  // ✅ Simplified Send OTP
  const handleSendOtp = async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }

    setAuthState('sending');
    setError('');

    try {
      const success = await sendEmailOtp(email, true); // allowSignup = true
      
      if (success) {
        setAuthState('sent');
        startCooldown(60);
        toast.success('Kode OTP telah dikirim ke email Anda.');
        
        // Focus first OTP input
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setAuthState('error');
        setError('Gagal mengirim kode OTP. Silakan coba lagi.');
        startCooldown(30);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setAuthState('error');
      setError('Terjadi kesalahan saat mengirim kode OTP.');
      startCooldown(30);
    }
  };

  // ✅ Simplified Resend OTP
  const handleResendOtp = async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }

    setAuthState('sending');
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      const success = await sendEmailOtp(email, true);
      
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
      console.error('Error resending OTP:', error);
      setAuthState('error');
      setError('Terjadi kesalahan saat mengirim ulang kode OTP.');
      startCooldown(30);
    }
  };

  // ✅ Handle OTP Input Change
  const handleOtpChange = (index: number, value: string) => {
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

  // ✅ Simplified Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    setAuthState('verifying');
    setError('');

    try {
      const result = await verifyEmailOtp(email, otpCode);
      
      if (result === true) {
        // Success
        toast.success('Login berhasil!');
        
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        }
      } else if (result === 'expired') {
        // Expired
        setAuthState('expired');
        setError('Kode OTP sudah kadaluarsa. Silakan minta kode baru.');
        setOtp(['', '', '', '', '', '']);
      } else if (result === 'rate_limited') {
        // Rate limited
        setAuthState('error');
        setError('Terlalu banyak percobaan. Tunggu beberapa menit.');
        setOtp(['', '', '', '', '', '']);
      } else {
        // Invalid
        setAuthState('error');
        setError('Kode OTP tidak valid. Silakan coba lagi.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setAuthState('error');
      setError('Terjadi kesalahan saat verifikasi. Silakan coba lagi.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // ✅ Get Button States
  const isLoading = authState === 'sending' || authState === 'verifying';
  const isSent = authState === 'sent' || authState === 'expired';
  const canSend = isValidEmail(email) && cooldownTime === 0 && !isLoading;
  const canVerify = otp.every(digit => digit !== '') && authState !== 'verifying';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-full max-w-md shadow-xl border-0 rounded-xl overflow-hidden">
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
            // ✅ Email Input Form
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
              
              <Button
                onClick={handleSendOtp}
                className="w-full py-3 text-base font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
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
                      disabled={authState === 'verifying'}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOtp}
                disabled={!canVerify}
                className="w-full py-3 text-base font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {authState === 'verifying' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Memverifikasi...
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
                  disabled={isLoading || cooldownTime > 0}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  {cooldownTime > 0 ? `Tunggu ${cooldownTime}s` : 'Kirim Ulang Kode'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-0">
          <div className="text-xs text-center text-gray-500">
            Butuh bantuan?{' '}
            <a 
              href={`mailto:${supportEmail}`} 
              className="text-orange-600 hover:text-orange-700 hover:underline transition-colors"
            >
              Hubungi admin
            </a>
          </div>
          
          {cooldownTime > 0 && (
            <div className="text-xs text-center text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-200">
              <Clock className="inline h-3 w-3 mr-1" />
              Tunggu {cooldownTime} detik untuk mencegah spam
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailAuthPage;