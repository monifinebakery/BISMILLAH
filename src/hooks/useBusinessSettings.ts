// src/hooks/useBusinessSettings.ts - Business settings with localStorage fallback
import { useState, useEffect, useCallback } from 'react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { safeStorageGetJSON, safeStorageSetJSON } from '@/utils/auth/safeStorage';
import { logger } from '@/utils/logger';

const BUSINESS_STORAGE_KEY = 'businessSettings';

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
}

const defaultBusinessSettings: BusinessSettings = {
  businessName: 'Bisnis Anda',
  ownerName: 'Nama Anda',
};

/**
 * Hook for business settings that works even when user is not authenticated
 * Uses localStorage as primary storage and syncs with user settings when available
 */
export const useBusinessSettings = () => {
  const { settings: userSettings, saveSettings } = useUserSettings();
  const [localSettings, setLocalSettings] = useState<BusinessSettings>(defaultBusinessSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = safeStorageGetJSON<BusinessSettings>(BUSINESS_STORAGE_KEY);
      if (saved && typeof saved === 'object') {
        // Validate the saved data
        const validatedSettings: BusinessSettings = {
          businessName: typeof saved.businessName === 'string' ? saved.businessName : defaultBusinessSettings.businessName,
          ownerName: typeof saved.ownerName === 'string' ? saved.ownerName : defaultBusinessSettings.ownerName,
        };
        setLocalSettings(validatedSettings);
        logger.debug('BusinessSettings: Loaded from localStorage:', validatedSettings);
      }
    } catch (error) {
      logger.warn('BusinessSettings: Failed to load from localStorage:', error);
    }
  }, []);

  // Sync with user settings when they change (but don't override localStorage)
  useEffect(() => {
    if (userSettings.businessName && userSettings.businessName !== defaultBusinessSettings.businessName) {
      const syncedSettings = {
        businessName: userSettings.businessName,
        ownerName: userSettings.ownerName || localSettings.ownerName,
      };
      setLocalSettings(syncedSettings);
      // Also save to localStorage for consistency
      safeStorageSetJSON(BUSINESS_STORAGE_KEY, syncedSettings).catch(error => {
        logger.warn('BusinessSettings: Failed to sync to localStorage:', error);
      });
    }
  }, [userSettings.businessName, userSettings.ownerName, localSettings.ownerName]);

  // Save business settings - always saves to localStorage, optionally to user settings
  const saveBusinessSettings = useCallback(async (newSettings: Partial<BusinessSettings>) => {
    const updatedSettings = {
      ...localSettings,
      ...newSettings,
    };

    // Always save to localStorage first
    try {
      await safeStorageSetJSON(BUSINESS_STORAGE_KEY, updatedSettings);
      setLocalSettings(updatedSettings);
      logger.debug('BusinessSettings: Saved to localStorage:', updatedSettings);

      // Try to save to user settings if user is authenticated
      const userSettingsSuccess = await saveSettings({
        businessName: updatedSettings.businessName,
        ownerName: updatedSettings.ownerName,
      });

      if (!userSettingsSuccess) {
        logger.warn('BusinessSettings: Failed to save to user settings, but localStorage saved successfully');
      } else {
        logger.debug('BusinessSettings: Saved to both localStorage and user settings');
      }

      return true;
    } catch (error) {
      logger.error('BusinessSettings: Failed to save business settings:', error);
      return false;
    }
  }, [localSettings, saveSettings]);

  return {
    businessSettings: localSettings,
    saveBusinessSettings,
  };
};
