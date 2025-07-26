// 🛠️ Utils Index - Entry point untuk semua utilities

// Import individual utilities
import { formatters } from './formatters.js';
import { calculations } from './calculations.js';
import { validation } from './validation.js';
import { helpers } from './helpers.js';

// Storage utility
export const storage = {
  // Keys for localStorage
  keys: {
    PROMO_FORM_DATA: 'promo_calculator_form_data',
    PROMO_PREFERENCES: 'promo_calculator_preferences',
    PROMO_DRAFT: 'promo_calculator_draft'
  },

  // Save form data to localStorage
  saveFormData: (formData) => {
    try {
      const dataToSave = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(storage.keys.PROMO_FORM_DATA, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.warn('Failed to save form data:', error);
      return false;
    }
  },

  // Load form data from localStorage
  loadFormData: () => {
    try {
      const saved = localStorage.getItem(storage.keys.PROMO_FORM_DATA);
      if (!saved) return null;
      const data = JSON.parse(saved);
      
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
  clearFormData: () => {
    try {
      localStorage.removeItem(storage.keys.PROMO_FORM_DATA);
      return true;
    } catch (error) {
      console.warn('Failed to clear form data:', error);
      return false;
    }
  },

  // Save user preferences
  savePreferences: (preferences) => {
    try {
      localStorage.setItem(storage.keys.PROMO_PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.warn('Failed to save preferences:', error);
      return false;
    }
  },

  // Load user preferences
  loadPreferences: () => {
    try {
      const saved = localStorage.getItem(storage.keys.PROMO_PREFERENCES);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return null;
    }
  },

  // Save draft promo
  saveDraft: (draftData) => {
    try {
      const dataToSave = {
        ...draftData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(storage.keys.PROMO_DRAFT, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.warn('Failed to save draft:', error);
      return false;
    }
  },

  // Load draft promo
  loadDraft: () => {
    try {
      const saved = localStorage.getItem(storage.keys.PROMO_DRAFT);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  },

  // Clear draft
  clearDraft: () => {
    try {
      localStorage.removeItem(storage.keys.PROMO_DRAFT);
      return true;
    } catch (error) {
      console.warn('Failed to clear draft:', error);
      return false;
    }
  },

  // Clear all promo calculator data
  clearAll: () => {
    try {
      Object.values(storage.keys).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('Failed to clear all data:', error);
      return false;
    }
  }
};

// Re-export all utilities
export { formatters } from './formatters.js';
export { calculations } from './calculations.js';
export { validation } from './validation.js';
export { helpers } from './helpers.js';

// Export from the JavaScript file
export * from './promoUtils.js';

// Main utility object for convenience
export const promoUtils = {
  formatters,
  calculations,
  validation,
  storage,
  helpers,
  // Convenience methods
  format: formatters,
  calc: calculations,
  validate: validation,
  store: storage,
  help: helpers
};