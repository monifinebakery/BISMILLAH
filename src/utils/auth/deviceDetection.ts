// src/utils/auth/deviceDetection.ts - Device Detection and Capabilities
import { logger } from '@/utils/logger';

export interface DeviceCapabilities {
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  networkType: string;
  isSlowDevice: boolean;
  userAgent: string;
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isSafari: boolean;
}

export const detectDeviceCapabilities = (): DeviceCapabilities => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || 'unknown' : 'unknown';
  
  const capabilities: DeviceCapabilities = {
    hasLocalStorage: false,
    hasSessionStorage: false,
    networkType: 'unknown',
    isSlowDevice: false,
    userAgent,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isAndroid: /Android/i.test(userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(userAgent),
    isSafari: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent),
  };

  // Test localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('__test__', 'test');
      localStorage.removeItem('__test__');
      capabilities.hasLocalStorage = true;
    }
  } catch {
    logger.warn('localStorage not available or restricted');
  }

  // Test sessionStorage
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('__test__', 'test');
      sessionStorage.removeItem('__test__');
      capabilities.hasSessionStorage = true;
    }
  } catch {
    logger.warn('sessionStorage not available or restricted');
  }

  // Detect network type
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    capabilities.networkType = connection?.effectiveType || 'unknown';
  }

  // Detect slow device (simplified heuristic)
  const isSlowDevice = 
    capabilities.userAgent.includes('Android 4') || 
    capabilities.userAgent.includes('iPhone OS 10') ||
    !capabilities.hasLocalStorage ||
    capabilities.networkType === 'slow-2g' ||
    capabilities.networkType === '2g';
    
  capabilities.isSlowDevice = isSlowDevice;

  logger.debug('Device capabilities detected:', capabilities);
  return capabilities;
};

export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isSlowConnection = (): boolean => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) return false;
  
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;
  
  return effectiveType === 'slow-2g' || effectiveType === '2g';
};