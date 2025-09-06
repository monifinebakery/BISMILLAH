// src/components/auth/CloudflareTurnstile.tsx
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Extend Window interface for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, params: TurnstileRenderParams) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
      ready: (callback: () => void) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileRenderParams {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: (error: string) => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  execution?: 'render' | 'execute';
}

interface CloudflareTurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onExpire: () => void;
  onError: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  disabled?: boolean;
}

export interface CloudflareTurnstileRef {
  reset: () => void;
}

const CloudflareTurnstile = forwardRef<CloudflareTurnstileRef, CloudflareTurnstileProps>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef<boolean>(false);
  const isMobile = useIsMobile(768);
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTurnstileScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if (window.turnstile && scriptLoadedRef.current) {
        resolve();
        return;
      }

      // Check if script already exists
      if (document.querySelector('script[src*="turnstile/v0/api.js"]')) {
        // Wait for it to load
        const checkTurnstile = () => {
          if (window.turnstile) {
            scriptLoadedRef.current = true;
            resolve();
          } else {
            setTimeout(checkTurnstile, 100);
          }
        };
        checkTurnstile();
        return;
      }

      // Load script dynamically
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        // Wait a bit for turnstile to initialize
        setTimeout(() => {
          if (window.turnstile) {
            resolve();
          } else {
            reject(new Error('Turnstile API not available after script load'));
          }
        }, 100);
      };

      script.onerror = () => {
        reject(new Error('Failed to load Turnstile script'));
      };

      document.head.appendChild(script);
    });
  }, []);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: props.siteKey,
        theme: props.theme || (isMobile ? 'auto' : 'light'),
        size: props.size || (isMobile ? 'compact' : 'normal'),
        callback: (token: string) => {
          console.log('✅ Turnstile Success:', { token: token ? 'RECEIVED' : 'EMPTY' });
          props.onSuccess(token);
        },
        'error-callback': (error: string) => {
          console.error('❌ Turnstile Error:', error);
          setError(error);
          props.onError(error);
        },
        'expired-callback': () => {
          console.warn('⏰ Turnstile Expired');
          props.onExpire();
        }
      });

      widgetIdRef.current = widgetId;
      console.log('🎯 Turnstile Widget Rendered:', widgetId);
      
    } catch (error) {
      console.error('Failed to render Turnstile widget:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [props, isMobile]);

  const initializeTurnstile = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await loadTurnstileScript();
      
      if (window.turnstile?.ready) {
        window.turnstile.ready(() => {
          renderWidget();
          setIsReady(true);
          setIsLoading(false);
        });
      } else {
        renderWidget();
        setIsReady(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to initialize Turnstile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load');
      setIsLoading(false);
    }
  }, [isLoading, loadTurnstileScript, renderWidget]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    }
  }));

  // Initialize on mount
  useEffect(() => {
    const delay = isMobile ? 500 : 100;
    const timer = setTimeout(() => {
      initializeTurnstile();
    }, delay);

    return () => clearTimeout(timer);
  }, [isMobile, initializeTurnstile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.warn('Error removing Turnstile widget:', error);
        }
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-16 w-full">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
          <span className="text-sm text-gray-600">Loading verification...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-16 w-full">
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-600 mb-2">Verification Error</div>
          <button 
            onClick={initializeTurnstile}
            className="text-xs text-red-800 hover:text-red-900 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full">
      <div 
        ref={containerRef} 
        className={`turnstile-container ${!isReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
});

CloudflareTurnstile.displayName = 'CloudflareTurnstile';

export default CloudflareTurnstile;
