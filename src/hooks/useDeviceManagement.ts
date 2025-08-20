// src/hooks/useDeviceManagement.ts
import { useDevice } from '@/contexts/DeviceContext';

export const useDeviceManagement = () => {
  const {
    devices,
    currentDevice,
    loading,
    error,
    refreshDevices,
    updateDeviceName,
    removeDevice,
    getCurrentDevice
  } = useDevice();

  return {
    // Device list
    devices,
    currentDevice,
    
    // Loading and error states
    loading,
    error,
    
    // Device actions
    refreshDevices,
    updateDeviceName,
    removeDevice,
    getCurrentDevice,
    
    // Convenience getters
    deviceCount: devices.length,
    hasMultipleDevices: devices.length > 1,
    isCurrentDevice: (deviceId: string) => currentDevice?.id === deviceId,
    
    // Helper functions
    getDeviceById: (deviceId: string) => devices.find(d => d.id === deviceId) || null,
    getOtherDevices: () => devices.filter(d => !d.is_current),
  };
};