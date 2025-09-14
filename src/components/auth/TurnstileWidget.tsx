import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { TurnstileConfig, TurnstileWidgetRef } from '@/types/turnstile';

interface TurnstileWidgetProps {
  sitekey: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpired?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'invisible' | 'compact';
  className?: string;
}

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(({
  sitekey,
  onSuccess,
  onError,
  onExpired,
  theme = 'light',
  size = 'normal',
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.turnstile) {
          setScriptLoaded(true);
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.onload = () => {
          setScriptLoaded(true);
          resolve();
        };
        script.onerror = () => reject(new Error('Gagal memuat skrip Turnstile'));
        document.head.appendChild(script);
      });
    };

    loadScript().catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;
    const config: TurnstileConfig = {
      sitekey: sitekey.trim(),
      callback: (token: string) => onSuccess?.(token),
      'error-callback': onError,
      'expired-callback': onExpired,
      theme,
      size,
    };
    widgetIdRef.current = window.turnstile.render(containerRef.current, config);
  }, [scriptLoaded, sitekey, onSuccess, onError, onExpired, theme, size]);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
    getResponse() {
      if (widgetIdRef.current && window.turnstile) {
        return window.turnstile.getResponse(widgetIdRef.current);
      }
      return null;
    }
  }));

  return <div ref={containerRef} className={className} />;
});

TurnstileWidget.displayName = 'TurnstileWidget';
export default TurnstileWidget;
export type { TurnstileWidgetProps, TurnstileWidgetRef };
