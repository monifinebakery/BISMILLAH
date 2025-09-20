// useAutoUpdate.ts - Auto-update integration hook
// ==============================================

import { useState, useEffect, useCallback } from 'react';
import { updateService, type UpdateCheckResult } from '@/services/updateService';
import { logger } from '@/utils/logger';
import { useSimpleNotificationSafe } from '@/contexts/SimpleNotificationContext';

export interface UseAutoUpdateOptions {
  // Update check interval in minutes (default: 5)
  checkInterval?: number;
  
  // Auto-start checking on hook initialization (default: true)
  autoStart?: boolean;
  
  // Enable in development mode (default: false)
  enableInDev?: boolean;
  
  // Show notifications for updates (default: true)
  showNotifications?: boolean;
  
  // Callback when update is detected
  onUpdateDetected?: (result: UpdateCheckResult) => void;
  
  // Callback when update check fails
  onUpdateCheckError?: (error: Error) => void;
}

export const useAutoUpdate = (options: UseAutoUpdateOptions = {}) => {
  const {
    checkInterval = 5,
    autoStart = true,
    enableInDev = false,
    showNotifications = true,
    onUpdateDetected,
    onUpdateCheckError
  } = options;

  // State
  const [isChecking, setIsChecking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  
  // Use our new simple notification system (safe version)
  const notificationContext = useSimpleNotificationSafe();
  const addNotification = notificationContext?.addNotification;

  // Check if we should run update checks
  const shouldRunUpdateChecks = useCallback(() => {
    // Skip in development unless explicitly enabled
    if (updateService.isDevelopment() && !enableInDev) {
      logger.debug('🚫 Auto-update disabled in development mode');
      return false;
    }
    
    // Skip if window is not focused (battery optimization)
    if (typeof document !== 'undefined' && document.hidden) {
      logger.debug('🚫 Auto-update paused - window not focused');
      return false;
    }

    return true;
  }, [enableInDev]);

  // Handle update detection
  const handleUpdateDetected = useCallback((result: UpdateCheckResult) => {
    logger.success('🎉 Update detected!', result);
    
    setUpdateResult(result);
    setLastCheck(new Date());
    
    // Show notification if enabled and notification context is available
    if (showNotifications && result.hasUpdate && addNotification) {
      addNotification({
        title: 'Update Tersedia',
        message: `Versi baru aplikasi tersedia. Versi saat ini: ${result.currentVersion.version}, Versi baru: ${result.latestVersion?.version}`,
        type: 'info'
      });
    }
    
    // Call custom callback
    if (onUpdateDetected) {
      onUpdateDetected(result);
    }
  }, [showNotifications, addNotification, onUpdateDetected]);

  // Handle update check error
  const handleUpdateCheckError = useCallback((error: Error) => {
    logger.error('❌ Update check failed:', error);
    setLastCheck(new Date());
    
    if (onUpdateCheckError) {
      onUpdateCheckError(error);
    }
  }, [onUpdateCheckError]);

  // Start update checking
  const startUpdateChecking = useCallback(() => {
    if (!shouldRunUpdateChecks()) {
      return;
    }

    logger.info('🚀 Starting auto-update checking...', { 
      interval: `${checkInterval} minutes`,
      environment: updateService.isDevelopment() ? 'development' : 'production'
    });

    // Set check interval
    updateService.setCheckInterval(checkInterval);
    
    // Start periodic checking
    updateService.startPeriodicCheck((result) => {
      handleUpdateDetected(result);
    });

    setIsEnabled(true);
  }, [checkInterval, shouldRunUpdateChecks, handleUpdateDetected]);

  // Stop update checking
  const stopUpdateChecking = useCallback(() => {
    logger.info('🛑 Stopping auto-update checking...');
    updateService.stopPeriodicCheck();
    setIsEnabled(false);
  }, []);

  // Manual update check
  const checkForUpdatesNow = useCallback(async () => {
    if (!shouldRunUpdateChecks()) {
      logger.warn('⚠️ Update checks are disabled');
      return null;
    }

    setIsChecking(true);
    
    try {
      logger.info('🔄 Manual update check triggered...');
      const result = await updateService.forceCheck();
      
      handleUpdateDetected(result);
      return result;
    } catch (error) {
      handleUpdateCheckError(error as Error);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [shouldRunUpdateChecks, handleUpdateDetected, handleUpdateCheckError]);

  // Initialize on mount
  useEffect(() => {
    if (autoStart && shouldRunUpdateChecks()) {
      // Small delay to let app initialize
      const timer = setTimeout(() => {
        startUpdateChecking();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldRunUpdateChecks, startUpdateChecking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUpdateChecking();
    };
  }, [stopUpdateChecking]);

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause checking
        if (isEnabled) {
          logger.debug('⏸️ Pausing update checks - tab hidden');
          stopUpdateChecking();
        }
      } else {
        // Page is visible, resume checking
        if (!isEnabled && shouldRunUpdateChecks()) {
          logger.debug('▶️ Resuming update checks - tab visible');
          startUpdateChecking();
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isEnabled, shouldRunUpdateChecks, startUpdateChecking, stopUpdateChecking]);

  // Get current app info
  const getCurrentVersion = useCallback(() => {
    return updateService.getCurrentVersionInfo();
  }, []);

  // Get build info string
  const getBuildInfo = useCallback(() => {
    return updateService.getBuildInfo();
  }, []);

  return {
    // State
    isEnabled,
    isChecking,
    lastCheck,
    updateResult,
    hasUpdate: updateResult?.hasUpdate || false,
    
    // Actions
    startUpdateChecking,
    stopUpdateChecking,
    checkForUpdatesNow,
    
    // Info
    getCurrentVersion,
    getBuildInfo,
    isDevelopment: updateService.isDevelopment(),
  };
};

export default useAutoUpdate;