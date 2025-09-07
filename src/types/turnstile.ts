// Types untuk Cloudflare Turnstile CAPTCHA

export interface TurnstileConfig {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  tabindex?: number;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  'after-interactive-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'unsupported-callback'?: () => void;
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  language?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  execution?: 'render' | 'execute';
}

export interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export interface TurnstileVerifyRequest {
  secret: string;
  response: string;
  remoteip?: string;
}

export interface TurnstileWidget {
  render: (container: string | HTMLElement, config: TurnstileConfig) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  getResponse: (widgetId?: string) => string | undefined;
  isExpired: (widgetId?: string) => boolean;
}

export interface TurnstileState {
  token: string | null;
  isLoading: boolean;
  isExpired: boolean;
  error: string | null;
  widgetId: string | null;
}

export interface UseTurnstileReturn {
  token: string | null;
  isLoading: boolean;
  isExpired: boolean;
  error: string | null;
  reset: () => void;
  execute: () => void;
}

// Global Turnstile object yang tersedia di window
declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

export type TurnstileMode = 'managed' | 'non-interactive' | 'invisible';

export interface TurnstileEnvironmentConfig {
  sitekey: string;
  secretKey: string;
  mode: TurnstileMode;
  theme: 'light' | 'dark' | 'auto';
}

export interface TurnstileWidgetRef {
  reset: () => void;
  getResponse: () => string | undefined;
  isExpired: () => boolean;
}