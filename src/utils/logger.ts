// src/utils/logger.ts - ENHANCED VERSION

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
    
    // Check build-time defined variables
    if (typeof __DEV__ !== 'undefined') {
      if (name === 'NODE_ENV') {
        return __DEV__ ? 'development' : 'production';
      }
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to get environment variable ${name}:`, error);
    return defaultValue;
  }
};

// ✅ ENHANCED: Better environment detection
const isDev = (() => {
  try {
    // Method 1: Check build-time define
    if (typeof __DEV__ !== 'undefined') {
      return __DEV__;
    }
    
    // Method 2: Check Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.DEV === true || import.meta.env.MODE === 'development';
    }
    
    // Method 3: Check Node environment (fallback)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
    
    // Method 4: Check window location (last resort)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev');
    }
    
    // Default to false for production safety
    return false;
  } catch (error) {
    console.warn('Failed to detect environment:', error);
    return false; // ✅ CHANGED: Default to production for safety
  }
})();

// ✅ ENHANCED: Runtime environment info
const getEnvironmentInfo = () => {
  return {
    isDev,
    mode: getEnvVar('MODE', 'unknown'),
    nodeEnv: getEnvVar('NODE_ENV', 'unknown'),
    viteMode: typeof import.meta !== 'undefined' ? import.meta.env?.MODE : 'unknown',
    viteDev: typeof import.meta !== 'undefined' ? import.meta.env?.DEV : 'unknown',
  };
};

// Debug flags
const debugContext = getEnvVar('VITE_DEBUG_CONTEXT', 'false') === 'true';
const debugComponent = getEnvVar('VITE_DEBUG_COMPONENT', 'false') === 'true';
const debugHook = getEnvVar('VITE_DEBUG_HOOK', 'false') === 'true';
const debugApi = getEnvVar('VITE_DEBUG_API', 'false') === 'true';
const debugPerf = getEnvVar('VITE_DEBUG_PERF', 'false') === 'true';
const debugLevel = getEnvVar('VITE_DEBUG_LEVEL', 'info');

// ✅ ENHANCED: Force enable in development
const forceEnable = getEnvVar('VITE_FORCE_LOGS', 'false') === 'true';

// ✅ ENHANCED: Console check
const hasConsole = typeof console !== 'undefined';

export const logger = {
  /**
   * ✅ NEW: Get environment info for debugging
   */
  getEnv: () => getEnvironmentInfo(),
  
  /**
   * ✅ NEW: Test logger to see if it's working
   */
  test: () => {
    if (hasConsole) {
      console.log('🧪 Logger Test:', {
        isDev,
        environment: getEnvironmentInfo(),
        debugFlags: {
          context: debugContext,
          component: debugComponent,
          hook: debugHook,
          api: debugApi,
          perf: debugPerf,
          level: debugLevel,
          forceEnable
        },
        hasConsole,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Context logging - untuk log dari context providers
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
   * Component logging - untuk log dari components
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
   * Hook logging - untuk log dari custom hooks
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
   * Info logging - untuk informasi umum
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
   * Warning logging - untuk peringatan
   * ✅ UPDATED: Only show in development
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
   * Error logging - untuk error
   * ✅ UPDATED: Only show in development, silent in production
   */
  error: (message: string, error?: any) => {
    // ✅ CHANGED: Only show errors in development or when forced
    if (hasConsole && (isDev || forceEnable)) {
      if (error !== undefined) {
        console.error('🚨', message, error);
      } else {
        console.error('🚨', message);
      }
    }
  },

  /**
   * Debug logging - untuk debugging detail
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
   * Success logging - untuk operasi berhasil
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
   * API logging - untuk request/response API
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
   * Performance logging - untuk performance monitoring
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
   * ✅ ENHANCED: Production-safe error logging
   * Only for critical errors that should never be suppressed
   */
  criticalError: (message: string, error?: any) => {
    // Always log critical errors regardless of environment
    if (hasConsole) {
      if (error !== undefined) {
        console.error('🚨 CRITICAL:', message, error);
      } else {
        console.error('🚨 CRITICAL:', message);
      }
    }
  },

  /**
   * ✅ NEW: Order verification specific logging
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

// ✅ ENHANCED: Add global logger for debugging
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;
}