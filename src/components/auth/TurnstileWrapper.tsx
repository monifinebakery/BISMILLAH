// src/components/auth/TurnstileWrapper.tsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

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

  useImperativeHandle(ref, () => ({
    reset: () => {
      turnstileRef.current?.reset();
    }
  }));

  return (
    <Turnstile
      ref={turnstileRef}
      siteKey={props.siteKey}
      onSuccess={props.onSuccess}
      onExpire={props.onExpire}
      onError={props.onError}
      options={{
        theme: props.theme || 'light',
        size: props.size || 'normal',
      }}
    />
  );
});

TurnstileWrapper.displayName = 'TurnstileWrapper';

export default TurnstileWrapper;
