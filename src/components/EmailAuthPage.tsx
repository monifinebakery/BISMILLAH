// src/components/auth/EmailAuthPage.tsx — Simple OTP Authentication
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mail, Lock, Clock, RefreshCw } from "lucide-react";
import { sendEmailOtp, verifyEmailOtp } from "@/services/auth";
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
import { supabase } from "@/integrations/supabase/client";

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
  const { refreshUser, triggerRedirectCheck: redirectCheck } = useAuth();

  // 🔄 MOBILE-PERSISTENT Storage keys
  const AUTH_STORAGE_KEY = "mobile_auth_state";
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // 📱 Persistent storage helpers
  const saveAuthState = useCallback(
    (data: {
      email?: string;
      authState?: AuthState;
      cooldownTime?: number;
      cooldownStartTime?: number;
      otpRequestTime?: number;
    }) => {
      try {
        const existing = JSON.parse(
          localStorage.getItem(AUTH_STORAGE_KEY) || "{}",
        );
        const updated = { ...existing, ...data, timestamp: Date.now() };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        logger.debug("📱 Auth state saved:", data);
      } catch (error) {
        logger.warn("Failed to save auth state:", error);
      }
    },
    [AUTH_STORAGE_KEY, isMobile],
  );

  const loadAuthState = useCallback(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const data = JSON.parse(stored);

      // Check if data is not too old (max 10 minutes)
      const age = Date.now() - (data.timestamp || 0);
      if (age > 10 * 60 * 1000) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      logger.debug("📱 Auth state loaded:", data);
      return data;
    } catch (error) {
      logger.warn("Failed to load auth state:", error);
      return null;
    }
  }, [AUTH_STORAGE_KEY, isMobile]);

  const clearAuthState = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      logger.debug("📱 Auth state cleared");
    } catch (error) {
      logger.warn("Failed to clear auth state:", error);
    }
  }, [AUTH_STORAGE_KEY]);

  // 📱 Initialize state with persistence
  const initializeState = useCallback(() => {
    const stored = loadAuthState();
    if (stored) {
      return {
        email: stored.email || "",
        authState: (stored.authState as AuthState) || "idle",
        cooldownTime: 0, // Will be calculated separately
        shouldRestoreCooldown: !!stored.cooldownStartTime,
      };
    }
    return {
      email: "",
      authState: "idle" as AuthState,
      cooldownTime: 0,
      shouldRestoreCooldown: false,
    };
  }, [loadAuthState]);

  const initialState = initializeState();

  // State with mobile persistence
  const [email, setEmail] = useState(initialState.email);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [authState, setAuthState] = useState<AuthState>(initialState.authState);
  const [error, setError] = useState("");
  const [cooldownTime, setCooldownTime] = useState(initialState.cooldownTime);

  // Refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // 📱 Mobile state restoration on mount
  useEffect(() => {
    const stored = loadAuthState();
    if (stored && isMobile) {
      logger.debug("📱 Restoring mobile auth state:", stored);

      // Restore cooldown if it was active
      if (stored.cooldownStartTime && stored.cooldownTime) {
        const elapsed = Math.floor(
          (Date.now() - stored.cooldownStartTime) / 1000,
        );
        const remaining = Math.max(0, stored.cooldownTime - elapsed);

        if (remaining > 0) {
          logger.debug("📱 Restoring cooldown timer:", { remaining, elapsed });
          setCooldownTime(remaining);
          // Directly start timer instead of using startCooldown to avoid dependency
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
        }
      }

      // Show notification that state was restored (deduplicated)
      if (stored.authState === "sent") {
        // 🕐 Show timing info when state is restored
        let timingInfo = "";
        if (stored.otpRequestTime) {
          const otpAge = Date.now() - stored.otpRequestTime;
          const ageInMinutes = Math.floor(otpAge / (1000 * 60));
          const remainingMinutes = Math.max(0, 5 - ageInMinutes);
          if (remainingMinutes > 0) {
            timingInfo = ` (${remainingMinutes} menit tersisa)`;
          } else {
            timingInfo = " (mungkin sudah kadaluarsa)";
          }
        }
        const TOAST_ID = "auth_restored_info";
        // Prevent duplicate toasts within a session
        try {
          const shown = sessionStorage.getItem(TOAST_ID);
          if (!shown) {
            toast.info(
              `Status login dipulihkan. Silakan masukkan kode OTP${timingInfo}.`,
              { id: TOAST_ID },
            );
            sessionStorage.setItem(TOAST_ID, "1");
          }
        } catch {
          toast.info(
            `Status login dipulihkan. Silakan masukkan kode OTP${timingInfo}.`,
          );
        }
      }
    }
  }, []); // Only run on mount

  // Clear dedupe flag on unmount (sesi baru)
  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem("auth_restored_info");
      } catch {}
    };
  }, []);

  // 📱 Page Visibility API - Handle app switching
  useEffect(() => {
    if (!isMobile) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // User returned to app - restore state if needed
        const stored = loadAuthState();
        if (stored && stored.authState === "sent" && authState !== "sent") {
          logger.debug("📱 App became visible, restoring OTP state");
          setAuthState("sent");
          setEmail(stored.email || email);
        }
      } else {
        // User left app - save current state
        if (authState === "sent" || cooldownTime > 0) {
          saveAuthState({
            email,
            authState,
            cooldownTime,
            cooldownStartTime: cooldownTime > 0 ? Date.now() : undefined,
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [email, authState, cooldownTime, loadAuthState, saveAuthState, isMobile]);

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

  // Reset functions
  const resetForm = () => {
    if (!mountedRef.current) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setAuthState("idle");
  };

  // ✅ ENHANCED: Full reset function with mobile state cleanup
  const resetAll = () => {
    if (!mountedRef.current) return;
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setAuthState("idle");
    setCooldownTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // 📱 Clear mobile persistent state
    clearAuthState();
    logger.debug("📱 Full reset performed with state cleanup");
  };

  // Validation
  const isValidEmail = (s: string) => s && s.includes("@") && s.length > 5;

  // Simple button validation:
  const canSend =
    isValidEmail(email) && cooldownTime === 0 && authState !== "sending";

  const canVerify =
    otp.every((d) => d !== "") &&
    authState !== "verifying" &&
    authState !== "success";

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

    setAuthState("sending");
    setError("");

    try {
      const success = await sendEmailOtp(email, null, true, true);

      if (!mountedRef.current) return;

      if (success) {
        setAuthState("sent");
        startCooldown(60);
        // 📱 Save mobile state after successful OTP send
        const now = Date.now();
        saveAuthState({
          email,
          authState: "sent",
          cooldownTime: 60,
          cooldownStartTime: now,
          otpRequestTime: now,
        });

        console.log("🕐 [DEBUG] OTP sent and state saved:", {
          email,
          timestamp: new Date(now).toISOString(),
          localTime: new Date(now).toLocaleString("id-ID"),
        });
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

    setAuthState("sending");
    setError("");
    setOtp(["", "", "", "", "", ""]);

    try {
      logger.debug("EmailAuth: Resending OTP...");
      const success = await sendEmailOtp(email, null, true, true);

      if (!mountedRef.current) return;

      if (success) {
        setAuthState("sent");
        startCooldown(60);
        // 📱 Save mobile state after successful resend
        const now = Date.now();
        saveAuthState({
          email,
          authState: "sent",
          cooldownTime: 60,
          cooldownStartTime: now,
          otpRequestTime: now,
        });

        console.log("🕐 [DEBUG] OTP resent and state saved:", {
          email,
          timestamp: new Date(now).toISOString(),
          localTime: new Date(now).toLocaleString("id-ID"),
        });
        toast.success("Kode OTP baru telah dikirim.");
        inputRefs.current[0]?.focus();
      } else {
        setAuthState("error");
        setError("Gagal mengirim ulang kode OTP. Silakan coba lagi.");
        startCooldown(30);
      }
    } catch (e) {
      logger.error("Error resending OTP:", e);
      if (mountedRef.current) {
        setAuthState("error");
        setError(
          "Terjadi kesalahan saat mengirim ulang kode OTP. Silakan coba lagi.",
        );
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
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\s/g, "")
      .toUpperCase();
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

    // 🕐 Debug OTP age for timing analysis
    const stored = loadAuthState();
    if (stored?.otpRequestTime) {
      const otpAge = Date.now() - stored.otpRequestTime;
      const ageInMinutes = Math.floor(otpAge / (1000 * 60));
      const ageInSeconds = Math.floor(otpAge / 1000);

      console.log("🕐 [DEBUG] OTP Age Check:", {
        otpRequestTime: new Date(stored.otpRequestTime).toISOString(),
        otpRequestLocal: new Date(stored.otpRequestTime).toLocaleString(
          "id-ID",
        ),
        currentTime: new Date().toISOString(),
        currentLocal: new Date().toLocaleString("id-ID"),
        ageMs: otpAge,
        ageSeconds: ageInSeconds,
        ageMinutes: ageInMinutes,
        isWithin5Minutes: ageInMinutes < 5,
        email: stored.email,
        code: code.substring(0, 2) + "****", // Partially masked for security
      });

      // Warn if OTP might be getting old
      if (ageInMinutes >= 4) {
        logger.warn("🕐 OTP is getting close to expiry:", {
          ageMinutes,
          remainingMinutes: 5 - ageInMinutes,
        });
      }
    }

    setAuthState("verifying");
    setError("");

    try {
      logger.debug("EmailAuth: Starting OTP verification...");
      const ok = await verifyEmailOtp(email, code);

      if (!mountedRef.current) return;

      if (ok === true) {
        logger.debug("EmailAuth: OTP verification successful");
        setAuthState("success");
        // 📱 Clear mobile auth state on successful login
        clearAuthState();
        toast.success("Login berhasil! Mengarahkan ke dashboard...");
        onLoginSuccess?.();

        // ✅ Mark OTP success timestamp
        try {
          localStorage.setItem("otpVerifiedAt", String(Date.now()));
        } catch (error) {
          logger.warn(
            "EmailAuth: Failed to store otpVerifiedAt timestamp",
            error,
          );
        }

        // ✅ AuthContext will handle the redirect automatically via onAuthStateChange

        return;
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
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
          {/* ✅ Enhanced error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
              {(authState === "error" || authState === "expired") && (
                <p className="text-red-600 text-xs mt-2">
                  • Pastikan kode dimasukkan dengan benar
                  <br />
                  • Kode mungkin sudah kadaluarsa (5 menit)
                  <br />• Jika masalah berlanjut, coba mulai dari awal
                </p>
              )}
            </div>
          )}

          {!isSent ? (
            // Email Input
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
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

              <p className="text-xs text-center text-gray-500">
                Kami akan mengirim kode 6 digit ke email Anda (berlaku 5 menit)
              </p>
            </div>
          ) : (
            // OTP Verification
            <div className="space-y-6">
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
                      disabled={authState === "verifying"}
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
                    Berhasil! Mengarahkan...
                  </>
                ) : (
                  "Verifikasi Kode"
                )}
              </Button>

              <div className="text-center space-y-2">
                <Button
                  variant="link"
                  onClick={handleResendOtp}
                  disabled={cooldownTime > 0}
                  className="text-orange-600 hover:text-orange-700 text-sm"
                >
                  {cooldownTime > 0
                    ? `Kirim ulang dalam ${cooldownTime}s`
                    : "Kirim ulang kode"}
                </Button>

                {/* ✅ NEW: Reset button for when users get stuck */}
                {(authState === "error" || authState === "expired") && (
                  <div>
                    <Button
                      variant="link"
                      onClick={resetAll}
                      className="text-gray-500 hover:text-gray-700 text-xs"
                    >
                      Mulai dari awal dengan email lain
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAuthPage;
