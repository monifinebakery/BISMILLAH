import React, { useRef, useState } from 'react';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import type { TurnstileWidgetRef } from '@/types/turnstile';
import { Button } from '@/components/ui/button';

const TurnstileTestPage: React.FC = () => {
  const widgetRef = useRef<TurnstileWidgetRef>(null);
  const [token, setToken] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string>('');

  const sitekey = (import.meta as any).env?.VITE_TURNSTILE_SITEKEY || '';

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Turnstile Test</h1>
      <p className="text-sm text-gray-600">
        Sitekey: <code className="text-xs">{JSON.stringify(sitekey)}</code>
      </p>
      <div className="p-4 border rounded">
        <TurnstileWidget
          ref={widgetRef}
          sitekey={sitekey}
          theme="auto"
          size="normal"
          onSuccess={(t) => {
            setToken(t);
            setLastEvent('success');
          }}
          onError={() => setLastEvent('error')}
          onExpired={() => setLastEvent('expired')}
          onTimeout={() => setLastEvent('timeout')}
        />
      </div>

      <div className="space-x-2">
        <Button variant="outline" onClick={() => widgetRef.current?.reset()}>Reset</Button>
        <Button variant="outline" onClick={() => alert(widgetRef.current?.getResponse() || '(no token)')}>Get Response</Button>
      </div>

      <div className="text-sm text-gray-700">
        <div>Last event: <span className="font-medium">{lastEvent || '-'}</span></div>
        <div className="truncate">Token: <span className="font-mono text-xs">{token || '-'}</span></div>
      </div>
    </div>
  );
};

export default TurnstileTestPage;

