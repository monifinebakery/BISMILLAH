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
const debugComponent = getEnvVar('VITE_DEBUG_COMPONENT', 'true') === 'true';
const debugHook = getEnvVar('VITE_DEBUG_HOOK', 'true') === 'true';
const debugLevel = getEnvVar('VITE_DEBUG_LEVEL', 'info');

export const logger = {
  /**
   * Context logging - untuk log dari context providers
   * Hanya tampil jika VITE_DEBUG_CONTEXT=true
   */
  context: (contextName: string, message: string, data?: any) => {
    if (isDev && debugContext) {
      if (data !== undefined) {
        console.log(`🔄 [${contextName}]`, message, data);
      } else {
        console.log(`🔄 [${contextName}]`, message);
      }
    }
  },

  /**
   * Component logging - untuk log dari components
   * Hanya tampil jika VITE_DEBUG_COMPONENT=true
   */
  component: (componentName: string, message: string, data?: any) => {
    if (isDev && debugComponent) {
      if (data !== undefined) {
        console.log(`🧩 [${componentName}]`, message, data);
      } else {
        console.log(`🧩 [${componentName}]`, message);
      }
    }
  },

  /**
   * Hook logging - untuk log dari custom hooks
   * Hanya tampil jika VITE_DEBUG_HOOK=true
   */
  hook: (hookName: string, message: string, data?: any) => {
    if (isDev && debugHook) {
      if (data !== undefined) {
        console.log(`🪝 [${hookName}]`, message, data);
      } else {
        console.log(`🪝 [${hookName}]`, message);
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
  },

  /**
   * API logging - untuk request/response API
   * Hanya tampil jika VITE_DEBUG_API=true
   */
  api: (endpoint: string, message: string, data?: any) => {
    const debugApi = getEnvVar('VITE_DEBUG_API', 'false') === 'true';
    if (isDev && debugApi) {
      if (data !== undefined) {
        console.log(`🌐 [API:${endpoint}]`, message, data);
      } else {
        console.log(`🌐 [API:${endpoint}]`, message);
      }
    }
  },

  /**
   * Performance logging - untuk performance monitoring
   * Hanya tampil jika VITE_DEBUG_PERF=true
   */
  perf: (operation: string, duration: number, data?: any) => {
    const debugPerf = getEnvVar('VITE_DEBUG_PERF', 'false') === 'true';
    if (isDev && debugPerf) {
      const color = duration > 1000 ? '🐌' : duration > 500 ? '⏱️' : '⚡';
      if (data !== undefined) {
        console.log(`${color} [PERF:${operation}] ${duration}ms`, data);
      } else {
        console.log(`${color} [PERF:${operation}] ${duration}ms`);
      }
    }
  }
};