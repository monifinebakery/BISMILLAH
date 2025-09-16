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
      // Clear cache and reload
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
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
      
      // Force reload page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
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
      <Alert className="border-0 bg-transparent text-white rounded-none">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-orange-200" />
              <AlertTriangle className="h-4 w-4 text-yellow-300 animate-pulse" />
            </div>
            
            <div className="flex-1">
              <AlertDescription className="text-white font-medium">
                🎉 <strong>Update tersedia!</strong> Aplikasi telah diperbarui dengan fitur terbaru.
                {updateInfo?.newVersion && (
                  <span className="ml-2 text-orange-200 text-sm">
                    v{updateInfo.newVersion}
                  </span>
                )}
              </AlertDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
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
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Now
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

  const showUpdateNotification = (info: any) => {
    setUpdateInfo(info);
    setUpdateAvailable(true);
    setIsVisible(true);
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
    showUpdateNotification,
    hideUpdateNotification,
    dismissUpdateNotification
  };
};

export default UpdateNotificationBanner;