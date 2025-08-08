// src/utils/logger.ts - ENHANCED VERSION FOR PAYMENT DEBUGGING

// ✅ Environment detection
const getEnvVar = (name: string, defaultValue: string = ''): string => {
  try {
    return import.meta.env?.[name] ?? defaultValue;
  } catch (error) {
    console.warn(`Failed to get environment variable ${name}:`, error);
    return defaultValue;
  }
};

const isDev = import.meta.env?.DEV === true || import.meta.env?.MODE === 'development';

// ✅ Enhanced debug flags with payment-specific options
const debugContext = getEnvVar('VITE_DEBUG_CONTEXT', 'true') === 'true'; // Default true for payment debugging
const debugComponent = getEnvVar('VITE_DEBUG_COMPONENT', 'true') === 'true';
const debugHook = getEnvVar('VITE_DEBUG_HOOK', 'true') === 'true';
const debugApi = getEnvVar('VITE_DEBUG_API', 'true') === 'true';
const debugPerf = getEnvVar('VITE_DEBUG_PERF', 'false') === 'true';
const debugLevel = getEnvVar('VITE_DEBUG_LEVEL', 'info');
const debugPayment = getEnvVar('VITE_DEBUG_PAYMENT', 'true') === 'true'; // ✅ Payment-specific debug
const forceEnable = getEnvVar('VITE_FORCE_LOGS', 'true') === 'true'; // ✅ Default true for payment debugging

const hasConsole = typeof console !== 'undefined';

// ✅ Enhanced logger with payment flow tracking
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
          payment: debugPayment,
          level: debugLevel,
          forceEnable
        },
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Context logging
   */
  context: (contextName: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugContext) {
      const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.sss
      if (data !== undefined) {
        console.log(`🔄 [${timestamp}] [${contextName}]`, message, data);
      } else {
        console.log(`🔄 [${timestamp}] [${contextName}]`, message);
      }
    }
  },

  /**
   * Component logging
   */
  component: (componentName: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugComponent) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🧩 [${timestamp}] [${componentName}]`, message, data);
      } else {
        console.log(`🧩 [${timestamp}] [${componentName}]`, message);
      }
    }
  },

  /**
   * Hook logging
   */
  hook: (hookName: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugHook) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🪝 [${timestamp}] [${hookName}]`, message, data);
      } else {
        console.log(`🪝 [${timestamp}] [${hookName}]`, message);
      }
    }
  },

  /**
   * Info logging
   */
  info: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && ['verbose', 'info'].includes(debugLevel)) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`ℹ️ [${timestamp}]`, message, data);
      } else {
        console.log(`ℹ️ [${timestamp}]`, message);
      }
    }
  },

  /**
   * Warning logging
   */
  warn: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable)) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.warn(`⚠️ [${timestamp}]`, message, data);
      } else {
        console.warn(`⚠️ [${timestamp}]`, message);
      }
    }
  },

  /**
   * Error logging
   */
  error: (message: string, error?: any) => {
    if (hasConsole && (isDev || forceEnable)) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (error !== undefined) {
        console.error(`🚨 [${timestamp}]`, message, error);
      } else {
        console.error(`🚨 [${timestamp}]`, message);
      }
    }
  },

  /**
   * Debug logging
   */
  debug: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && ['verbose', 'debug'].includes(debugLevel)) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.debug(`🔍 [${timestamp}]`, message, data);
      } else {
        console.debug(`🔍 [${timestamp}]`, message);
      }
    }
  },

  /**
   * Success logging
   */
  success: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable)) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`✅ [${timestamp}]`, message, data);
      } else {
        console.log(`✅ [${timestamp}]`, message);
      }
    }
  },

  /**
   * API logging
   */
  api: (endpoint: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugApi) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🌐 [${timestamp}] [API:${endpoint}]`, message, data);
      } else {
        console.log(`🌐 [${timestamp}] [API:${endpoint}]`, message);
      }
    }
  },

  /**
   * Performance logging
   */
  perf: (operation: string, duration: number, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPerf) {
      const timestamp = new Date().toISOString().slice(11, 23);
      const color = duration > 1000 ? '🐌' : duration > 500 ? '⏱️' : '⚡';
      if (data !== undefined) {
        console.log(`${color} [${timestamp}] [PERF:${operation}] ${duration}ms`, data);
      } else {
        console.log(`${color} [${timestamp}] [PERF:${operation}] ${duration}ms`);
      }
    }
  },

  /**
   * Critical error logging
   */
  criticalError: (message: string, error?: any) => {
    if (hasConsole) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (error !== undefined) {
        console.error(`🚨 [${timestamp}] CRITICAL:`, message, error);
      } else {
        console.error(`🚨 [${timestamp}] CRITICAL:`, message);
      }
    }
  },

  /**
   * ✅ NEW: Payment flow logging
   */
  payment: (stage: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPayment) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`💳 [${timestamp}] [PAYMENT:${stage}]`, message, data);
      } else {
        console.log(`💳 [${timestamp}] [PAYMENT:${stage}]`, message);
      }
    }
  },

  /**
   * ✅ NEW: Order verification logging  
   */
  orderVerification: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPayment) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🎫 [${timestamp}] [ORDER-VERIFY]`, message, data);
      } else {
        console.log(`🎫 [${timestamp}] [ORDER-VERIFY]`, message);
      }
    }
  },

  /**
   * ✅ NEW: Access check logging
   */
  accessCheck: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPayment) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🔐 [${timestamp}] [ACCESS-CHECK]`, message, data);
      } else {
        console.log(`🔐 [${timestamp}] [ACCESS-CHECK]`, message);
      }
    }
  },

  /**
   * ✅ NEW: Linking process logging
   */
  linking: (message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPayment) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🔗 [${timestamp}] [LINKING]`, message, data);
      } else {
        console.log(`🔗 [${timestamp}] [LINKING]`, message);
      }
    }
  },

  /**
   * ✅ NEW: Cache operations logging
   */
  cache: (operation: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPayment) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🗄️ [${timestamp}] [CACHE:${operation}]`, message, data);
      } else {
        console.log(`🗄️ [${timestamp}] [CACHE:${operation}]`, message);
      }
    }
  },

  /**
   * ✅ NEW: Flow tracking with step numbers
   */
  flow: (step: number, stage: string, message: string, data?: any) => {
    if (hasConsole && (isDev || forceEnable) && debugPayment) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message, data);
      } else {
        console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message);
      }
    }
  }
};

// ✅ Enhanced global debug functions
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;
  
  // ✅ Global debug helpers for payment flow
  (window as any).__DEBUG_PAYMENT__ = {
    test: () => logger.test(),
    enableAll: () => {
      console.log('🔧 Enabling all debug flags');
      (window as any).__FORCE_DEBUG__ = true;
    },
    disableAll: () => {
      console.log('🔧 Disabling debug flags');
      (window as any).__FORCE_DEBUG__ = false;
    },
    paymentFlow: (message: string) => {
      logger.payment('DEBUG', message, { timestamp: Date.now() });
    }
  };
}