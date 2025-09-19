// src/components/auth/EmailForm.tsx - Email Input Form Component
import React from 'react';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSendOtp: () => Promise<void>;
  cooldownTime: number;
  isLoading: boolean;
  canSend: boolean;
  disabled?: boolean;
}

export const EmailForm: React.FC<EmailFormProps> = ({
  email,
  onEmailChange,
  onSendOtp,
  cooldownTime,
  isLoading,
  canSend,
  disabled = false
}) => {
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  };

  return (
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
            disabled={disabled || isLoading}
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      <Button
        onClick={onSendOtp}
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
  );
};