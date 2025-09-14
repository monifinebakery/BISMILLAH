// Types untuk Google reCAPTCHA v3

export interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

export interface RecaptchaVerifyRequest {
  secret: string;
  response: string;
  remoteip?: string;
}

export interface UseRecaptchaReturn {
  execute: (action: string) => Promise<string | null>;
  ready: boolean;
}

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export {}; // memastikan file dianggap sebagai modul
