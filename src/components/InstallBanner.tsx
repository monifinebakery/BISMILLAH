import React, { useState, useEffect } from 'react';

// Narrow type for the beforeinstallprompt event (not in TS lib by default)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect iOS devices (including iPad on iOS 13+ reporting as Mac)
    const ua = window.navigator.userAgent || '';
    const iOSDetected = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
    setIsIOS(iOSDetected);

    // Detect if already installed (standalone mode)
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Handle Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choiceResult.outcome === 'accepted') {
        // Optional: analytics or toast
        // console.log('User accepted the install prompt');
      }
    }
  };

  const handleDismiss = () => setDismissed(true);

  // Don't show anything if already installed or user dismissed
  if (dismissed || isStandalone) return null;

  // Show Android/Chromium install prompt banner
  if (deferredPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#fff',
        padding: '12px 16px',
        textAlign: 'center',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        borderTop: '1px solid #eee',
        zIndex: 60
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 14 }}>Install aplikasi untuk pengalaman yang lebih baik</span>
          <button onClick={handleInstallClick} style={{
            padding: '8px 14px',
            border: '1px solid #ddd',
            borderRadius: 8,
            backgroundColor: '#ff6a00',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Install
          </button>
          <button onClick={handleDismiss} aria-label="Tutup" style={{
            marginLeft: 8,
            padding: '6px 10px',
            border: 'none',
            background: 'transparent',
            color: '#666',
            cursor: 'pointer'
          }}>
            ×
          </button>
        </div>
      </div>
    );
  }

  // iOS instruction overlay disabled: tutorial is provided in Settings page
  if (isIOS && !isStandalone) {
    return null;
  }

  return null;
};

export default InstallBanner;
