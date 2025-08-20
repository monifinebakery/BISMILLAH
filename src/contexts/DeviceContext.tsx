// src/contexts/DeviceContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Device type definition
export interface Device {
  id: string;
  user_id: string;
  device_id: string;
  device_name?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  last_active: string;
  created_at: string;
  is_current: boolean;
}

interface DeviceContextType {
  devices: Device[];
  currentDevice: Device | null;
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  updateDeviceName: (deviceId: string, name: string) => Promise<boolean>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  getCurrentDevice: () => Device | null;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Helper function to generate a unique device ID
const generateDeviceId = (): string => {
  // Try to use existing device ID from localStorage
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    // Generate a new device ID
    deviceId = `${btoa(navigator.userAgent)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

// Helper function to get device information
const getDeviceInfo = (): Partial<Device> => {
  const userAgent = navigator.userAgent;
  let deviceType = 'desktop';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect device type
  if (/mobile|android|iphone|ipod|ipad/i.test(userAgent)) {
    deviceType = /ipad/i.test(userAgent) ? 'tablet' : 'mobile';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|iPod/i.test(userAgent)) os = 'iOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  // Detect browser
  if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';

  return {
    device_id: generateDeviceId(),
    device_type: deviceType,
    os,
    browser,
    device_name: `${os} ${deviceType}`, // Default name
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
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
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
    } catch (err) {
      logger.error('Error registering device:', err);
    }
  }, []);

  // Fetch all devices for the user
  const fetchDevices = useCallback(async (userId: string) => {
    try {
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

  // Get current device
  const getCurrentDevice = useCallback(() => currentDevice, [currentDevice]);

  // Set up device tracking
  useEffect(() => {
    const setupDeviceTracking = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('Error getting session:', sessionError);
          return;
        }

        if (session?.user?.id) {
          await registerCurrentDevice(session.user.id);
          await fetchDevices(session.user.id);
        }
      } catch (err) {
        logger.error('Error in setupDeviceTracking:', err);
      }
    };

    setupDeviceTracking();

    // Update last active time periodically
    const interval = setInterval(async () => {
      if (currentDevice) {
        try {
          await supabase
            .from('devices')
            .update({ last_active: new Date().toISOString() })
            .eq('id', currentDevice.id);
        } catch (err) {
          logger.error('Error updating device last active time:', err);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [currentDevice, registerCurrentDevice, fetchDevices]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        registerCurrentDevice(session.user.id);
        fetchDevices(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setDevices([]);
        setCurrentDevice(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [registerCurrentDevice, fetchDevices]);

  const value = {
    devices,
    currentDevice,
    loading,
    error,
    refreshDevices,
    updateDeviceName,
    removeDevice,
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