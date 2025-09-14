import { useRef, useState, useCallback } from 'react';
import { TurnstileWidgetRef, UseTurnstileReturn } from '@/types/turnstile';

export const useTurnstile = (): UseTurnstileReturn => {
  const widgetRef = useRef<TurnstileWidgetRef | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleSuccess = (t: string) => {
    setToken(t);
  };

  const handleError = () => {
    setToken(null);
  };

  const handleExpired = () => {
    setToken(null);
  };

  const reset = useCallback(() => {
    widgetRef.current?.reset();
    setToken(null);
  }, []);

  const getResponse = () => {
    return widgetRef.current?.getResponse() || token;
  };

  return {
    token,
    reset,
    widgetRef,
    handleSuccess,
    handleError,
    handleExpired,
    getResponse,
  };
};

export default useTurnstile;
