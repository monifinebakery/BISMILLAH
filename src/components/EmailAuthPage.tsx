// src/components/EmailAuthPage.tsx - Modular Email Auth Page
import React, { useState, useEffect, useCallback } from "react";
import { Lock } from "lucide-react";
import { sendEmailOtp, verifyEmailOtp } from "@/services/auth";
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

// Import refactored components and hooks
import { EmailForm } from "@/components/auth/EmailForm";
import { OTPForm } from "@/components/auth/OTPForm";
import { useAuthStorage } from "@/hooks/auth/useAuthStorage";
import { useCooldownTimer } from "@/hooks/auth/useCooldownTimer";
import { isMobileDevice } from "@/utils/auth/deviceDetection";
import { isValidEmail } from "@/utils/auth/sessionValidation";

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

  // Storage and device detection
  const AUTH_STORAGE_KEY = "mobile_auth_state";
  const isMobile = isMobileDevice();
  const { saveAuthState, loadAuthState, clearAuthState } = useAuthStorage(AUTH_STORAGE_KEY);
  const { 
    cooldownTime, 
    startCooldown, 
    stopCooldown, 
    restoreCooldown 
  } = useCooldownTimer();

  // State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState("");

  // Initialize state from storage
  const initializeFromStorage = useCallback(() => {
    const stored = loadAuthState();
    if (stored && isMobile) {
      logger.debug("📱 Restoring auth state from storage:", stored);
      
      setEmail(stored.email || "");
      setAuthState((stored.authState as AuthState) || "idle");

      // Restore cooldown if it was active
      if (stored.cooldownStartTime && stored.cooldownTime) {
        const elapsed = Math.floor((Date.now() - stored.cooldownStartTime) / 1000);
        const remaining = Math.max(0, stored.cooldownTime - elapsed);
        if (remaining > 0) {
          restoreCooldown(remaining);
        }
      }

      // Show restoration notification for OTP state
      if (stored.authState === "sent") {
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
        
        try {
          const shown = sessionStorage.getItem("auth_restored_info");
          if (!shown) {
            toast.info(
              `Status login dipulihkan. Silakan masukkan kode OTP${timingInfo}.`,
            );
            sessionStorage.setItem("auth_restored_info", "1");
          }
        } catch {
          toast.info(
            `Status login dipulihkan. Silakan masukkan kode OTP${timingInfo}.`,
          );
        }
      }
    }
  }, [loadAuthState, isMobile, restoreCooldown]);

  // Initialize on mount
  useEffect(() => {
    initializeFromStorage();

    // Clear session flag on unmount
    return () => {
      try {
        sessionStorage.removeItem("auth_restored_info");
      } catch {}
    };
  }, [initializeFromStorage]);

  // Page Visibility API - Handle app switching for mobile
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

  // Reset functions
  const resetForm = useCallback(() => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setAuthState("idle");
  }, []);

  const resetAll = useCallback(() => {
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setAuthState("idle");
    stopCooldown();
    clearAuthState();
    logger.debug("📱 Full reset performed with state cleanup");
  }, [stopCooldown, clearAuthState]);

  // Validation
  const canSend = isValidEmail(email) && cooldownTime === 0 && authState !== "sending";
  const canVerify = otp.every((d) => d !== "") && authState !== "verifying" && authState !== "success";

  // Handlers
  const handleEmailChange = useCallback((newEmail: string) => {
    setEmail(newEmail);
    if (authState !== "idle") resetForm();
  }, [authState, resetForm]);

  const handleSendOtp = useCallback(async () => {
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

      if (success) {
        setAuthState("sent");
        startCooldown(60);
        
        // Save mobile state after successful OTP send
        const now = Date.now();
        saveAuthState({
          email,
          authState: "sent",
          cooldownTime: 60,
          cooldownStartTime: now,
          otpRequestTime: now,
        });

        toast.success("Kode OTP telah dikirim ke email Anda.");
      } else {
        setAuthState("error");
        setError("Gagal mengirim kode OTP. Silakan coba lagi.");
        startCooldown(30);
      }
    } catch (e) {
      logger.error("Error sending OTP:", e);
      setAuthState("error");
      setError("Terjadi kesalahan saat mengirim kode OTP.");
      startCooldown(30);
    }
  }, [email, cooldownTime, startCooldown, saveAuthState]);

  const handleResendOtp = useCallback(async () => {
    if (cooldownTime > 0) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum mencoba lagi.`);
      return;
    }

    setAuthState("sending");
    setError("");
    setOtp(["", "", "", "", "", ""]);

    try {
      const success = await sendEmailOtp(email, null, true, true);

      if (success) {
        setAuthState("sent");
        startCooldown(60);
        
        // Save mobile state after successful resend
        const now = Date.now();
        saveAuthState({
          email,
          authState: "sent",
          cooldownTime: 60,
          cooldownStartTime: now,
          otpRequestTime: now,
        });

        toast.success("Kode OTP baru telah dikirim.");
      } else {
        setAuthState("error");
        setError("Gagal mengirim ulang kode OTP. Silakan coba lagi.");
        startCooldown(30);
      }
    } catch (e) {
      logger.error("Error resending OTP:", e);
      setAuthState("error");
      setError("Terjadi kesalahan saat mengirim ulang kode OTP. Silakan coba lagi.");
      startCooldown(30);
    }
  }, [email, cooldownTime, startCooldown, saveAuthState]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value.toUpperCase();
    setOtp(next);
    setError("");
  }, [otp]);

  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Kode OTP harus 6 digit");
      return;
    }

    // Debug OTP age for timing analysis
    const stored = loadAuthState();
    if (stored?.otpRequestTime) {
      const otpAge = Date.now() - stored.otpRequestTime;
      const ageInMinutes = Math.floor(otpAge / (1000 * 60));
      
      logger.debug("🕐 OTP Age Check:", {
        otpRequestTime: new Date(stored.otpRequestTime).toISOString(),
        currentTime: new Date().toISOString(),
        ageMinutes: ageInMinutes,
        isWithin5Minutes: ageInMinutes < 5,
        email: stored.email,
      });

      // Warn if OTP might be getting old
      if (ageInMinutes >= 4) {
        logger.warn("🕐 OTP is getting close to expiry:", {
          ageMinutes: ageInMinutes,
          remainingMinutes: 5 - ageInMinutes,
        });
      }
    }

    setAuthState("verifying");
    setError("");

    try {
      const ok = await verifyEmailOtp(email, code);

      if (ok === true) {
        logger.debug("EmailAuth: OTP verification successful");
        setAuthState("success");
        clearAuthState(); // Clear mobile auth state on successful login
        toast.success("Login berhasil! Mengarahkan ke dashboard...");
        onLoginSuccess?.();

        // Mark OTP success timestamp
        try {
          localStorage.setItem("otpVerifiedAt", String(Date.now()));
        } catch (error) {
          logger.warn("EmailAuth: Failed to store otpVerifiedAt timestamp", error);
        }

        return;
      } else if (ok === "expired") {
        setAuthState("expired");
        setError("Kode OTP sudah kadaluarsa. Silakan minta kode baru.");
        setOtp(["", "", "", "", "", ""]);
      } else if (ok === "rate_limited") {
        setAuthState("error");
        setError("Terlalu banyak percobaan. Tunggu beberapa menit.");
        setOtp(["", "", "", "", "", ""]);
      } else {
        setAuthState("error");
        setError("Kode OTP tidak valid. Silakan coba lagi.");
        setOtp(["", "", "", "", "", ""]);
      }
    } catch (e) {
      logger.error("Error verifying OTP:", e);
      setAuthState("error");
      setError("Terjadi kesalahan saat verifikasi. Silakan coba lagi.");
      setOtp(["", "", "", "", "", ""]);
    }
  }, [otp, email, loadAuthState, clearAuthState, onLoginSuccess]);

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
          {/* Enhanced error display */}
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
            <EmailForm
              email={email}
              onEmailChange={handleEmailChange}
              onSendOtp={handleSendOtp}
              cooldownTime={cooldownTime}
              isLoading={isLoading}
              canSend={canSend}
            />
          ) : (
            <OTPForm
              otp={otp}
              onOtpChange={handleOtpChange}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={handleResendOtp}
              onReset={resetAll}
              authState={authState}
              cooldownTime={cooldownTime}
              canVerify={canVerify}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAuthPage;