import { useCallback, useEffect, useState } from 'react';

export interface UseRecaptchaReturn {
  execute: (action: string) => Promise<string | null>;
  ready: boolean;
}

export const useRecaptcha = (siteKey: string): UseRecaptchaReturn => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey) return;

    const existing = document.querySelector<HTMLScriptElement>('script[data-recaptcha]');

    if (existing) {
      setReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-recaptcha', 'true');
    script.onload = () => setReady(true);
    script.onerror = () => console.error('Gagal memuat skrip reCAPTCHA');
    document.head.appendChild(script);
  }, [siteKey]);

  const execute = useCallback(
    async (action: string) => {
      try {
        if (!ready || !window.grecaptcha) return null;
        return await window.grecaptcha.execute(siteKey, { action });
      } catch (err) {
        console.error('reCAPTCHA execution error:', err);
        return null;
      }
    },
    [ready, siteKey]
  );

  return { execute, ready };
};

export default useRecaptcha;
