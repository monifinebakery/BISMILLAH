import React, { useState } from 'react';
import { Mail, Lock, HelpCircle, Clock } from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/authService';
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

const EmailAuthPage: React.FC<EmailAuthPageProps> = ({
  appName = 'Sistem HPP',
  appDescription = 'Hitung Harga Pokok Penjualan dengan mudah',
  primaryColor = '#181D31',
  accentColor = '#F0F0F0',
  supportEmail = 'admin@sistemhpp.com',
  logoUrl,
}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState<NodeJS.Timeout | null>(null);
  const [hCaptchaToken, setHCaptchaToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Fungsi untuk memulai cooldown timer
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

  // Handler untuk mengirim kode OTP
  const handleSubmitSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }
    if (!hCaptchaToken) {
      toast.error('Harap selesaikan verifikasi captcha.');
      return;
    }
    setIsLoading(true);
    try {
      // Bisa kirim hCaptchaToken ke backend kalau butuh verifikasi
      const success = await sendEmailOtp(email);
      if (success) {
        setOtpSent(true);
        startCooldown(60);
      } else {
        startCooldown(60);
        toast.error('Terlalu banyak percobaan. Silakan tunggu 1 menit sebelum mencoba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler untuk memverifikasi OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Harap masukkan kode OTP 6 digit');
      return;
    }
    
    setVerifying(true);
    try {
      const success = await verifyEmailOtp(email, otp);
      if (success) {
        // Pengguna berhasil login, redirect akan ditangani oleh AuthGuard
        window.location.href = '/';
      }
    } finally {
      setVerifying(false);
    }
  };

  // Handler untuk mengirim ulang OTP
  const handleResendOtp = async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }
    setIsLoading(true);
    try {
      const success = await sendEmailOtp(email);
      if (!success) {
        startCooldown(60);
        toast.error('Terlalu banyak percobaan. Silakan tunggu 1 menit sebelum mencoba lagi.');
      } else {
        startCooldown(60);
        toast.success('Kode OTP telah dikirim ulang ke email Anda');
      }
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
    };
  }, [cooldownTimer]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100"
      style={{ '--hpp-primary': primaryColor, '--hpp-accent': accentColor } as React.CSSProperties}
    >
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden">
        <div className="h-2 bg-hpp-primary"></div>
        <CardHeader className="space-y-1 pt-6">
          <div className="flex justify-center mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-16 w-auto" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-hpp-primary flex items-center justify-center">
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center text-hpp-primary">
            {appName}
          </CardTitle>
          <CardDescription className="text-center">
            {appDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSubmitSendOtp} className="space-y-4">
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-6 text-base"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                {/* Komponen Hcaptcha */}
                <Hcaptcha
                  sitekey="3b883be4-51ea-4f80-9ae4-579ed9f2915e"
                  onVerify={token => setHCaptchaToken(token)}
                  onExpire={() => setHCaptchaToken(null)}
                  theme="light"
                  // size="normal"
                />
              </div>
              <Button
                type="submit"
                className="w-full py-6 text-base font-medium bg-hpp-primary text-white hover:bg-opacity-90"
                disabled={isLoading || cooldownTime > 0 || !hCaptchaToken}
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
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Cek Email Anda</h3>
              <p className="text-gray-600">
                Kami telah mengirim kode OTP ke <strong>{email}</strong>.
                Silakan cek kotak masuk atau folder spam Anda dan masukkan kode 6 digit di bawah ini.
              </p>
              
              <div className="mt-4">
                <Label htmlFor="otp" className="sr-only">Kode OTP</Label>
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
                className="w-full mt-4 bg-hpp-primary text-white hover:bg-opacity-90"
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
                  'Verifikasi OTP'
                )}
              </Button>
              
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={isLoading || cooldownTime > 0}
                  className="w-full"
                >
                  {cooldownTime > 0 ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Tunggu {cooldownTime}s
                    </>
                  ) : isLoading ? (
                    'Mengirim Ulang...'
                  ) : (
                    'Kirim Ulang Kode OTP'
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
              Butuh bantuan? <a href={`mailto:${supportEmail}`} className="text-hpp-primary hover:underline">Hubungi admin</a>
            </span>
          </div>
          {cooldownTime > 0 && (
            <div className="text-xs text-center text-orange-600 bg-orange-50 p-2 rounded">
              Untuk mencegah spam, tunggu {cooldownTime} detik sebelum mengirim email lagi
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailAuthPage;
