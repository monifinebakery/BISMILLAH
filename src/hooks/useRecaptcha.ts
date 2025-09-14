import { useRef, useState, useCallback } from 'react';
import { RecaptchaWidgetRef, UseRecaptchaReturn } from '../types/recaptcha';

interface UseRecaptchaOptions {
  onTokenChange?: (token: string | null) => void;
}

export const useRecaptcha = (options: UseRecaptchaOptions = {}): UseRecaptchaReturn => {
  const widgetRef = useRef<RecaptchaWidgetRef | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = (t: string | null) => {
    setTokenState(t);
    options.onTokenChange?.(t);
  };

  const reset = useCallback(() => {
    widgetRef.current?.reset();
    setToken(null);
  }, []);

  return { token, setToken, reset, widgetRef };
};

export default useRecaptcha;
