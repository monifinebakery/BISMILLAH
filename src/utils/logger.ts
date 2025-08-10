// src/utils/logger.ts - Environment-aware version

// ✅ Debug environment variables first - ENHANCED DEBUG
console.log('🔍 Environment Check:', {
  VITE_DEBUG_LEVEL: import.meta.env.VITE_DEBUG_LEVEL,
  VITE_FORCE_LOGS: import.meta.env.VITE_FORCE_LOGS,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  NODE_ENV: import.meta.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
});

// Environment detection - SAFE for build time
const forceLogsEnabled = import.meta.env.VITE_FORCE_LOGS === 'true';
const debugLevel = import.meta.env.VITE_DEBUG_LEVEL || 'error';

// ✅ SIMPLIFIED: Force enable berdasarkan VITE_FORCE_LOGS di development
const isDevelopmentMode = import.meta.env.MODE === 'development';
const shouldLogBasedOnEnv = isDevelopmentMode || forceLogsEnabled;

// Get SHOULD_LOG dynamically - SIMPLIFIED
const getShouldLog = () => {
  // ✅ PRODUCTION SAFETY: Force disable untuk domain production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProductionDomain = hostname.includes('monifine.my.id') || 
                              hostname.includes('kalkulator.');
    
    if (isProductionDomain) {
      console.log('🚫 PRODUCTION DOMAIN DETECTED - Logs disabled');
      return false; // Force disable di production
    }
  }
  
  // ✅ SIMPLE: Prioritas ke environment variables
  const result = shouldLogBasedOnEnv;
  
  console.log('🔧 Should Log Decision:', {
    isDevelopmentMode,
    forceLogsEnabled,
    shouldLogBasedOnEnv,
    finalResult: result,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
  });
  
  return result;
};

console.log('🔧 Logger Config:', {
  isDevelopmentMode,
  forceLogsEnabled, 
  debugLevel,
  shouldLogBasedOnEnv,
  SHOULD_LOG: getShouldLog(),
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
});

const hasConsole = typeof console !== 'undefined';

// ✅ Environment-aware logger
export const logger = {
  /**
   * Test logger
   */
  test: () => {
    if (hasConsole) {
      console.log('🧪 Logger Test:', {
        timestamp: new Date().toISOString(),
        shouldLog: getShouldLog(),
        isDevelopmentMode,
        forceLogsEnabled
      });
    }
  },

  /**
   * Context logging
   */
  context: (contextName: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
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
    if (hasConsole && getShouldLog()) {
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
    if (hasConsole && getShouldLog()) {
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
    if (hasConsole && getShouldLog()) {
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
    if (hasConsole && (getShouldLog() || debugLevel === 'warn' || debugLevel === 'error')) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.warn(`⚠️ [${timestamp}]`, message, data);
      } else {
        console.warn(`⚠️ [${timestamp}]`, message);
      }
    }
  },

  /**
   * Error logging - Always show errors
   */
  error: (message: string, error?: any) => {
    if (hasConsole) {
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
    if (hasConsole && getShouldLog() && debugLevel === 'debug') {
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
    if (hasConsole && getShouldLog()) {
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
    if (hasConsole && getShouldLog()) {
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
    if (hasConsole && getShouldLog()) {
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
   * Critical error logging - Always show
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
   * Payment flow logging
   */
  payment: (stage: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`💳 [${timestamp}] [PAYMENT:${stage}]`, message, data);
      } else {
        console.log(`💳 [${timestamp}] [PAYMENT:${stage}]`, message);
      }
    }
  },

  /**
   * Order verification logging  
   */
  orderVerification: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🎫 [${timestamp}] [ORDER-VERIFY]`, message, data);
      } else {
        console.log(`🎫 [${timestamp}] [ORDER-VERIFY]`, message);
      }
    }
  },

  /**
   * Access check logging
   */
  accessCheck: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🔐 [${timestamp}] [ACCESS-CHECK]`, message, data);
      } else {
        console.log(`🔐 [${timestamp}] [ACCESS-CHECK]`, message);
      }
    }
  },

  /**
   * Linking process logging
   */
  linking: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🔗 [${timestamp}] [LINKING]`, message, data);
      } else {
        console.log(`🔗 [${timestamp}] [LINKING]`, message);
      }
    }
  },

  /**
   * Cache operations logging
   */
  cache: (operation: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🗄️ [${timestamp}] [CACHE:${operation}]`, message, data);
      } else {
        console.log(`🗄️ [${timestamp}] [CACHE:${operation}]`, message);
      }
    }
  },

  /**
   * Flow tracking with step numbers
   */
  flow: (step: number, stage: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message, data);
      } else {
        console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message);
      }
    }
  }
};

// ✅ Global debug functions (only in development)
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;
  
  // Test immediately when loaded
  if (getShouldLog()) {
    console.log('🚀 Logger loaded! Environment:', { isDevelopment: getIsDevelopment(), SHOULD_LOG: getShouldLog() });
    logger.test();
  }
  
  (window as any).__DEBUG_PAYMENT__ = {
    test: () => {
      console.log('🧪 Payment debug test');
      logger.orderVerification('Test order verification log');
      logger.payment('TEST', 'Test payment log');
      logger.linking('Test linking log');
    },
    enableAll: () => {
      console.log('🔧 Current logger status:', { SHOULD_LOG: getShouldLog(), isDevelopmentMode, forceLogsEnabled });
    },
    forceEnable: () => {
      console.log('🔧 To force enable logs, set VITE_FORCE_LOGS=true in your .env file');
    }
  };
}