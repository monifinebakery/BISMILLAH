// src/utils/logger.ts - FORCE ENABLED VERSION

// ✅ FORCE ENABLE ALL LOGS for debugging
const FORCE_ENABLE_ALL = true;

const hasConsole = typeof console !== 'undefined';

// ✅ Force enabled logger - all logs will show
export const logger = {
  /**
   * Test logger
   */
  test: () => {
    if (hasConsole) {
      console.log('🧪 FORCE ENABLED Logger Test:', {
        timestamp: new Date().toISOString(),
        forceEnabled: FORCE_ENABLE_ALL
      });
    }
  },

  /**
   * Context logging
   */
  context: (contextName: string, message: string, data?: any) => {
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
   * Payment flow logging
   */
  payment: (stage: string, message: string, data?: any) => {
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
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
    if (hasConsole && FORCE_ENABLE_ALL) {
      const timestamp = new Date().toISOString().slice(11, 23);
      if (data !== undefined) {
        console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message, data);
      } else {
        console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message);
      }
    }
  }
};

// ✅ Global debug functions
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;
  
  // Test immediately when loaded
  console.log('🚀 FORCE ENABLED LOGGER LOADED!');
  logger.test();
  
  (window as any).__DEBUG_PAYMENT__ = {
    test: () => {
      console.log('🧪 Payment debug test');
      logger.orderVerification('Test order verification log');
      logger.payment('TEST', 'Test payment log');
      logger.linking('Test linking log');
    },
    enableAll: () => {
      console.log('🔧 All logs already force enabled');
    }
  };
}