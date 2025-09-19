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

  // Initialize state from storage - WITH SMART EXPIRY VALIDATION
  const initializeFromStorage = useCallback(() => {
    const stored = loadAuthState();
    if (stored) {
      logger.debug("💾 Checking stored auth state:", stored);
      
      // ✅ ENHANCED: Validate OTP session freshness (max 10 minutes)
      const isOtpExpired = stored.otpRequestTime && 
        (Date.now() - stored.otpRequestTime) > (10 * 60 * 1000);
        
      // ✅ ENHANCED: Only restore if state is recent and valid
      const shouldRestore = stored.authState === "sent" && 
        stored.otpRequestTime &&
        !isOtpExpired &&
        stored.email;
      
      if (shouldRestore) {
        logger.debug("🔄 Restoring valid OTP session");
        
        setEmail(stored.email || "");
        setAuthState("sent");
        
        // Restore OTP array if it exists
        if (stored.otp && Array.isArray(stored.otp)) {
          setOtp(stored.otp);
        }

        // Restore cooldown if it was active
        if (stored.cooldownStartTime && stored.cooldownTime) {
          const elapsed = Math.floor((Date.now() - stored.cooldownStartTime) / 1000);
          const remaining = Math.max(0, stored.cooldownTime - elapsed);
          if (remaining > 0) {
            restoreCooldown(remaining);
          }
        }

        // Show restoration notification
        const otpAge = Date.now() - stored.otpRequestTime;
        const ageInMinutes = Math.floor(otpAge / (1000 * 60));
        const remainingMinutes = Math.max(0, 10 - ageInMinutes);
        const timingInfo = remainingMinutes > 0 
          ? ` (${remainingMinutes} menit tersisa)` 
          : "";
        
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
      } else {
        // ✅ ENHANCED: Clear expired or invalid state
        logger.debug("🧽 Clearing invalid or expired auth state", {
          hasStoredState: !!stored.authState,
          storedAuthState: stored.authState,
          isOtpExpired,
          hasEmail: !!stored.email,
          hasOtpRequestTime: !!stored.otpRequestTime
        });
        
        if (stored.authState === "sent") {
          clearAuthState();
        }
        
        // Default to idle state for fresh sessions
        logger.debug("🎆 Starting fresh auth session");
        setAuthState("idle");
        setEmail(""); // Clear email as well when starting fresh
        setOtp(["", "", "", "", "", ""]); // Clear OTP as well
      }
    } else {
      // ✅ ENHANCED: Explicitly set idle for completely new sessions
      logger.debug("🎆 No stored state, starting fresh");
      setAuthState("idle");
      setEmail(""); // Clear email
      setOtp(["", "", "", "", "", ""]); // Clear OTP
    }
  }, [loadAuthState, restoreCooldown, clearAuthState]);

  // Initialize on mount
  useEffect(() => {
    // Always check for expired sessions on mount
    const stored = loadAuthState();
    if (stored?.authState === "sent" && stored?.otpRequestTime) {
      const isOtpExpired = (Date.now() - stored.otpRequestTime) > (10 * 60 * 1000);
      if (isOtpExpired) {
        // Clear expired session
        clearAuthState();
        // Reset to email input state
        setAuthState("idle");
        setEmail("");
        setOtp(["", "", "", "", "", ""]);
        return;
      }
    }
    
    // Normal initialization
    initializeFromStorage();

    // Clear session flag on unmount
    return () => {
      try {
        sessionStorage.removeItem("auth_restored_info");
      } catch {}
    };
  }, [initializeFromStorage, loadAuthState, clearAuthState]);

  // Page Visibility API - NOW WORKS FOR ALL PLATFORMS
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // User returned to tab - restore state if needed
        const stored = loadAuthState();
        if (stored && stored.authState === "sent" && authState !== "sent") {
          // Validate OTP session freshness (max 10 minutes)
          const isOtpExpired = stored.otpRequestTime && 
            (Date.now() - stored.otpRequestTime) > (10 * 60 * 1000);
            
          if (!isOtpExpired && stored.email) {
            logger.debug("🔄 Tab became visible, restoring OTP state");
            setAuthState("sent");
            setEmail(stored.email || email);
            
            // ✅ FIXED: Also restore OTP array
            if (stored.otp && Array.isArray(stored.otp)) {
              setOtp(stored.otp);
            }
          } else {
            // OTP expired, clear state and show email form
            logger.debug("🧽 Clearing expired OTP session on tab visibility");
            clearAuthState();
            setAuthState("idle");
            setEmail("");
            setOtp(["", "", "", "", "", ""]);
          }
        }
      } else {
        // User left tab - save current state INCLUDING OTP
        if (authState === "sent" || cooldownTime > 0) {
          logger.debug("💾 Saving state before tab switch", {
            email,
            authState,
            otp: otp.join(''),
            cooldownTime
          });
          
          saveAuthState({
            email,
            authState,
            otp, // ✅ FIXED: Save OTP array
            cooldownTime,
            cooldownStartTime: cooldownTime > 0 ? Date.now() : undefined,
            otpRequestTime: authState === "sent" ? Date.now() : undefined,
          });
        }
      }
    };

    const handleBeforeUnload = () => {
      // Save state before page unload
      if (authState === "sent" || cooldownTime > 0) {
        logger.debug("💾 Saving state before page unload");
        saveAuthState({
          email,
          authState,
          otp, // ✅ FIXED: Save OTP array
          cooldownTime,
          cooldownStartTime: cooldownTime > 0 ? Date.now() : undefined,
          otpRequestTime: authState === "sent" ? Date.now() : undefined,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [email, authState, otp, cooldownTime, loadAuthState, saveAuthState]);

  // Reset functions
  const resetForm = useCallback(() => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setAuthState("idle");
    // ✅ ENHANCED: Clear any stored state when resetting form
    clearAuthState();
    logger.debug("🧽 Form reset with state cleanup");
  }, [clearAuthState]);

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
    if (authState !== "idle") {
      logger.debug("🧽 Email changed, resetting form");
      resetForm();
    }
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
    
    // ✅ FIXED: Save OTP state immediately when user types
    if (authState === "sent") {
      logger.debug("💾 Saving OTP as user types:", next.join(''));
      saveAuthState({
        email,
        authState: "sent",
        otp: next,
        cooldownTime,
        cooldownStartTime: cooldownTime > 0 ? Date.now() : undefined,
        otpRequestTime: Date.now(),
      });
    }
  }, [otp, authState, email, cooldownTime, saveAuthState]);

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
        isWithin10Minutes: ageInMinutes < 10,
        email: stored.email,
      });

      // Warn if OTP might be getting old
      if (ageInMinutes >= 8) {
        logger.warn("🕐 OTP is getting close to expiry:", {
          ageMinutes: ageInMinutes,
          remainingMinutes: 10 - ageInMinutes,
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

        // Small delay to ensure session is established
        setTimeout(() => {
          onLoginSuccess?.();
        }, 300);

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
          {/* ✅ DEBUG: Clear localStorage button (development only) */}
          {import.meta.env.DEV && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4">
              <p className="text-gray-700 text-xs mb-2">🛠️ Debug Mode</p>
              <button
                onClick={() => {
                  clearAuthState();
                  setAuthState("idle");
                  setEmail("");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                  stopCooldown();
                  toast.info("Debug: State cleared");
                }}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
              >
                🧽 Clear All State
              </button>
            </div>
          )}
          
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