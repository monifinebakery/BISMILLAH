
// UpdateNotificationBanner.tsx - Auto-update notification system
// ==============================================

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface UpdateNotificationBannerProps {
  isVisible?: boolean;
  onDismiss?: () => void;
  onRefresh?: () => void;
  updateInfo?: {
    newVersion?: string;
    currentVersion?: string;
    commitHash?: string;
    deploymentUrl?: string;
    updateAvailable?: boolean;
  };
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
      try { localStorage.setItem('appUpdateRefreshing', '1'); } catch {}

      // Try to activate the new service worker first (if waiting)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const waiting = registration?.waiting;
        if (waiting) {
          // Listen for controller change then reload
          const controllerChanged = new Promise<void>((resolve) => {
            const onControllerChange = () => {
              navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange as any);
              resolve();
            };
            navigator.serviceWorker.addEventListener('controllerchange', onControllerChange as any);
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
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const VERCEL_TOKEN = import.meta.env.VITE_VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = import.meta.env.VITE_VERCEL_PROJECT_ID;
  const HAS_VERCEL_ENV = Boolean(VERCEL_TOKEN && VERCEL_PROJECT_ID);

  const pollDeploymentStatus = async (commitHash: string, timeout = 5 * 60 * 1000) => {
    // If env vars are not available (e.g., local dev or preview without secrets),
    // silently skip polling and do nothing.
    if (!HAS_VERCEL_ENV) {
      if (import.meta.env.DEV) {
        // Keep logs only in dev to avoid noisy console in production
        console.info('[update] Skipping Vercel polling: env not set');
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
        const response = await fetch(`https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=5`, {
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch Vercel deployments.');
          setIsPolling(false);
          return;
        }

        const data = await response.json();
        const deployment = data.deployments.find((d: any) => d.meta?.githubCommitSha === commitHash);

        // Only show banner when deployment is READY, not during BUILDING or QUEUED
        if (deployment && deployment.state === 'READY') {
          showUpdateNotification({ newVersion: commitHash, deploymentUrl: deployment.url });
          setIsPolling(false);
        } else if (deployment && (deployment.state === 'BUILDING' || deployment.state === 'QUEUED')) {
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


  const showUpdateNotification = (info: any) => {
    // If a refresh is already in progress, don't show the banner again
    try {
      if (localStorage.getItem('appUpdateRefreshing') === '1') {
        return;
      }
    } catch {}

    setUpdateInfo(info);
    setUpdateAvailable(true);
    setIsVisible(true);
  };

  const checkForUpdate = (info: any) => {
    if (isPolling) return;
    // Guard: only poll when Vercel env is available
    if (!HAS_VERCEL_ENV) return;
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
