// src/components/auth/EmailAuthPage.tsx — OTP + Turnstile (Preview & Prod)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { sendEmailOtp, verifyEmailOtp } from "@/services/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { useAuth } from "@/contexts/AuthContext";
import TurnstileWrapper, { TurnstileWrapperRef } from "@/components/auth/TurnstileWrapper";

// ─────────────────────────────────────────────────────────────
// ENV flags (gunakan Vercel System Env yang diexpose otomatis)
// ─────────────────────────────────────────────────────────────
const VERCEL_ENV = import.meta.env
  .VITE_VERCEL_ENV as "production" | "preview" | "development" | undefined;

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
const CAPTCHA_ENABLED_FLAG =
  (import.meta.env.VITE_CAPTCHA_ENABLED ?? "true") === "true";

// Captcha wajib di PREVIEW & PRODUCTION bila flag ON + sitekey ada.
// Dev lokal tetap OFF.
const REQUIRE_CAPTCHA =
  CAPTCHA_ENABLED_FLAG && !!TURNSTILE_SITE_KEY && VERCEL_ENV !== "development";


// ─────────────────────────────────────────────────────────────

type AuthState =
  | "idle"
  | "sending"
  | "sent"
  | "verifying"
  | "error"
  | "expired"
  | "success";

interface EmailAuthPageProps {
  appName?: string;
  appDescription?: string;
  primaryColor?: string;
  supportEmail?: string;
  logoUrl?: string;
  onLoginSuccess?: () => void;
  redirectUrl?: string;
}

const EmailAuthPage: React.FC<EmailAuthPageProps> = ({
  appName = "Sistem HPP",
  appDescription = "Hitung Harga Pokok Penjualan dengan mudah",
  primaryColor = "#ea580c",
  supportEmail = "admin@sistemhpp.com",
  logoUrl,
  onLoginSuccess,
  redirectUrl = "/",
}) => {
  const navigate = useNavigate();
  const { refreshUser, triggerRedirectCheck: redirectCheck } = useAuth();

  // State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState("");
  const [cooldownTime, setCooldownTime] = useState(0);

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // Refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const turnstileRef = useRef<TurnstileWrapperRef>(null);


  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Cooldown
  const startCooldown = (seconds: number) => {
    if (!mountedRef.current) return;
    setCooldownTime(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return clearInterval(timerRef.current!);
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  // Turnstile handlers
  const handleTurnstileSuccess = (token: string) => {
    if (mountedRef.current) {
      setTurnstileToken(token);
      setTurnstileError(null);
      logger.info("Turnstile verified successfully");
    }
  };

  const handleTurnstileError = (error: string) => {
    if (mountedRef.current) {
      setTurnstileToken(null);
      setTurnstileError(error);
      logger.error("Turnstile error:", error);
    }
  };

  const handleTurnstileExpire = () => {
    if (mountedRef.current) {
      setTurnstileToken(null);
      setTurnstileError(null);
      logger.info("Turnstile token expired");
    }
  };

  // Reset functions
  const resetTurnstile = () => {
    if (!mountedRef.current) return;
    if (REQUIRE_CAPTCHA && turnstileRef.current) {
      setTurnstileToken(null);
      setTurnstileError(null);
      turnstileRef.current.reset();
    }
  };

  const resetForm = () => {
    if (!mountedRef.current) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setAuthState("idle");
    resetTurnstile();
  };

  // Validation
  const isValidEmail = (s: string) => s && s.includes("@") && s.length > 5;

  // Button validation - send button active when:
  // - email valid
  // - no cooldown & not sending
  // - if captcha required → must have token
  const canSend =
    isValidEmail(email) &&
    cooldownTime === 0 &&
    authState !== "sending" &&
    (!REQUIRE_CAPTCHA || !!turnstileToken);

  // Handlers
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (authState !== "idle") resetForm();
  };

  const handleSendOtp = async () => {
    if (!mountedRef.current) return;

    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Masukkan alamat email yang valid.");
      return;
    }
    if (REQUIRE_CAPTCHA && !turnstileToken) {
      toast.error("Harap selesaikan verifikasi captcha.");
      return;
    }

    setAuthState("sending");
    setError("");

    try {
      const success = await sendEmailOtp(
        email,
        REQUIRE_CAPTCHA ? turnstileToken : null,
        true,
        false
      );

      if (!mountedRef.current) return;

      if (success) {
        setAuthState("sent");
        startCooldown(60);
        toast.success("Kode OTP telah dikirim ke email Anda.");
        setTimeout(() => inputRefs.current[0]?.focus(), 120);
      } else {
        setAuthState("error");
        setError("Gagal mengirim kode OTP. Silakan coba lagi.");
        startCooldown(30);
      }
    } catch (e) {
      logger.error("Error sending OTP:", e);
      if (mountedRef.current) {
        setAuthState("error");
        setError("Terjadi kesalahan saat mengirim kode OTP.");
        startCooldown(30);
      }
    }
  };

  const handleResendOtp = async () => {
    if (!mountedRef.current) return;

    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }
    if (REQUIRE_CAPTCHA && !turnstileToken) {
      toast.error("Harap selesaikan verifikasi captcha.");
      return;
    }

    setAuthState("sending");
    setError("");
    setOtp(["", "", "", "", "", ""]);

    try {
      const success = await sendEmailOtp(
        email,
        REQUIRE_CAPTCHA ? turnstileToken : null, // ⬅️ penting: kirim token juga saat resend
        true,
        true
      );

      if (!mountedRef.current) return;

      if (success) {
        setAuthState("sent");
        startCooldown(60);
        toast.success("Kode OTP baru telah dikirim.");
        inputRefs.current[0]?.focus();
      } else {
        setAuthState("error");
        setError("Gagal mengirim ulang kode OTP.");
        startCooldown(30);
      }
    } catch (e) {
      logger.error("Error resending OTP:", e);
      if (mountedRef.current) {
        setAuthState("error");
        setError("Terjadi kesalahan saat mengirim ulang kode OTP.");
        startCooldown(30);
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!mountedRef.current) return;
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value.toUpperCase();
    setOtp(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\s/g, "").toUpperCase();
    if (pasted.length === 6 && /^[0-9A-Z]{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      setError("");
    }
  };

  const handleVerifyOtp = async () => {
    if (!mountedRef.current) return;

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Kode OTP harus 6 digit");
      return;
    }

    setAuthState("verifying");
    setError("");

    try {
      logger.debug("EmailAuth: Starting OTP verification...");
      const ok = await verifyEmailOtp(email, code);

      if (!mountedRef.current) return;

      if (ok === true) {
        logger.debug("EmailAuth: OTP verification successful");
        await refreshUser();
        redirectCheck();
        setAuthState("success");
        toast.success("Login berhasil! Mengarahkan ke dashboard...");
        navigate(redirectUrl, { replace: true });
        onLoginSuccess?.();
      } else if (ok === "expired") {
        setAuthState("expired");
        setError("Kode OTP sudah kadaluarsa. Silakan minta kode baru.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else if (ok === "rate_limited") {
        setAuthState("error");
        setError("Terlalu banyak percobaan. Tunggu beberapa menit.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setAuthState("error");
        setError("Kode OTP tidak valid. Silakan coba lagi.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (e) {
      logger.error("Error verifying OTP:", e);
      if (mountedRef.current) {
        setAuthState("error");
        setError("Terjadi kesalahan saat verifikasi. Silakan coba lagi.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }
  };

  const isLoading = authState === "sending" || authState === "verifying";
  const isSent = authState === "sent" || authState === "expired";
  const canVerify =
    otp.every((d) => d !== "") &&
    authState !== "verifying" &&
    authState !== "success";

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
            // Email Input + Captcha
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

              {/* Turnstile Widget - hanya saat diwajibkan */}
              {REQUIRE_CAPTCHA && (
                <div className="flex justify-center">
                  <TurnstileWrapper
                    ref={turnstileRef}
                    siteKey={TURNSTILE_SITE_KEY}
                    onSuccess={handleTurnstileSuccess}
                    onError={handleTurnstileError}
                    onExpire={handleTurnstileExpire}
                    theme="light"
                  />
                </div>
              )}

              {/* Info status Turnstile */}
              {REQUIRE_CAPTCHA && turnstileError && (
                <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  Captcha error: {turnstileError}. Coba refresh halaman.
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
                  "Kirim Kode Verifikasi"
                )}
              </Button>

              {!REQUIRE_CAPTCHA && (
                <small className="block text-center text-sm text-muted-foreground">
                  Captcha dimatikan di environment ini.
                </small>
              )}

              <p className="text-xs text-center text-gray-500">
                Kami akan mengirim kode 6 digit ke email Anda (berlaku 5 menit)
              </p>
            </div>
          ) : (
            // OTP Verification
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Cek Email Anda</h3>
                <p className="text-gray-600">Kode verifikasi telah dikirim ke</p>
                <p className="font-semibold text-gray-800">{email}</p>
              </div>

              {error && (
                <div
                  className={`border rounded-lg p-3 ${
                    authState === "expired"
                      ? "bg-orange-50 border-orange-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    <AlertCircle
                      className={`w-4 h-4 mr-2 ${
                        authState === "expired" ? "text-orange-600" : "text-red-600"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        authState === "expired" ? "text-orange-800" : "text-red-800"
                      }`}
                    >
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {authState === "success" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 text-green-600 animate-spin" />
                    <span className="text-sm text-green-800">
                      Login berhasil! AuthGuard akan mengarahkan ke dashboard...
                    </span>
                  </div>
                </div>
              )}

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
                      disabled={authState === "verifying" || authState === "success"}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={!canVerify}
                className="w-full py-3 text-base font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg border transition-all duration-200 disabled:opacity-50"
              >
                {authState === "verifying" ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Memverifikasi...
                  </>
                ) : authState === "success" ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Berhasil! AuthGuard mengarahkan...
                  </>
                ) : (
                  "Verifikasi Kode"
                )}
              </Button>

              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>Tips:</strong> Kode akan expired dalam 5 menit. Periksa folder spam
                  jika tidak menerima email.
                </div>

                <Button
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={isLoading || cooldownTime > 0 || authState === "success"}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  {cooldownTime > 0 ? `Tunggu ${cooldownTime}s` : "Kirim Ulang Kode"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

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
