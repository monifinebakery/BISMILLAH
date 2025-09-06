// src/components/auth/TurnstileWrapper.tsx
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect, useCallback } from 'react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';

interface TurnstileWrapperProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onExpire: () => void;
  onError: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  disabled?: boolean;
}

export interface TurnstileWrapperRef {
  reset: () => void;
}

const TurnstileWrapper = forwardRef<TurnstileWrapperRef, TurnstileWrapperProps>((props, ref) => {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const isMobile = useIsMobile(768);
  const [key, setKey] = useState(0); // Force re-render key
  const [isReady, setIsReady] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  
  // Enhanced mobile browser detection
  const getMobileInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return { isMobile: false, browser: 'unknown' };
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobileBrowser = /mobi|android|tablet|ipad|iphone/.test(userAgent);
    const isWebView = /(wv|webview)/.test(userAgent);
    
    let browser = 'unknown';
    if (userAgent.includes('chrome')) browser = 'chrome';
    else if (userAgent.includes('firefox')) browser = 'firefox';
    else if (userAgent.includes('safari')) browser = 'safari';
    else if (userAgent.includes('edge')) browser = 'edge';
    
    return {
      isMobile: isMobileBrowser,
      isIOS,
      isAndroid,
      isWebView,
      browser,
      userAgent: navigator.userAgent
    };
  }, []);

  // Enhanced initialization with mobile-specific timing
  useEffect(() => {
    const mobileInfo = getMobileInfo();
    const delay = mobileInfo.isMobile 
      ? (mobileInfo.isIOS ? 800 : 600) // iOS needs more time
      : 100;
    
    logger.info('TurnstileWrapper initializing:', mobileInfo);
    
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isMobile, getMobileInfo]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      } else {
        // Force re-render if reset fails
        setKey(prev => prev + 1);
      }
    }
  }));

  const handleError = useCallback((error: string) => {
    const now = Date.now();
    const mobileInfo = getMobileInfo();
    const timeSinceLastError = now - lastErrorTime;
    
    // Prevent rapid error reporting
    if (timeSinceLastError < 1000) {
      logger.debug('Ignoring rapid error:', error);
      return;
    }
    
    setLastErrorTime(now);
    setErrorCount(prev => prev + 1);
    
    logger.error('🚨 Turnstile Error:', {
      error,
      errorCount: errorCount + 1,
      mobileInfo,
      timeSinceLastError
    });
    
    // Enhanced mobile error handling
    if (error === '600010' || error.includes('600010')) {
      logger.info('🔄 Handling 600010 error - mobile widget loading issue');
      
      // Progressive retry strategy based on error count
      const retryDelay = Math.min(1000 * Math.pow(2, errorCount), 8000);
      
      setTimeout(() => {
        if (errorCount < 3) {
          logger.info('Retrying Turnstile widget...');
          setKey(prev => prev + 1);
        } else {
          logger.warn('Max retries reached for Turnstile');
          // Don't call onError for 600010 after max retries to prevent spam
          return;
        }
      }, retryDelay);
    } else if (error.includes('network') || error.includes('timeout')) {
      // Network errors - try again after longer delay
      setTimeout(() => {
        setKey(prev => prev + 1);
      }, 3000);
    }
    
    // Only report error to parent after handling
    props.onError(error);
  }, [props, getMobileInfo, errorCount, lastErrorTime]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-16 w-full">
        <div className="animate-pulse bg-gray-200 rounded-lg h-16 w-64"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full" key={key}>
      <Turnstile
        ref={turnstileRef}
        siteKey={props.siteKey}
        onSuccess={props.onSuccess}
        onExpire={props.onExpire}
        onError={handleError}
        options={{
          theme: props.theme || 'light',
          size: isMobile ? 'compact' : (props.size || 'normal'),
          // Enhanced mobile-specific options
          refreshExpired: 'auto',
          retry: 'auto',
          'retry-interval': isMobile ? 10000 : 8000,
          // Add mobile performance optimizations
          'refresh-timeout': isMobile ? 15000 : 10000,
          // Better mobile UX
          language: 'auto',
          tabindex: 0,
          'response-field-name': 'cf-turnstile-response',
          // Mobile-specific error recovery
          'error-callback': handleError,
          // Accessibility improvements for mobile
          'rendered-callback': () => {
            logger.info('Turnstile widget rendered successfully');
          }
        }}
      />
    </div>
  );
});

TurnstileWrapper.displayName = 'TurnstileWrapper';

export default TurnstileWrapper;
