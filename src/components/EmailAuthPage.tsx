// src/components/EmailAuthPage.tsx - Simple Email + OTP Login
import React, { useState, useRef, useEffect } from "react";
import { Lock, Mail, RefreshCw } from "lucide-react";
import { sendEmailOtp, verifyEmailOtp } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type AuthStep = "email" | "otp" | "verifying" | "success";

interface EmailAuthPageProps {
  onLoginSuccess?: () => void;
}

const STORAGE_KEY = 'emailAuthSession';

const EmailAuthPage: React.FC<EmailAuthPageProps> = ({ onLoginSuccess }) => {
  // State
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Refs for OTP inputs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();

  // Load persisted session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { step: savedStep, email: savedEmail, timestamp } = JSON.parse(saved);
        
        // Only restore if session is less than 5 minutes old
        const isRecent = Date.now() - timestamp < 5 * 60 * 1000;
        
        if (isRecent && savedStep === 'otp' && savedEmail) {
          setStep(savedStep);
          setEmail(savedEmail);
          console.log('📱 EmailAuth: Restored OTP session for:', savedEmail);
          
          // Focus first OTP input after restoration
          setTimeout(() => {
            otpRefs.current[0]?.focus();
          }, 200);
        } else {
          // Clear expired session
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to restore auth session:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save session when step changes to OTP
  useEffect(() => {
    if (step === 'otp' && email) {
      const sessionData = {
        step,
        email,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      console.log('💾 EmailAuth: Saved OTP session');
    } else if (step === 'email' || step === 'success') {
      // Clear session when back to email or successful
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [step, email]);

  // Handle page visibility changes to maintain session
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && step === 'otp' && email) {
        // Save session when page becomes hidden
        const sessionData = {
          step,
          email,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      }
    };

    const handleBeforeUnload = () => {
      if (step === 'otp' && email) {
        const sessionData = {
          step,
          email,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, email]);

  // Cleanup cooldown on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  // Start cooldown timer
  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
            cooldownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Reset form
  const resetForm = () => {
    setStep("email");
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setIsLoading(false);
    setCooldown(0);
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("Email harus diisi");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await sendEmailOtp(email.trim(), null, true, true);
      
      if (success) {
        setStep("otp");
        startCooldown(60);
        toast.success("Kode OTP telah dikirim ke email Anda");
        
        // Focus first OTP input
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      } else {
        setError("Gagal mengirim kode OTP. Silakan coba lagi.");
        startCooldown(30);
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      startCooldown(30);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setIsLoading(true);
    setError("");
    setOtp(["", "", "", "", "", ""]);

    try {
      const success = await sendEmailOtp(email, null, true, true);
      
      if (success) {
        startCooldown(60);
        toast.success("Kode OTP baru telah dikirim");
        otpRefs.current[0]?.focus();
      } else {
        setError("Gagal mengirim ulang kode OTP");
        startCooldown(30);
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Terjadi kesalahan saat mengirim ulang kode");
      startCooldown(30);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value.toUpperCase();
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields filled
    if (newOtp.every(digit => digit !== "") && newOtp.join("").length === 6) {
      setTimeout(() => handleVerifyOtp(newOtp.join("")), 100);
    }
  };

  // Handle OTP input keydown
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\s/g, "").toUpperCase();
    
    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split("");
      while (newOtp.length < 6) newOtp.push("");
      setOtp(newOtp);
      setError("");
      
      // Auto-verify pasted OTP
      if (newOtp.every(digit => digit !== "")) {
        setTimeout(() => handleVerifyOtp(newOtp.join("")), 100);
      }
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    
    if (code.length !== 6) {
      setError("Kode OTP harus 6 digit");
      return;
    }

    setStep("verifying");
    setError("");

    try {
      const result = await verifyEmailOtp(email, code);
      
      if (result === true) {
        setStep("success");
        toast.success("Login berhasil!");
        
        // Call success callback
        if (onLoginSuccess) {
          setTimeout(onLoginSuccess, 1000);
        }
      } else if (result === "expired") {
        setError("Kode OTP sudah kadaluarsa. Silakan minta kode baru.");
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
      } else if (result === "rate_limited") {
        setError("Terlalu banyak percobaan. Tunggu beberapa menit.");
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError("Kode OTP tidak valid. Silakan coba lagi.");
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError("Terjadi kesalahan saat verifikasi. Silakan coba lagi.");
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
    }
  };

  // Back to email
  const handleBackToEmail = () => {
    resetForm();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-full max-w-md border rounded-xl overflow-hidden shadow-lg">
        {/* Header Accent */}
        <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>

        <CardHeader className="space-y-4 pt-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Sistem HPP
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Hitung Harga Pokok Penjualan dengan mudah
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Email Step */}
          {step === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    disabled={isLoading || cooldown > 0}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={isLoading || cooldown > 0}
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Mengirim...
                  </>
                ) : cooldown > 0 ? (
                  `Tunggu ${cooldown}s`
                ) : (
                  "Kirim Kode Verifikasi"
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Kami akan mengirim kode 6 digit ke email Anda (berlaku 5 menit)
              </p>

              {/* Development only - Debug clear button */}
              {import.meta.env.DEV && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      console.log('🧹 EmailAuth: Cleared session storage');
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                    type="button"
                  >
                    [DEV] Clear Session
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OTP Step */}
          {(step === "otp" || step === "verifying") && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Masukkan kode OTP yang telah dikirim ke:
                </p>
                <p className="font-medium text-gray-800">{email}</p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 block text-center">
                  Masukkan Kode OTP (6 digit)
                </label>
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                      disabled={step === "verifying"}
                    />
                  ))}
                </div>
              </div>

              {step === "verifying" && (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-orange-500 mr-2" />
                  <span className="text-gray-600">Memverifikasi...</span>
                </div>
              )}

              <div className="text-center space-y-2">
                <Button
                  variant="link"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || step === "verifying"}
                  className="text-orange-600 hover:text-orange-700"
                >
                  {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim ulang kode"}
                </Button>

                <div>
                  <Button
                    variant="link"
                    onClick={handleBackToEmail}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ← Kembali ke email
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="h-8 w-8 text-green-600 text-2xl">✓</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Login Berhasil!
              </h3>
              <p className="text-gray-600">
                Mengarahkan ke dashboard...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAuthPage;