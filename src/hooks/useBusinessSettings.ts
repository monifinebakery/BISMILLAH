// src/hooks/useBusinessSettings.ts - Direct database storage for business settings
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { logger } from '@/utils/logger';

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
}

/**
 * Hook for business settings that saves directly to database user_settings
 * Uses UserSettingsContext for database persistence
 */
export const useBusinessSettings = () => {
  const { settings, saveSettings } = useUserSettings();

  // Extract business settings from user settings
  const businessSettings: BusinessSettings = {
    businessName: settings.businessName || 'Bisnis Anda',
    ownerName: settings.ownerName || 'Nama Anda',
  };

  // Save business settings directly to database via UserSettingsContext
  const saveBusinessSettings = async (newSettings: Partial<BusinessSettings>) => {
    try {
      const settingsToUpdate = {
        businessName: newSettings.businessName || businessSettings.businessName,
        ownerName: newSettings.ownerName || businessSettings.ownerName,
      };

      const success = await saveSettings(settingsToUpdate);

      if (success) {
        logger.debug('BusinessSettings: Saved to database successfully');
        return true;
      } else {
        logger.warn('BusinessSettings: Failed to save to database');
        return false;
      }
    } catch (error) {
      logger.error('BusinessSettings: Error saving to database:', error);
      return false;
    }
  };

  return {
    businessSettings,
    saveBusinessSettings,
  };
};
