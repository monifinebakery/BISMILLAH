// Types untuk Google reCAPTCHA

export interface RecaptchaConfig {
  sitekey: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

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

export interface RecaptchaWidget {
  render: (container: string | HTMLElement, config: RecaptchaConfig) => number;
  reset: (widgetId?: number) => void;
  getResponse: (widgetId?: number) => string;
  execute: (widgetId?: number) => void;
}

export interface RecaptchaWidgetRef {
  reset: () => void;
  getResponse: () => string | null;
}

export interface UseRecaptchaReturn {
  token: string | null;
  setToken: (token: string | null) => void;
  reset: () => void;
  widgetRef: React.MutableRefObject<RecaptchaWidgetRef | null>;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaWidget;
  }
}

export {}; // memastikan file dianggap sebagai modul
