// src/components/auth/TurnstileWrapper.tsx
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect, useCallback } from 'react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [key, setKey] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Simple initialization with mobile delay
  useEffect(() => {
    const delay = isMobile ? 500 : 100;
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isMobile]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      } else {
        setKey(prev => prev + 1);
      }
    }
  }));

  const handleError = useCallback((error: string) => {
    console.log('🚨 Turnstile Error:', { error, isMobile, attempt: key + 1 });
    
    // Enhanced mobile error handling with progressive retry
    if (error === '600010' || error.includes('600010')) {
      const attempt = key + 1;
      
      if (attempt <= 3) { // Max 3 retry attempts
        const retryDelay = isMobile ? 3000 : 2000; // Longer delay for mobile
        console.log(`🔄 Retrying Turnstile (attempt ${attempt}/3) in ${retryDelay}ms`);
        
        setTimeout(() => {
          setKey(prev => prev + 1);
        }, retryDelay);
        
        // Don't report error to parent until max retries reached
        if (attempt < 3) return;
      }
    }
    
    // Report error to parent
    props.onError(error);
  }, [props, isMobile, key]);

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
        }}
      />
    </div>
  );
});

TurnstileWrapper.displayName = 'TurnstileWrapper';

export default TurnstileWrapper;
