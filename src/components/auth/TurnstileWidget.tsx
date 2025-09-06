import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { TurnstileConfig } from '../../types/turnstile';

interface TurnstileWidgetProps {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpired?: () => void;
  onTimeout?: () => void;
  className?: string;
  retry?: 'auto' | 'never';
  retryInterval?: number;
  refreshExpired?: 'auto' | 'manual' | 'never';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

interface TurnstileWidgetRef {
  reset: () => void;
  getResponse: () => string | undefined;
  isExpired: () => boolean;
}

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>((
  {
    sitekey,
    theme = 'auto',
    size = 'normal',
    onSuccess,
    onError,
    onExpired,
    onTimeout,
    className = '',
    retry = 'auto',
    retryInterval = 8000,
    refreshExpired = 'auto',
    appearance = 'always'
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Turnstile script
  useEffect(() => {
    const loadTurnstileScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector('script[src*="turnstile"]')) {
          setIsLoaded(true);
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setIsLoaded(true);
          resolve();
        };
        
        script.onerror = () => {
          setError('Gagal memuat script Turnstile');
          reject(new Error('Failed to load Turnstile script'));
        };
        
        document.head.appendChild(script);
      });
    };

    loadTurnstileScript().catch(console.error);
  }, []);

  // Reset widget function
  const reset = () => {
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.reset(widgetId);
        setError(null);
      } catch (err) {
        console.error('Error resetting Turnstile widget:', err);
        setError('Gagal mereset CAPTCHA');
      }
    }
  };

  // Get response token
  const getResponse = (): string | undefined => {
    if (widgetId && window.turnstile) {
      try {
        return window.turnstile.getResponse(widgetId);
      } catch (err) {
        console.error('Error getting Turnstile response:', err);
        return undefined;
      }
    }
    return undefined;
  };

  // Check if expired
  const isExpired = (): boolean => {
    if (widgetId && window.turnstile) {
      try {
        return window.turnstile.isExpired(widgetId);
      } catch (err) {
        console.error('Error checking Turnstile expiration:', err);
        return true;
      }
    }
    return true;
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reset,
    getResponse,
    isExpired
  }));

  // Render widget when script is loaded
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) {
      return;
    }

    const config: TurnstileConfig = {
      sitekey,
      theme,
      size,
      retry,
      'retry-interval': retryInterval,
      'refresh-expired': refreshExpired,
      appearance,
      callback: (token: string) => {
        onSuccess?.(token);
      },
      'error-callback': () => {
        setError('Verifikasi CAPTCHA gagal');
        onError?.();
      },
      'expired-callback': () => {
        setError('CAPTCHA telah kedaluwarsa');
        onExpired?.();
      },
      'timeout-callback': () => {
        setError('CAPTCHA timeout');
        onTimeout?.();
      }
    };

    try {
      const id = window.turnstile.render(containerRef.current, config);
      setWidgetId(id);
      setError(null);
    } catch (err) {
      console.error('Error rendering Turnstile widget:', err);
      setError('Gagal menampilkan CAPTCHA');
    }

    // Cleanup function
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (err) {
          console.error('Error removing Turnstile widget:', err);
        }
      }
    };
  }, [isLoaded, sitekey, theme, size, retry, retryInterval, refreshExpired, appearance]);

  if (error) {
    return (
      <div className={`turnstile-error ${className}`}>
        <div className="text-red-500 text-sm p-2 border border-red-200 rounded bg-red-50">
          {error}
          <button 
            onClick={reset}
            className="ml-2 text-red-700 underline hover:no-underline"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`turnstile-loading ${className}`}>
        <div className="flex items-center justify-center p-4 border border-gray-200 rounded bg-gray-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Memuat CAPTCHA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`turnstile-widget ${className}`}>
      <div ref={containerRef} />
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
export type { TurnstileWidgetProps, TurnstileWidgetRef };