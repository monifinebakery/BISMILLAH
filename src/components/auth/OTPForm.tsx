// src/components/auth/OTPForm.tsx - OTP Input and Verification Component
import React, { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type AuthState = "idle" | "sending" | "sent" | "verifying" | "error" | "expired" | "success";

interface OTPFormProps {
  otp: string[];
  onOtpChange: (index: number, value: string) => void;
  onVerifyOtp: () => Promise<void>;
  onResendOtp: () => Promise<void>;
  onReset: () => void;
  authState: AuthState;
  cooldownTime: number;
  canVerify: boolean;
  disabled?: boolean;
}

export const OTPForm: React.FC<OTPFormProps> = ({
  otp,
  onOtpChange,
  onVerifyOtp,
  onResendOtp,
  onReset,
  authState,
  cooldownTime,
  canVerify,
  disabled = false
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    onOtpChange(index, value.toUpperCase());
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
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
      const pastedArray = pasted.split("");
      pastedArray.forEach((digit, index) => {
        onOtpChange(index, digit);
      });
    }
  };

  return (
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
              disabled={disabled || authState === "verifying"}
            />
          ))}
        </div>
      </div>

      <Button
        onClick={onVerifyOtp}
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
          onClick={onResendOtp}
          disabled={cooldownTime > 0}
          className="text-orange-600 hover:text-orange-700 text-sm"
        >
          {cooldownTime > 0
            ? `Kirim ulang dalam ${cooldownTime}s`
            : "Kirim ulang kode"}
        </Button>

        {/* Reset button for error states */}
        {(authState === "error" || authState === "expired") && (
          <div>
            <Button
              variant="link"
              onClick={onReset}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Mulai dari awal dengan email lain
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};