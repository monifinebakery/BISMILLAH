// src/contexts/DeviceContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Device type definition
export interface Device {
  id: string;
  user_id: string;
  device_id: string;
  device_name?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  ip_address?: string | null;
  last_active: string | null;
  created_at: string | null;
  is_current: boolean | null;
}

interface DeviceContextType {
  devices: Device[];
  currentDevice: Device | null;
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  updateDeviceName: (deviceId: string, name: string) => Promise<boolean>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  removeAllOtherDevices: () => Promise<boolean>;
  cleanupOldDevices: (userId: string) => Promise<void>;
  getCurrentDevice: () => Device | null;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Helper function to generate a unique device ID with enhanced stability
const generateDeviceId = (): string => {
  // Try to use existing device ID from localStorage
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    // Generate a more stable device ID based on comprehensive browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Enhanced fingerprinting components for better stability
    const components = {
      userAgent: navigator.userAgent,
      language: navigator.language || navigator.languages?.[0] || 'en',
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: new Date().getTimezoneOffset(),
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      canvas: ''
    };
    
    // Enhanced canvas fingerprinting for better device identification
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '11pt Arial';
      ctx.fillText('Device fingerprint 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18pt Arial';
      ctx.fillText('BISMILLAH', 4, 45);
      
      // Add some geometric shapes for more uniqueness
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      
      components.canvas = canvas.toDataURL();
    }
    
    // Create fingerprint string from all components
    const fingerprint = Object.values(components).join('|');
    
    // Create a stable hash of the fingerprint
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex string for consistency
    const hashString = Math.abs(hash).toString(16).padStart(8, '0');
    
    // Add additional entropy from localStorage persistence test
    const storageTest = Math.random().toString(36).substring(2, 8);
    
    deviceId = `device_${hashString}_${storageTest}_${Date.now()}`;
    
    try {
      localStorage.setItem('device_id', deviceId);
      // Test localStorage persistence
      const testRead = localStorage.getItem('device_id');
      if (testRead !== deviceId) {
        // Storage might be disabled or in private mode
        deviceId = `temp_${hashString}_${Date.now()}`;
      }
    } catch (e) {
      // localStorage not available, use session-based ID
      deviceId = `session_${hashString}_${Date.now()}`;
    }
  }
  
  return deviceId;
};

// Helper function to get enhanced device information
const getDeviceInfo = (): Partial<Device> => {
  const userAgent = navigator.userAgent.toLowerCase();
  let deviceType = 'desktop';
  let os = 'Unknown';
  let browser = 'Unknown';
  let deviceName = 'Unknown Device';

  // Enhanced device type detection
  if (/ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|kindle|silk|playbook|nexus (?!.*mobile)/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  // Enhanced OS detection with version information
  if (/windows nt 10/i.test(userAgent)) {
    os = 'Windows 10+';
  } else if (/windows nt 6\.3/i.test(userAgent)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.2/i.test(userAgent)) {
    os = 'Windows 8';
  } else if (/windows nt 6\.1/i.test(userAgent)) {
    os = 'Windows 7';
  } else if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/intel mac os x 10_([0-9]+)/i.test(userAgent)) {
    const version = userAgent.match(/intel mac os x 10_([0-9]+)/i)?.[1];
    os = version ? `macOS 10.${version}` : 'macOS';
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    os = 'macOS';
  } else if (/android ([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/android ([0-9\.]+)/i)?.[1];
    os = `Android ${version || ''}`;
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iphone os ([0-9_]+)/i.test(userAgent)) {
    const version = userAgent.match(/iphone os ([0-9_]+)/i)?.[1]?.replace(/_/g, '.');
    os = `iOS ${version || ''}`;
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'iOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/cros/i.test(userAgent)) {
    os = 'ChromeOS';
  }

  // Enhanced browser detection with version
  if (/edg\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/edg\/([0-9\.]+)/i)?.[1];
    browser = `Edge ${version?.split('.')[0] || ''}`;
  } else if (/chrome\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/chrome\/([0-9\.]+)/i)?.[1];
    browser = `Chrome ${version?.split('.')[0] || ''}`;
  } else if (/firefox\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/firefox\/([0-9\.]+)/i)?.[1];
    browser = `Firefox ${version?.split('.')[0] || ''}`;
  } else if (/version\/([0-9\.]+).*safari/i.test(userAgent)) {
    const version = userAgent.match(/version\/([0-9\.]+)/i)?.[1];
    browser = `Safari ${version?.split('.')[0] || ''}`;
  } else if (/safari/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/opera|opr\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/(?:opera|opr)\/([0-9\.]+)/i)?.[1];
    browser = `Opera ${version?.split('.')[0] || ''}`;
  }

  // Generate a more descriptive device name
  const screenInfo = `${screen.width}×${screen.height}`;
  const deviceTypeFormatted = deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
  
  if (deviceType === 'mobile') {
    deviceName = `${os} ${deviceTypeFormatted}`;
  } else if (deviceType === 'tablet') {
    deviceName = `${os} ${deviceTypeFormatted} (${screenInfo})`;
  } else {
    deviceName = `${os} ${deviceTypeFormatted} - ${browser}`;
  }

  return {
    device_id: generateDeviceId(),
    device_type: deviceType,
    os,
    browser,
    device_name: deviceName,
  };
};

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Register current device
  const registerCurrentDevice = useCallback(async (userId: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      const deviceId = deviceInfo.device_id as string;
      
      // Get IP address (in a real implementation, this would come from the server)
      const ipAddress = ''; // We'll leave this empty for privacy
      
      // Check if device already exists
      const { data: existingDevice, error: fetchError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows

      if (fetchError) {
        logger.error('Error checking existing device:', fetchError);
        return;
      }

      // Update last active time
      const deviceData = {
        user_id: userId,
        device_id: deviceId,
        device_type: deviceInfo.device_type,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        device_name: deviceInfo.device_name,
        ip_address: ipAddress,
        last_active: new Date().toISOString(),
        is_current: true,
      };

      if (existingDevice) {
        // Update existing device
        const { data, error: updateError } = await supabase
          .from('devices')
          .update(deviceData)
          .eq('id', existingDevice.id)
          .select()
          .single();

        if (updateError) {
          logger.error('Error updating device:', updateError);
        } else {
          setCurrentDevice(data);
        }
      } else {
        // Insert new device
        const { data, error: insertError } = await supabase
          .from('devices')
          .insert(deviceData)
          .select()
          .single();

        if (insertError) {
          logger.error('Error inserting device:', insertError);
        } else {
          setCurrentDevice(data);
        }
      }

      // Mark other devices as not current
      await supabase
        .from('devices')
        .update({ is_current: false })
        .neq('device_id', deviceId)
        .eq('user_id', userId);

      // Cleanup old devices periodically
      await cleanupOldDevices(userId);
    } catch (err) {
      logger.error('Error registering device:', err);
    }
  }, []);

  // Fetch all devices for the user
  const fetchDevices = useCallback(async (userId: string) => {
    try {
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('DeviceContext: fetchDevices called for user', userId);
      }
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (fetchError) {
        logger.error('Error fetching devices:', fetchError);
        setError(fetchError.message);
        return;
      }

      setDevices(data || []);
      
      // Find current device
      const current = (data || []).find(device => device.is_current) || null;
      setCurrentDevice(current);
    } catch (err) {
      logger.error('Error in fetchDevices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh devices list
  const refreshDevices = useCallback(async () => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('DeviceContext: refreshDevices called');
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await fetchDevices(session.user.id);
      }
    } catch (err) {
      logger.error('Error refreshing devices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [fetchDevices]);

  // Update device name
  const updateDeviceName = useCallback(async (deviceId: string, name: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ device_name: name })
        .eq('id', deviceId);

      if (error) {
        logger.error('Error updating device name:', error);
        setError(error.message);
        return false;
      }

      // Refresh the devices list
      await refreshDevices();
      return true;
    } catch (err) {
      logger.error('Error in updateDeviceName:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [refreshDevices]);

  // Remove a device (sign out from that device)
  const removeDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      // Check if this is the current device
      const isCurrent = currentDevice?.id === deviceId;
      
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        logger.error('Error removing device:', error);
        setError(error.message);
        return false;
      }

      // If this was the current device, sign out
      if (isCurrent) {
        await supabase.auth.signOut();
      }

      // Refresh the devices list
      await refreshDevices();
      return true;
    } catch (err) {
      logger.error('Error in removeDevice:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [currentDevice, refreshDevices]);

  // Clean up old and inactive devices
  const cleanupOldDevices = useCallback(async (userId: string) => {
    try {
      // Get all devices for the user
      const { data: allDevices, error: fetchError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (fetchError) {
        logger.error('Error fetching devices for cleanup:', fetchError);
        return;
      }

      if (!allDevices || allDevices.length <= 5) {
        // If 5 or fewer devices, no cleanup needed
        return;
      }

      // Keep the most recent 5 devices and remove older ones
      const devicesToKeep = allDevices.slice(0, 5);
      const devicesToRemove = allDevices.slice(5);

      if (devicesToRemove.length > 0) {
        const deviceIdsToRemove = devicesToRemove.map(d => d.id);
        
        const { error: deleteError } = await supabase
          .from('devices')
          .delete()
          .in('id', deviceIdsToRemove);

        if (deleteError) {
          logger.error('Error cleaning up old devices:', deleteError);
        } else {
          logger.info(`Cleaned up ${devicesToRemove.length} old devices`);
        }
      }

      // Also remove devices that haven't been active for more than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error: inactiveDeleteError } = await supabase
        .from('devices')
        .delete()
        .eq('user_id', userId)
        .lt('last_active', thirtyDaysAgo.toISOString());

      if (inactiveDeleteError) {
        logger.error('Error cleaning up inactive devices:', inactiveDeleteError);
      }
    } catch (err) {
      logger.error('Error in cleanupOldDevices:', err);
    }
  }, []);

  // Remove all devices except current (sign out from all other devices)
  const removeAllOtherDevices = useCallback(async (): Promise<boolean> => {
    try {
      if (!currentDevice) {
        return false;
      }

      const { error } = await supabase
        .from('devices')
        .delete()
        .neq('id', currentDevice.id)
        .eq('user_id', currentDevice.user_id);

      if (error) {
        logger.error('Error removing other devices:', error);
        setError(error.message);
        return false;
      }

      // Refresh the devices list
      await refreshDevices();
      return true;
    } catch (err) {
      logger.error('Error in removeAllOtherDevices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [currentDevice, refreshDevices]);

  // Get current device
  const getCurrentDevice = useCallback(() => currentDevice, [currentDevice]);

  // Set up device tracking - ONLY register current device, don't fetch devices automatically
  useEffect(() => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('DeviceContext: device tracking useEffect running');
    }
    
    let isActive = true;
    let intervalId: NodeJS.Timeout | null = null;

    const setupDeviceTracking = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isActive) return;
        
        if (sessionError) {
          logger.error('Error getting session:', sessionError);
          return;
        }

        if (session?.user?.id) {
          await registerCurrentDevice(session.user.id);
          // Don't automatically fetch devices here - let the component decide when to fetch
        }
      } catch (err) {
        logger.error('Error in setupDeviceTracking:', err);
      }
    };

    setupDeviceTracking();

    // Only set up interval if we have a current device
    if (currentDevice) {
      intervalId = setInterval(async () => {
        if (isActive && currentDevice) {
          try {
            // Only log this in development
            if (import.meta.env.DEV) {
              console.log('DeviceContext: Updating last active time for device', currentDevice.id);
            }
            await supabase
              .from('devices')
              .update({ last_active: new Date().toISOString() })
              .eq('id', currentDevice.id);
          } catch (err) {
            logger.error('Error updating device last active time:', err);
          }
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    }

    return () => {
      // Only log cleanup in development
      if (import.meta.env.DEV) {
        console.log('DeviceContext: device tracking cleanup');
      }
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [registerCurrentDevice]); // Only depend on registerCurrentDevice, not currentDevice

  // Listen for auth state changes - ONLY register device, don't fetch automatically
  useEffect(() => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('DeviceContext: auth state change useEffect running');
    }
    
    let isActive = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('DeviceContext: Auth state changed:', event);
      if (!isActive) return;
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        registerCurrentDevice(session.user.id);
        // Don't automatically fetch devices here - let the component decide when to fetch
      } else if (event === 'SIGNED_OUT') {
        setDevices([]);
        setCurrentDevice(null);
      }
    });

    return () => {
      // Only log cleanup in development
      if (import.meta.env.DEV) {
        console.log('DeviceContext: auth state change cleanup');
      }
      isActive = false;
      subscription.unsubscribe();
    };
  }, [registerCurrentDevice]);

  const value = {
    devices,
    currentDevice,
    loading,
    error,
    refreshDevices,
    updateDeviceName,
    removeDevice,
    removeAllOtherDevices,
    cleanupOldDevices,
    getCurrentDevice,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};