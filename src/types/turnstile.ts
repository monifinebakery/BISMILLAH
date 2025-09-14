// Types untuk Cloudflare Turnstile

export interface TurnstileConfig {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'invisible' | 'compact';
}

export interface Turnstile {
  render: (container: string | HTMLElement, options?: TurnstileConfig) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  getResponse: (widgetId?: string) => string;
}

export interface TurnstileWidgetRef {
  reset: () => void;
  getResponse: () => string | null;
}

export interface UseTurnstileReturn {
  token: string | null;
  reset: () => void;
  widgetRef: React.MutableRefObject<TurnstileWidgetRef | null>;
  handleSuccess: (token: string) => void;
  handleError: () => void;
  handleExpired: () => void;
  getResponse: () => string | null;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export {}; // memastikan file dianggap sebagai modul
