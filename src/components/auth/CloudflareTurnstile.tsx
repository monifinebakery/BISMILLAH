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
    };
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
      console.log('🔄 Loading Turnstile script...');
      
      // Check if already loaded and working
      if (window.turnstile && window.turnstile.render && scriptLoadedRef.current) {
        console.log('✅ Turnstile already loaded and ready');
        resolve();
        return;
      }

      // Remove any existing problematic scripts first
      const existingScripts = document.querySelectorAll('script[src*="turnstile"]');
      existingScripts.forEach(script => {
        const src = script.getAttribute('src') || '';
        console.log('🧹 Found existing Turnstile script:', src);
        
        // Check if script has async or defer attributes
        if (script.hasAttribute('async') || script.hasAttribute('defer')) {
          console.warn('⚠️ Removing problematic script with async/defer:', src);
          script.remove();
        }
      });

      // Clean up window.turnstile if it exists but is broken
      if (window.turnstile && !window.turnstile.render) {
        console.warn('🧹 Cleaning up broken Turnstile object');
        delete window.turnstile;
      }

      // Check if we have a working script already
      const workingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (workingScript && window.turnstile && window.turnstile.render) {
        console.log('✅ Found working Turnstile script');
        scriptLoadedRef.current = true;
        resolve();
        return;
      }

      // Create a completely clean script
      console.log('🆕 Creating new Turnstile script');
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.type = 'text/javascript';
      
      // NO async/defer attributes to avoid conflicts with turnstile.ready()
      // script.async = false; // Explicitly set to false
      // script.defer = false; // Explicitly set to false
      
      script.onload = () => {
        console.log('📦 Turnstile script loaded, checking availability...');
        scriptLoadedRef.current = true;
        
        // Poll for turnstile availability with more robust checking
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds max
        
        const checkTurnstile = () => {
          attempts++;
          console.log(`🔍 Checking Turnstile availability (attempt ${attempts}/${maxAttempts})`);
          
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            console.log('✅ Turnstile API is ready!');
            resolve();
          } else if (attempts < maxAttempts) {
            setTimeout(checkTurnstile, 100);
          } else {
            console.error('❌ Turnstile API not available after', maxAttempts * 100, 'ms');
            reject(new Error('Turnstile API not available after script load'));
          }
        };
        
        // Start checking immediately
        checkTurnstile();
      };

      script.onerror = (event) => {
        console.error('❌ Failed to load Turnstile script:', event);
        scriptLoadedRef.current = false;
        reject(new Error('Failed to load Turnstile script'));
      };

      // Add script to head
      document.head.appendChild(script);
      console.log('📝 Turnstile script added to DOM');
    });
  }, []);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) {
      console.warn('❌ Cannot render: missing container or turnstile');
      return;
    }

    // Check if already rendered in this container
    if (widgetIdRef.current && containerRef.current.hasChildNodes()) {
      console.log('♻️ Widget already rendered, skipping...');
      return;
    }

    // Clear container first to prevent multiple renders
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    try {
      console.log('🎨 Rendering new Turnstile widget...');
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
      console.log('🎯 Turnstile Widget Rendered Successfully:', widgetId);
      
    } catch (error) {
      console.error('❌ Failed to render Turnstile widget:', error);
      
      // If error contains "already been rendered", clear and try once more
      if (error instanceof Error && error.message.includes('already been rendered')) {
        console.log('🔄 Clearing container and retrying...');
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        widgetIdRef.current = null;
        
        // Retry after a short delay
        setTimeout(() => {
          if (containerRef.current && window.turnstile) {
            try {
              const retryWidgetId = window.turnstile.render(containerRef.current, {
                sitekey: props.siteKey,
                theme: props.theme || (isMobile ? 'auto' : 'light'),
                size: props.size || (isMobile ? 'compact' : 'normal'),
                callback: props.onSuccess,
                'error-callback': props.onError,
                'expired-callback': props.onExpire
              });
              widgetIdRef.current = retryWidgetId;
              console.log('✅ Turnstile Widget Retry Successful:', retryWidgetId);
            } catch (retryError) {
              console.error('❌ Turnstile retry failed:', retryError);
              setError(retryError instanceof Error ? retryError.message : 'Unknown error');
            }
          }
        }, 100);
      } else {
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, [props, isMobile]);

  const initializeTurnstile = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await loadTurnstileScript();
      
      // Don't use turnstile.ready() to avoid async/defer conflicts
      // Instead, render directly after script loads
      renderWidget();
      setIsReady(true);
      setIsLoading(false);
      
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

  // Cleanup on unmount and dependency changes
  useEffect(() => {
    return () => {
      // Cleanup existing widget if any
      if (window.turnstile && widgetIdRef.current) {
        try {
          console.log('🧹 Cleaning up Turnstile widget:', widgetIdRef.current);
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (error) {
          console.warn('⚠️ Error removing Turnstile widget:', error);
        }
      }
      
      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // Reset state
      setIsReady(false);
      setError(null);
    };
  }, [props.siteKey]); // Re-run when siteKey changes

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
