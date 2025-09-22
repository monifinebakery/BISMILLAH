// src/services/deviceService.ts - SIMPLIFIED VERSION for initial implementation
import { DeviceInfo, getDeviceInfo } from '@/utils/deviceFingerprinting';
import { logger } from '@/utils/logger';
import { safeStorageGet, safeStorageSet } from '@/utils/auth/safeStorage';

const DEVICES_STORAGE_KEY = 'user_devices';
const SYNC_OPERATIONS_KEY = 'sync_operations';

// Simplified interfaces for local storage implementation
export interface DeviceRecord {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  user_agent: string;
  last_active: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  isCurrentDevice?: boolean;
}

export interface SyncOperation {
  id: string;
  user_id: string;
  device_id: string;
  operation_type: 'create' | 'update' | 'delete';
  entity_type: 'operational_cost' | 'recipe' | 'settings';
  entity_id: string;
  data: any;
  timestamp: string;
  synced_devices: string[];
}

// Local storage implementation for now
const getStoredDevices = (userId: string): DeviceRecord[] => {
  try {
    const stored = safeStorageGet(`${DEVICES_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveDevices = (userId: string, devices: DeviceRecord[]): void => {
  safeStorageSet(`${DEVICES_STORAGE_KEY}_${userId}`, JSON.stringify(devices));
};

const getStoredSyncOperations = (userId: string): SyncOperation[] => {
  try {
    const stored = safeStorageGet(`${SYNC_OPERATIONS_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveSyncOperations = (userId: string, operations: SyncOperation[]): void => {
  safeStorageSet(`${SYNC_OPERATIONS_KEY}_${userId}`, JSON.stringify(operations));
};

/**
 * Register current device with the system
 */
export const registerDevice = async (userId: string): Promise<DeviceRecord | null> => {
  try {
    const deviceInfo = await getDeviceInfo();
    const devices = getStoredDevices(userId);

    // Check if device already exists
    const existingDeviceIndex = devices.findIndex(d => d.device_id === deviceInfo.id);

    if (existingDeviceIndex >= 0) {
      // Update existing device
      devices[existingDeviceIndex].last_active = new Date().toISOString();
      devices[existingDeviceIndex].is_active = true;
      devices[existingDeviceIndex].updated_at = new Date().toISOString();
      saveDevices(userId, devices);
      return devices[existingDeviceIndex];
    }

    // Register new device
    const newDevice: DeviceRecord = {
      id: `${userId}_${deviceInfo.id}`,
      user_id: userId,
      device_id: deviceInfo.id,
      device_name: deviceInfo.name,
      device_type: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      user_agent: deviceInfo.userAgent,
      last_active: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    devices.push(newDevice);
    saveDevices(userId, devices);

    logger.info('Device registered:', newDevice);
    return newDevice;
  } catch (error) {
    logger.error('Error in registerDevice:', error);
    return null;
  }
};

/**
 * Get all devices for a user
 */
export const getUserDevices = async (userId: string): Promise<DeviceRecord[]> => {
  try {
    return getStoredDevices(userId);
  } catch (error) {
    logger.error('Error in getUserDevices:', error);
    return [];
  }
};

/**
 * Update device activity
 */
export const updateDeviceActivity = async (deviceId: string, userId: string): Promise<boolean> => {
  try {
    const devices = getStoredDevices(userId);
    const deviceIndex = devices.findIndex(d => d.device_id === deviceId);

    if (deviceIndex >= 0) {
      devices[deviceIndex].last_active = new Date().toISOString();
      devices[deviceIndex].updated_at = new Date().toISOString();
      saveDevices(userId, devices);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error in updateDeviceActivity:', error);
    return false;
  }
};

/**
 * Deactivate a device
 */
export const deactivateDevice = async (deviceId: string, userId: string): Promise<boolean> => {
  try {
    const devices = getStoredDevices(userId);
    const deviceIndex = devices.findIndex(d => d.device_id === deviceId);

    if (deviceIndex >= 0) {
      devices[deviceIndex].is_active = false;
      devices[deviceIndex].updated_at = new Date().toISOString();
      saveDevices(userId, devices);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error in deactivateDevice:', error);
    return false;
  }
};

/**
 * Record sync operation
 */
export const recordSyncOperation = async (
  userId: string,
  deviceId: string,
  operation: Omit<SyncOperation, 'id' | 'user_id' | 'device_id' | 'timestamp' | 'synced_devices'>
): Promise<boolean> => {
  try {
    const operations = getStoredSyncOperations(userId);
    const newOperation: SyncOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      device_id: deviceId,
      ...operation,
      timestamp: new Date().toISOString(),
      synced_devices: [deviceId]
    };

    operations.push(newOperation);
    saveSyncOperations(userId, operations);

    logger.info('Operation recorded for sync:', newOperation);
    return true;
  } catch (error) {
    logger.error('Error in recordSyncOperation:', error);
    return false;
  }
};

/**
 * Get pending sync operations
 */
export const getPendingSyncOperations = async (
  userId: string,
  deviceId: string,
  lastSyncTime?: string
): Promise<SyncOperation[]> => {
  try {
    const operations = getStoredSyncOperations(userId);

    return operations.filter(op => {
      // Not synced to this device
      if (op.synced_devices.includes(deviceId)) return false;

      // After last sync time if provided
      if (lastSyncTime && new Date(op.timestamp) <= new Date(lastSyncTime)) return false;

      return true;
    });
  } catch (error) {
    logger.error('Error in getPendingSyncOperations:', error);
    return [];
  }
};

/**
 * Mark sync operation as completed
 */
export const markSyncCompleted = async (
  operationId: string,
  deviceId: string,
  userId: string
): Promise<boolean> => {
  try {
    const operations = getStoredSyncOperations(userId);
    const operationIndex = operations.findIndex(op => op.id === operationId);

    if (operationIndex >= 0) {
      if (!operations[operationIndex].synced_devices.includes(deviceId)) {
        operations[operationIndex].synced_devices.push(deviceId);
        saveSyncOperations(userId, operations);
        return true;
      }
    }
    return false;
  } catch (error) {
    logger.error('Error in markSyncCompleted:', error);
    return false;
  }
};

/**
 * Setup real-time subscription (simplified for local storage)
 */
export const subscribeToSyncOperations = (
  userId: string,
  deviceId: string,
  onNewOperation: (operation: SyncOperation) => void
) => {
  // For local storage implementation, we'll use polling
  const interval = setInterval(async () => {
    try {
      const operations = await getPendingSyncOperations(userId, deviceId);
      operations.forEach(operation => {
        if (!operation.synced_devices.includes(deviceId)) {
          onNewOperation(operation);
        }
      });
    } catch (error) {
      logger.error('Error in sync polling:', error);
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(interval);
};
