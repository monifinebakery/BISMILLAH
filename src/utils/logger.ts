// src/utils/logger.ts - VITE-ONLY VERSION

// ✅ Gunakan import.meta.env secara eksklusif untuk Vite
const getEnvVar = (name: string, defaultValue: string = ''): string => {
  try {
    return import.meta.env?.[name] ?? defaultValue;
  } catch (error) {
    console.warn(`Failed to get environment variable ${name}:`, error);
    return defaultValue;
  }
};

// ✅ Deteksi lingkungan development hanya dengan import.meta.env
const isDev = import.meta.env?.DEV === true || import.meta.env?.MODE === 'development';

// Debug flags - hanya dari import.meta.env
const debugContext = getEnvVar('VITE_DEBUG_CONTEXT', 'false') === 'true';
const debugComponent = getEnvVar('VITE_DEBUG_COMPONENT', 'false') === 'true';
const debugHook = getEnvVar('VITE_DEBUG_HOOK', 'false') === 'true';
const debugApi = getEnvVar('VITE_DEBUG_API', 'false') === 'true';
const debugPerf = getEnvVar('VITE_DEBUG_PERF', 'false') === 'true';
const debugLevel = getEnvVar('VITE_DEBUG_LEVEL', 'info');

// ✅ Force enable logs
const forceEnable = getEnvVar('VITE_FORCE_LOGS', 'false') === 'true';

// ✅ Cek console
const hasConsole = typeof console !== 'undefined';

export const logger = {
  /**
   * Get environment info
   */
  getEnv: () => ({
    isDev,
    mode: import.meta.env?.MODE || 'unknown',
    dev: import.meta.env?.DEV || false,
  }),

  /**
   * Test logger
   */
  test: () => {
    if (hasConsole) {
      console.log('🧪 Logger Test:', {
        isDev,
        mode: import.meta.env?.MODE,
        dev: import.meta.env?.DEV,
        debugFlags: {
          context: debugContext,
          component: debugComponent,
          hook: debugHook,
          api: debugApi,
          perf: debugPerf,
          level: debugLevel,
          forceEnable
        }
      });
    }
  },

  /**
   * Context logging
   */
  context: (contextName: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugContext) {
      if (data !== undefined) {
        console.log(`🔄 [${contextName}]`, message, data);
      } else {
        console.log(`🔄 [${contextName}]`, message);
      }
    }
  },

  /**
   * Component logging
   */
  component: (componentName: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugComponent) {
      if (data !== undefined) {
        console.log(`🧩 [${componentName}]`, message, data);
      } else {
        console.log(`🧩 [${componentName}]`, message);
      }
    }
  },

  /**
   * Hook logging
   */
  hook: (hookName: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugHook) {
      if (data !== undefined) {
        console.log(`🪝 [${hookName}]`, message, data);
      } else {
        console.log(`🪝 [${hookName}]`, message);
      }
    }
  },

  /**
   * Info logging
   */
  info: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && ['verbose', 'info'].includes(debugLevel)) {
      if (data !== undefined) {
        console.log('ℹ️', message, data);
      } else {
        console.log('ℹ️', message);
      }
    }
  },

  /**
   * Warning logging
   */
  warn: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable)) {
      if (data !== undefined) {
        console.warn('⚠️', message, data);
      } else {
        console.warn('⚠️', message);
      }
    }
  },

  /**
   * Error logging
   */
  error: (message: string, error?: any) => {
    if (hasConsole && (isDev || forceEnable)) {
      if (error !== undefined) {
        console.error('🚨', message, error);
      } else {
        console.error('🚨', message);
      }
    }
  },

  /**
   * Debug logging
   */
  debug: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugLevel === 'verbose') {
      if (data !== undefined) {
        console.debug('🔍', message, data);
      } else {
        console.debug('🔍', message);
      }
    }
  },

  /**
   * Success logging
   */
  success: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable)) {
      if (data !== undefined) {
        console.log('✅', message, data);
      } else {
        console.log('✅', message);
      }
    }
  },

  /**
   * API logging
   */
  api: (endpoint: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugApi) {
      if (data !== undefined) {
        console.log(`🌐 [API:${endpoint}]`, message, data);
      } else {
        console.log(`🌐 [API:${endpoint}]`, message);
      }
    }
  },

  /**
   * Performance logging
   */
  perf: (operation: string, duration: number, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPerf) {
      const color = duration > 1000 ? '🐌' : duration > 500 ? '⏱️' : '⚡';
      if (data !== undefined) {
        console.log(`${color} [PERF:${operation}] ${duration}ms`, data);
      } else {
        console.log(`${color} [PERF:${operation}] ${duration}ms`);
      }
    }
  },

  /**
   * Critical error logging
   */
  criticalError: (message: string, error?: any) => {
    if (hasConsole) {
      if (error !== undefined) {
        console.error('🚨 CRITICAL:', message, error);
      } else {
        console.error('🚨 CRITICAL:', message);
      }
    }
  },

  /**
   * Order verification logging
   */
  orderVerification: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable)) {
      if (data !== undefined) {
        console.log('🎫 [ORDER-VERIFY]', message, data);
      } else {
        console.log('🎫 [ORDER-VERIFY]', message);
      }
    }
  }
};

// Tambahkan ke window untuk debugging
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;
}