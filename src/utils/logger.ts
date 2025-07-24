// src/utils/logger.ts
// Safe environment variable access for browser
const getEnvVar = (name: string, defaultValue: string = ''): string => {
  try {
    // Try Vite's import.meta.env first (recommended for Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[name] || defaultValue;
    }
    
    // Fallback to process.env if available
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name] || defaultValue;
    }
    
    // Last fallback to window environment variables (if set by bundler)
    if (typeof window !== 'undefined' && (window as any).__ENV__) {
      return (window as any).__ENV__[name] || defaultValue;
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to get environment variable ${name}:`, error);
    return defaultValue;
  }
};

// Safe environment detection
const isDev = (() => {
  try {
    // Check Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.DEV === true || import.meta.env.MODE === 'development';
    }
    
    // Check Node environment (fallback)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
    
    // Default to development for safety
    return true;
  } catch (error) {
    console.warn('Failed to detect environment:', error);
    return true; // Default to development
  }
})();

const debugContext = getEnvVar('VITE_DEBUG_CONTEXT', 'true') === 'true';
const debugLevel = getEnvVar('VITE_DEBUG_LEVEL', 'info');

export const logger = {
  /**
   * Context logging - untuk log dari context providers
   * Hanya tampil jika VITE_DEBUG_CONTEXT=true
   */
  context: (contextName: string, message: string, data?: any) => {
    if (isDev && debugContext) {
      if (data !== undefined) {
        console.log(`[${contextName}]`, message, data);
      } else {
        console.log(`[${contextName}]`, message);
      }
    }
  },

  /**
   * Info logging - untuk informasi umum
   * Tampil di development dengan level verbose/info
   */
  info: (message: string, data?: any) => {
    if (isDev && ['verbose', 'info'].includes(debugLevel)) {
      if (data !== undefined) {
        console.log('ℹ️', message, data);
      } else {
        console.log('ℹ️', message);
      }
    }
  },

  /**
   * Warning logging - untuk peringatan
   * Tampil di development dengan level verbose/info/warn
   */
  warn: (message: string, data?: any) => {
    if (['verbose', 'info', 'warn'].includes(debugLevel)) {
      if (data !== undefined) {
        console.warn('⚠️', message, data);
      } else {
        console.warn('⚠️', message);
      }
    }
  },

  /**
   * Error logging - untuk error
   * Selalu tampil di semua environment
   */
  error: (message: string, error?: any) => {
    if (error !== undefined) {
      console.error('🚨', message, error);
    } else {
      console.error('🚨', message);
    }
  },

  /**
   * Debug logging - untuk debugging detail
   * Hanya tampil dengan level verbose
   */
  debug: (message: string, data?: any) => {
    if (isDev && debugLevel === 'verbose') {
      if (data !== undefined) {
        console.debug('🔍', message, data);
      } else {
        console.debug('🔍', message);
      }
    }
  },

  /**
   * Success logging - untuk operasi berhasil
   * Tampil di development
   */
  success: (message: string, data?: any) => {
    if (isDev) {
      if (data !== undefined) {
        console.log('✅', message, data);
      } else {
        console.log('✅', message);
      }
    }
  }
};