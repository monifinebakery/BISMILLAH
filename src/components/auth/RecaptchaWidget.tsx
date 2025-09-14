import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { RecaptchaConfig, RecaptchaWidgetRef } from '../../types/recaptcha';

interface RecaptchaWidgetProps {
  sitekey: string;
  onSuccess?: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

const RecaptchaWidget = forwardRef<RecaptchaWidgetRef, RecaptchaWidgetProps>(({
  sitekey,
  onSuccess,
  onExpired,
  onError,
  theme = 'light',
  size = 'normal',
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.grecaptcha) {
          setScriptLoaded(true);
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setScriptLoaded(true);
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
        document.head.appendChild(script);
      });
    };

    loadScript().catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.grecaptcha) return;
    const config: RecaptchaConfig = {
      sitekey,
      callback: (token: string) => onSuccess?.(token),
      'expired-callback': onExpired,
      'error-callback': onError,
      theme,
      size,
    };
    widgetIdRef.current = window.grecaptcha.render(containerRef.current, config);
  }, [scriptLoaded, sitekey, onSuccess, onExpired, onError, theme, size]);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    },
    getResponse() {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        return window.grecaptcha.getResponse(widgetIdRef.current);
      }
      return null;
    },
  }));

  return <div ref={containerRef} className={className} />;
});

RecaptchaWidget.displayName = 'RecaptchaWidget';
export default RecaptchaWidget;
export type { RecaptchaWidgetProps, RecaptchaWidgetRef };
