import { useState, useCallback, useRef } from 'react';
import { TurnstileWidgetRef, UseTurnstileReturn } from '../types/turnstile';

interface UseTurnstileOptions {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
  autoReset?: boolean;
}

export const useTurnstile = (options: UseTurnstileOptions = {}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<TurnstileWidgetRef>(null);

  const { onSuccess, onError, onExpired, autoReset = true } = options;

  const handleSuccess = useCallback((newToken: string) => {
    setToken(newToken);
    setIsLoading(false);
    setIsExpired(false);
    setError(null);
    onSuccess?.(newToken);
  }, [onSuccess]);

  const handleError = useCallback(() => {
    const errorMessage = 'Verifikasi CAPTCHA gagal';
    setToken(null);
    setIsLoading(false);
    setError(errorMessage);
    onError?.(errorMessage);
    
    if (autoReset) {
      setTimeout(() => {
        reset();
      }, 2000);
    }
  }, [onError, autoReset]);

  const handleExpired = useCallback(() => {
    setToken(null);
    setIsExpired(true);
    setError('CAPTCHA telah kedaluwarsa');
    onExpired?.();
    
    if (autoReset) {
      setTimeout(() => {
        reset();
      }, 1000);
    }
  }, [onExpired, autoReset]);

  const reset = useCallback(() => {
    setToken(null);
    setIsLoading(false);
    setIsExpired(false);
    setError(null);
    
    if (widgetRef.current) {
      widgetRef.current.reset();
    }
  }, []);

  const execute = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // Turnstile akan otomatis execute ketika widget di-render
    // Fungsi ini bisa digunakan untuk trigger manual jika diperlukan
    if (widgetRef.current) {
      widgetRef.current.reset();
    }
  }, []);

  const getResponse = useCallback((): string | undefined => {
    if (widgetRef.current) {
      return widgetRef.current.getResponse();
    }
    return token || undefined;
  }, [token]);

  const checkExpired = useCallback((): boolean => {
    if (widgetRef.current) {
      return widgetRef.current.isExpired();
    }
    return isExpired;
  }, [isExpired]);

  return {
    token,
    isLoading,
    isExpired,
    error,
    reset,
    execute,
    widgetRef,
    // Additional methods
    getResponse,
    checkExpired,
    handleSuccess,
    handleError,
    handleExpired
  } as const;
};

export default useTurnstile;