// 💾 Storage utilities untuk localStorage management
import { safeStorageSet, safeStorageGet, safeStorageSetJSON, safeStorageGetJSON, safeStorageRemove } from '@/utils/auth/safeStorage';

export const storage = {
  // Keys for localStorage
  keys: {
    PROMO_FORM_DATA: 'promo_calculator_form_data',
    PROMO_PREFERENCES: 'promo_calculator_preferences',
    PROMO_DRAFT: 'promo_calculator_draft'
  },

  // Save form data to localStorage
  saveFormData: async (formData) => {
    try {
      const dataToSave = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      return await safeStorageSetJSON(storage.keys.PROMO_FORM_DATA, dataToSave);
    } catch (error) {
      console.warn('Failed to save form data:', error);
      return false;
    }
  },

  // Load form data from localStorage
  loadFormData: () => {
    try {
      const data = safeStorageGetJSON(storage.keys.PROMO_FORM_DATA);
      if (!data) return null;

      // Check if data is not too old (24 hours)
      const timestamp = new Date(data.timestamp);
      const now = new Date();
      const hoursDiff = (now - timestamp) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        storage.clearFormData();
        return null;
      }
      return data;
    } catch (error) {
      console.warn('Failed to load form data:', error);
      return null;
    }
  },

  // Clear form data
  clearFormData: async () => {
    try {
      return await safeStorageRemove(storage.keys.PROMO_FORM_DATA);
    } catch (error) {
      console.warn('Failed to clear form data:', error);
      return false;
    }
  },

  // Save user preferences
  savePreferences: async (preferences) => {
    try {
      return await safeStorageSetJSON(storage.keys.PROMO_PREFERENCES, preferences);
    } catch (error) {
      console.warn('Failed to save preferences:', error);
      return false;
    }
  },

  // Load user preferences
  loadPreferences: () => {
    try {
      return safeStorageGetJSON(storage.keys.PROMO_PREFERENCES);
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return null;
    }
  },

  // Save draft promo
  saveDraft: async (draftData) => {
    try {
      const dataToSave = {
        ...draftData,
        timestamp: new Date().toISOString()
      };
      return await safeStorageSetJSON(storage.keys.PROMO_DRAFT, dataToSave);
    } catch (error) {
      console.warn('Failed to save draft:', error);
      return false;
    }
  },

  // Load draft promo
  loadDraft: () => {
    try {
      return safeStorageGetJSON(storage.keys.PROMO_DRAFT);
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  },

  // Clear draft
  clearDraft: async () => {
    try {
      return await safeStorageRemove(storage.keys.PROMO_DRAFT);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
      return false;
    }
  },

  // Clear all promo calculator data
  clearAll: async () => {
    try {
      const keys = Object.values(storage.keys);
      const results = await Promise.all(keys.map(key => safeStorageRemove(key)));
      return results.every(result => result === true);
    } catch (error) {
      console.warn('Failed to clear all data:', error);
      return false;
    }
  }
};