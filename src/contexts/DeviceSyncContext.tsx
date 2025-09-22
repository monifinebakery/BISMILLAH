// src/contexts/DeviceSyncContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  registerDevice,
  getUserDevices,
  updateDeviceActivity,
  deactivateDevice,
  recordSyncOperation,
  getPendingSyncOperations,
  markSyncCompleted,
  subscribeToSyncOperations,
  DeviceRecord,
  SyncOperation
} from '@/services/deviceService';
import { getDeviceInfo } from '@/utils/deviceFingerprinting';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface DeviceSyncContextType {
  // Device management
  currentDevice: DeviceRecord | null;
  userDevices: DeviceRecord[];
  isLoading: boolean;

  // Sync operations
  pendingOperations: SyncOperation[];
  isOnline: boolean;

  // Actions
  refreshDevices: () => Promise<void>;
  deactivateDeviceById: (deviceId: string) => Promise<boolean>;
  syncPendingOperations: () => Promise<void>;

  // Real-time sync
  recordOperation: (operation: Omit<SyncOperation, 'id' | 'user_id' | 'device_id' | 'timestamp' | 'synced_devices'>) => Promise<boolean>;
}

const DeviceSyncContext = createContext<DeviceSyncContextType | undefined>(undefined);

export const DeviceSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentDevice, setCurrentDevice] = useState<DeviceRecord | null>(null);
  const [userDevices, setUserDevices] = useState<DeviceRecord[]>([]);
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string | undefined>();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (user && currentDevice) {
        syncPendingOperations();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, currentDevice]);

  // Initialize device registration
  useEffect(() => {
    if (user) {
      initializeDevice();
    }
  }, [user]);

  // Setup real-time sync subscription
  useEffect(() => {
    if (!user || !currentDevice) return;

    const unsubscribe = subscribeToSyncOperations(
      user.id,
      currentDevice.device_id,
      handleNewSyncOperation
    );

    return unsubscribe;
  }, [user, currentDevice]);

  // Periodic activity update
  useEffect(() => {
    if (!currentDevice) return;

    const interval = setInterval(() => {
      updateDeviceActivity(currentDevice.device_id);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [currentDevice]);

  const initializeDevice = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Register current device
      const device = await registerDevice(user.id);
      if (device) {
        setCurrentDevice(device);
        logger.info('Device registered:', device);
      }

      // Load all user devices
      await refreshDevices();

      // Load pending operations
      await loadPendingOperations();

    } catch (error) {
      logger.error('Error initializing device:', error);
      toast.error('Gagal menginisialisasi sinkronisasi perangkat');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDevices = async () => {
    if (!user) return;

    try {
      const devices = await getUserDevices(user.id);

      // Mark current device
      const devicesWithCurrent = devices.map(device => ({
        ...device,
        isCurrentDevice: device.device_id === currentDevice?.device_id
      }));

      setUserDevices(devicesWithCurrent);
    } catch (error) {
      logger.error('Error refreshing devices:', error);
    }
  };

  const deactivateDeviceById = async (deviceId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await deactivateDevice(deviceId, user.id);
      if (success) {
        await refreshDevices();
        toast.success('Perangkat berhasil dinonaktifkan');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deactivating device:', error);
      toast.error('Gagal menonaktifkan perangkat');
      return false;
    }
  };

  const loadPendingOperations = async () => {
    if (!user || !currentDevice) return;

    try {
      const operations = await getPendingSyncOperations(user.id, currentDevice.device_id, lastSyncTime);
      setPendingOperations(operations);
    } catch (error) {
      logger.error('Error loading pending operations:', error);
    }
  };

  const syncPendingOperations = async () => {
    if (!isOnline || !user || !currentDevice) return;

    setIsLoading(true);
    try {
      const operations = pendingOperations;

      for (const operation of operations) {
        try {
          // Apply operation locally
          await applySyncOperation(operation);

          // Mark as synced for this device
          await markSyncCompleted(operation.id, currentDevice.device_id);

          logger.info('Operation synced:', operation);
        } catch (error) {
          logger.error('Error applying sync operation:', error);
          // Continue with next operation
        }
      }

      // Refresh pending operations
      await loadPendingOperations();
      setLastSyncTime(new Date().toISOString());

      if (operations.length > 0) {
        toast.success(`${operations.length} operasi berhasil disinkronkan`);
      }

    } catch (error) {
      logger.error('Error syncing operations:', error);
      toast.error('Gagal menyinkronkan operasi');
    } finally {
      setIsLoading(false);
    }
  };

  const applySyncOperation = async (operation: SyncOperation) => {
    // Apply the operation based on type
    switch (operation.operation_type) {
      case 'create':
        await handleCreateOperation(operation);
        break;
      case 'update':
        await handleUpdateOperation(operation);
        break;
      case 'delete':
        await handleDeleteOperation(operation);
        break;
    }
  };

  const handleCreateOperation = async (operation: SyncOperation) => {
    // For now, just log the operation - full implementation later
    logger.info('Would apply create operation:', operation);
    // TODO: Integrate with operational cost context when ready
  };

  const handleUpdateOperation = async (operation: SyncOperation) => {
    logger.info('Would apply update operation:', operation);
    // TODO: Integrate with operational cost context when ready
  };

  const handleDeleteOperation = async (operation: SyncOperation) => {
    logger.info('Would apply delete operation:', operation);
    // TODO: Integrate with operational cost context when ready
  };

  const handleNewSyncOperation = useCallback((operation: SyncOperation) => {
    // Add to pending operations
    setPendingOperations(prev => [...prev, operation]);

    // Auto-apply if online
    if (isOnline) {
      applySyncOperation(operation).then(() => {
        if (currentDevice) {
          markSyncCompleted(operation.id, currentDevice.device_id);
        }
        toast.info(`Data dari perangkat lain telah disinkronkan`);
      });
    }
  }, [isOnline, currentDevice]);

  const recordOperation = async (
    operation: Omit<SyncOperation, 'id' | 'user_id' | 'device_id' | 'timestamp' | 'synced_devices'>
  ): Promise<boolean> => {
    if (!user || !currentDevice) return false;

    try {
      const success = await recordSyncOperation(user.id, currentDevice.device_id, operation);
      if (success) {
        logger.info('Operation recorded for sync:', operation);
      }
      return success;
    } catch (error) {
      logger.error('Error recording operation:', error);
      return false;
    }
  };

  const value: DeviceSyncContextType = {
    currentDevice,
    userDevices,
    isLoading,
    pendingOperations,
    isOnline,
    refreshDevices,
    deactivateDeviceById,
    syncPendingOperations,
    recordOperation
  };

  return (
    <DeviceSyncContext.Provider value={value}>
      {children}
    </DeviceSyncContext.Provider>
  );
};

export const useDeviceSync = () => {
  const context = useContext(DeviceSyncContext);
  if (context === undefined) {
    throw new Error('useDeviceSync must be used within a DeviceSyncProvider');
  }
  return context;
};
