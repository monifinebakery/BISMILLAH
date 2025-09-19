
// UpdateNotificationBanner.tsx - Auto-update notification system
// ==============================================

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface UpdateInfo {
  newVersion?: string;
  currentVersion?: string;
  commitHash?: string;
  deploymentUrl?: string;
  updateAvailable?: boolean;
}

interface UpdateNotificationBannerProps {
  isVisible?: boolean;
  onDismiss?: () => void;
  onRefresh?: () => void;
  updateInfo?: UpdateInfo;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  isVisible = false,
  onDismiss,
  onRefresh,
  updateInfo
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Handle refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Mark update in progress to avoid banner reappearing before reload completes
      try { localStorage.setItem('appUpdateRefreshing', '1'); } catch {
        // ignore unavailability of localStorage (private mode or blocked)
      }

      // Try to activate the new service worker first (if waiting)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const waiting = registration?.waiting;
        if (waiting) {
          // Listen for controller change then reload
          const controllerChanged = new Promise<void>((resolve) => {
            const onControllerChange = (_e: Event) => {
              navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
              resolve();
            };
            navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
          });
          waiting.postMessage({ type: 'SKIP_WAITING' });
          await Promise.race([
            controllerChanged,
            new Promise((r) => setTimeout(r, 1500)), // Fallback timeout
          ]);
        } else {
          // No waiting SW – trigger an update check
          await registration?.update();
        }
      }

      // Clear cache to ensure fresh assets on reload
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      
      // Show loading toast
      toast.loading('Mengupdate aplikasi...', { 
        duration: 2000,
        id: 'update-loading'
      });
      
      // Call custom refresh handler if provided
      if (onRefresh) {
        await onRefresh();
      }
      
      // Force reload page (small delay to allow SW activation)
      setTimeout(() => {
        window.location.reload();
      }, 300);
      
    } catch (error) {
      console.error('Error refreshing app:', error);
      toast.error('Gagal mengupdate aplikasi. Coba refresh manual.');
      setIsRefreshing(false);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't show if dismissed or not visible
  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
      <Alert className="border-0 bg-transparent text-white rounded-none px-3 sm:px-4 py-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 mt-0.5 sm:mt-0">
              <Download className="h-4 w-4 text-orange-200" />
              <AlertTriangle className="h-4 w-4 text-yellow-300 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDescription className="text-white font-medium leading-snug">
                Update terbaru! silakan refresh aplikasi anda.
              </AlertDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-auto">
            {/* Refresh Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white text-orange-700 hover:bg-orange-50 border-0 font-semibold px-4"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Muat ulang...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>

            {/* Dismiss Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-orange-600 hover:text-white p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

// Hook for managing update notifications
export const useUpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Delay before showing the banner (ms). Default to 2000ms if not provided.
  const UPDATE_BANNER_DELAY_MS = (() => {
    const raw = import.meta.env.VITE_UPDATE_BANNER_DELAY_MS as unknown as string | undefined;
    const num = raw ? Number(raw) : NaN;
    return Number.isFinite(num) ? Number(num) : 2000;
  })();

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const ENABLE_DEPLOYMENT_POLLING = false; // ❌ DISABLED: Prevent unnecessary network calls
  const DEPLOYMENT_STATUS_ENDPOINT = null; // ❌ DISABLED: Always null to avoid API calls
  const HAS_DEPLOYMENT_ENDPOINT = false; // ❌ DISABLED: Always false

  const pollDeploymentStatus = async (commitHash: string, timeout = 5 * 60 * 1000) => {
    // If env vars are not available (e.g., local dev or preview without secrets),
    // silently skip polling and do nothing.
    if (!HAS_DEPLOYMENT_ENDPOINT) {
      if (import.meta.env.DEV) {
        // Keep logs only in dev to avoid noisy console in production
        console.info('[update] Skipping deployment polling: endpoint not set');
      }
      return;
    }

    setIsPolling(true);
    const startTime = Date.now();

    const checkStatus = async () => {
      if (Date.now() - startTime > timeout) {
        console.warn('Polling for deployment status timed out.');
        setIsPolling(false);
        return;
      }

      try {
        const params = new URLSearchParams({ commit: commitHash, limit: '5' });
        const response = await fetch(`${DEPLOYMENT_STATUS_ENDPOINT}?${params.toString()}`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Failed to fetch Vercel deployments.');
          setIsPolling(false);
          return;
        }

        interface DeploymentInfo {
          commitSha?: string | null;
          url?: string;
          state?: string;
          readyState?: string;
        }
        const data = (await response.json()) as { deployments: DeploymentInfo[] };
        const deployment = data.deployments.find((d) => {
          const commit = d.commitSha ?? '';
          if (!commit) return false;
          return (
            commit === commitHash ||
            commit.startsWith(commitHash) ||
            commit.slice(0, 8) === commitHash.slice(0, 8)
          );
        });

        // Only show banner when deployment is READY, not during BUILDING or QUEUED
        const state = deployment?.readyState || deployment?.state;
        if (deployment && state === 'READY') {
          showUpdateNotification({ newVersion: commitHash, deploymentUrl: deployment.url });
          setIsPolling(false);
        } else if (deployment && (state === 'BUILDING' || state === 'QUEUED')) {
          // Continue polling every 15 seconds while building
          setTimeout(checkStatus, 15000);
        } else {
          // Deployment not found or in a different state, stop polling
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
        setIsPolling(false);
      }
    };

    checkStatus();
  };

  // Helper to actually reveal the banner with a delay
  const revealWithDelay = (info: UpdateInfo) => {
    setUpdateInfo(info);
    setUpdateAvailable(true);
    // Add a small delay before showing the banner to avoid UI jank
    setTimeout(() => setIsVisible(true), UPDATE_BANNER_DELAY_MS);
  };

  const showUpdateNotification = (info: UpdateInfo) => {
    // If a refresh is already in progress, don't show the banner again
    try {
      if (localStorage.getItem('appUpdateRefreshing') === '1') {
        return;
      }
    } catch (error) {
      console.warn('UpdateNotificationBanner: unable to read refresh flag', error);
    }

    // Do not re-show the same commit banner repeatedly during the same session
    try {
      const lastShown = sessionStorage.getItem('update-banner-commit');
      if (info.commitHash && lastShown === info.commitHash) {
        return;
      }
      if (info.commitHash) {
        sessionStorage.setItem('update-banner-commit', info.commitHash);
      }
    } catch (error) {
      console.warn('UpdateNotificationBanner: unable to persist banner state', error);
    }

    revealWithDelay(info);
  };

  const checkForUpdate = (info: { commitHash: string } & Partial<UpdateInfo>) => {
    if (isPolling) return;
    // Only poll when explicitly enabled via env flag and endpoint is available
    if (!HAS_DEPLOYMENT_ENDPOINT) {
      // Fallback: directly show update notification without polling
      showUpdateNotification(info);
      return;
    }
    pollDeploymentStatus(info.commitHash);
  };

  const hideUpdateNotification = () => {
    setIsVisible(false);
  };

  const dismissUpdateNotification = () => {
    setUpdateAvailable(false);
    setIsVisible(false);
    setUpdateInfo(null);
  };

  // Also listen for service worker update events and surface the banner
  useEffect(() => {
    const onSWUpdate = () => {
      showUpdateNotification({ updateAvailable: true });
    };
    window.addEventListener('sw-update-available', onSWUpdate);
    return () => window.removeEventListener('sw-update-available', onSWUpdate);
  }, []);

  return {
    updateAvailable,
    updateInfo,
    isVisible,
    checkForUpdate, // Changed from showUpdateNotification
    showUpdateNotification,
    hideUpdateNotification,
    dismissUpdateNotification
  };
};

export default UpdateNotificationBanner;
