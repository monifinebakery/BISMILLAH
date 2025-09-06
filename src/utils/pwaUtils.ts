// PWA utilities for service worker registration and management
import React from 'react';
import { safeDom } from './browserApiSafeWrappers';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private init() {
    console.log('[PWA] Initializing PWA manager...');
    
    // Listen for beforeinstallprompt event
    safeDom.addEventListener(window, 'beforeinstallprompt', (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired!');
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      console.log('[PWA] Install prompt ready', { hasPrompt: !!this.installPrompt });
    }, undefined);

    // Listen for app installed event
    safeDom.addEventListener(window, 'appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      console.log('[PWA] App installed successfully');
    }, undefined);

    // Check if app is already installed
    this.checkInstallStatus();
    
    // Debug: Log initial state
    console.log('[PWA] Initial state:', {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled,
      hasServiceWorker: 'serviceWorker' in navigator,
      isHTTPS: window.location.protocol === 'https:'
    });
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers not supported');
      return null;
    }

    try {
      console.log('[PWA] Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service worker registered:', this.registration.scope);

      // Handle service worker updates
      safeDom.addEventListener(this.registration, 'updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          safeDom.addEventListener(newWorker, 'statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker available');
              this.notifyUpdate();
            }
          }, undefined);
        }
      }, undefined);

      return this.registration;
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Show install prompt to user
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      console.log('[PWA] Install prompt result:', outcome);
      
      if (outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return !!this.installPrompt && !this.isInstalled;
  }

  /**
   * Check if app is potentially installable (even without prompt)
   */
  isPotentiallyInstallable(): boolean {
    // Already installed
    if (this.isInstalled) return false;
    
    // Has install prompt (best case)
    if (this.installPrompt) return true;
    
    // Check basic PWA requirements
    const hasServiceWorker = 'serviceWorker' in navigator;
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const hasManifest = safeDom.querySelector('link[rel="manifest"]');
    
    return hasServiceWorker && isHTTPS && !!hasManifest;
  }

  /**
   * Check if app is installed
   */
  getInstallStatus(): boolean {
    return this.isInstalled;
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      console.warn('[PWA] No service worker registration found');
      return;
    }

    try {
      await this.registration.update();
      console.log('[PWA] Service worker update check completed');
    } catch (error) {
      console.error('[PWA] Service worker update failed:', error);
    }
  }

  /**
   * Unregister service worker
   */
  async unregisterServiceWorker(): Promise<boolean> {
    if (!this.registration) {
      console.warn('[PWA] No service worker registration found');
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('[PWA] Service worker unregistered:', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('[PWA] Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Send message to service worker
   */
  sendMessageToSW(message: any): void {
    if (!navigator.serviceWorker.controller) {
      console.warn('[PWA] No service worker controller found');
      return;
    }

    navigator.serviceWorker.controller.postMessage(message);
  }

  /**
   * Cache URLs for offline access
   */
  cacheUrls(urls: string[]): void {
    this.sendMessageToSW({
      type: 'CACHE_URLS',
      payload: urls
    });
  }

  /**
   * Skip waiting for new service worker
   */
  skipWaiting(): void {
    this.sendMessageToSW({
      type: 'SKIP_WAITING'
    });
  }

  /**
   * Check install status based on display mode
   */
  private checkInstallStatus(): void {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] App is running in standalone mode');
    }

    // Check for iOS Safari standalone mode
    if ((window.navigator as any).standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] App is running in iOS standalone mode');
    }
  }

  /**
   * Notify about service worker update
   */
  private notifyUpdate(): void {
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  /**
   * Get network status
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Listen for network status changes
   */
  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    safeDom.addEventListener(window, 'online', handleOnline, undefined);
    safeDom.addEventListener(window, 'offline', handleOffline, undefined);

    // Return cleanup function
    return () => {
      safeDom.removeEventListener(window, 'online', handleOnline, undefined);
      safeDom.removeEventListener(window, 'offline', handleOffline, undefined);
    };
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// React hook for PWA functionality
export function usePWA() {
  const [canInstall, setCanInstall] = React.useState(pwaManager.canInstall());
  const [isInstalled, setIsInstalled] = React.useState(pwaManager.getInstallStatus());
  const [isOnline, setIsOnline] = React.useState(pwaManager.isOnline());
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    // Listen for install prompt availability
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    // Listen for service worker updates
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    safeDom.addEventListener(window, 'beforeinstallprompt', handleBeforeInstallPrompt, undefined);
    safeDom.addEventListener(window, 'appinstalled', handleAppInstalled, undefined);
    safeDom.addEventListener(window, 'sw-update-available', handleSWUpdate, undefined);

    // Listen for network changes
    const cleanupNetworkListener = pwaManager.onNetworkChange(setIsOnline);

    return () => {
      safeDom.removeEventListener(window, 'beforeinstallprompt', handleBeforeInstallPrompt, undefined);
      safeDom.removeEventListener(window, 'appinstalled', handleAppInstalled, undefined);
      safeDom.removeEventListener(window, 'sw-update-available', handleSWUpdate, undefined);
      cleanupNetworkListener();
    };
  }, []);

  const install = async () => {
    const success = await pwaManager.showInstallPrompt();
    if (success) {
      setCanInstall(false);
    }
    return success;
  };

  const updateApp = () => {
    pwaManager.skipWaiting();
    setUpdateAvailable(false);
    // Reload page to activate new service worker
    window.location.reload();
  };

  return {
    canInstall,
    isInstalled,
    isOnline,
    updateAvailable,
    install,
    updateApp,
    cacheUrls: pwaManager.cacheUrls.bind(pwaManager),
    updateServiceWorker: pwaManager.updateServiceWorker.bind(pwaManager),
    isPotentiallyInstallable: pwaManager.isPotentiallyInstallable.bind(pwaManager)
  };
}

// Import React for the hook
import React from 'react';
import { safeDom } from '@/utils/browserApiSafeWrappers';

export default pwaManager;