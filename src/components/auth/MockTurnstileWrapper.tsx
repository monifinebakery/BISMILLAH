// src/components/auth/MockTurnstileWrapper.tsx
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MockTurnstileWrapperProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onExpire: () => void;
  onError: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  disabled?: boolean;
}

export interface MockTurnstileWrapperRef {
  reset: () => void;
}

const MockTurnstileWrapper = forwardRef<MockTurnstileWrapperRef, MockTurnstileWrapperProps>((props, ref) => {
  const isMobile = useIsMobile(768);
  const [key, setKey] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Simple initialization delay
  useEffect(() => {
    const delay = isMobile ? 500 : 100;
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isMobile]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setKey(prev => prev + 1);
      setIsVerifying(false);
    }
  }));

  const handleMockVerification = () => {
    if (isVerifying || props.disabled) return;
    
    setIsVerifying(true);
    
    // Simulate verification process
    setTimeout(() => {
      // Generate mock token for development
      const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      props.onSuccess(mockToken);
      setIsVerifying(false);
    }, 1500);
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-16 w-full">
        <div className="animate-pulse bg-gray-200 rounded-lg h-16 w-64"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full" key={key}>
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 max-w-sm">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-3">
            🔒 Mock Verification (Development)
          </div>
          
          {isVerifying ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span className="text-sm text-gray-600">Verifying...</span>
            </div>
          ) : (
            <button
              onClick={handleMockVerification}
              disabled={props.disabled}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
            >
              Click to Verify
            </button>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            Mock Turnstile - No external scripts loaded
          </div>
        </div>
      </div>
    </div>
  );
});

MockTurnstileWrapper.displayName = 'MockTurnstileWrapper';

export default MockTurnstileWrapper;
