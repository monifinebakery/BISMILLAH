// src/utils/logger.ts - Environment-aware logger (fixed dev logs)

// ✅ Early environment snapshot (safe to run at module load)
console.log('🔍 Environment Check:', {
  VITE_DEBUG_LEVEL: import.meta.env.VITE_DEBUG_LEVEL,
  VITE_FORCE_LOGS: import.meta.env.VITE_FORCE_LOGS,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  NODE_ENV: import.meta.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
});

// 🔧 Config via env
const forceLogsEnabled = import.meta.env.VITE_FORCE_LOGS === 'true';
const debugLevel = import.meta.env.VITE_DEBUG_LEVEL || 'error';

// ✅ Production host guard (lebih ketat, bukan includes sembarangan)
const PROD_HOSTS = new Set<string>([
  'monifine.my.id',
  'www.monifine.my.id',
  'kalkulator.monifine.my.id',
]);

const isProductionHostname = (hostname: string): boolean => {
  // tandai semua subdomain *.monifine.my.id sebagai production
  if (hostname === 'monifine.my.id' || hostname === 'www.monifine.my.id') return true;
  if (hostname.endsWith('.monifine.my.id')) return true;
  if (PROD_HOSTS.has(hostname)) return true;
  return false;
};

// ✅ Optional blacklist host dari .env (comma separated), contoh:
// VITE_DISABLE_LOGS_ON_HOSTS=staging.monifine.my.id,preview.monifine.my.id
const disableLogsHosts = String(import.meta.env.VITE_DISABLE_LOGS_ON_HOSTS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ✅ Final decision maker
const getShouldLog = () => {
  // 1) Dev SELALU nyala
  if (import.meta.env.DEV) return true;

  // 2) Kalau force lewat env, nyalakan meskipun production
  if (forceLogsEnabled) return true;

  // 3) Production domains: matikan
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (disableLogsHosts.includes(hostname)) {
      // host sengaja dimatikan via env
      return false;
    }

    if (isProductionHostname(hostname)) {
      return false;
    }
  }

  // 4) Default non-dev, non-forced → mati
  return false;
};

console.log('🔧 Logger Config:', {
  isDevelopmentMode: import.meta.env.DEV,
  forceLogsEnabled,
  debugLevel,
  SHOULD_LOG: getShouldLog(),
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
});

const hasConsole = typeof console !== 'undefined';

// ✅ Environment-aware logger
export const logger = {
  test: () => {
    if (hasConsole) {
      console.log('🧪 Logger Test:', {
        timestamp: new Date().toISOString(),
        shouldLog: getShouldLog(),
        isDevelopmentMode: import.meta.env.DEV,
        forceLogsEnabled
      });
    }
  },

  context: (contextName: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔄 [${timestamp}] [${contextName}]`, message, data)
        : console.log(`🔄 [${timestamp}] [${contextName}]`, message);
    }
  },

  component: (componentName: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🧩 [${timestamp}] [${componentName}]`, message, data)
        : console.log(`🧩 [${timestamp}] [${componentName}]`, message);
    }
  },

  hook: (hookName: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🪝 [${timestamp}] [${hookName}]`, message, data)
        : console.log(`🪝 [${timestamp}] [${hookName}]`, message);
    }
  },

  info: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`ℹ️ [${timestamp}]`, message, data)
        : console.log(`ℹ️ [${timestamp}]`, message);
    }
  },

  warn: (message: string, data?: any) => {
    if (hasConsole && (getShouldLog() || debugLevel === 'warn' || debugLevel === 'error')) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.warn(`⚠️ [${timestamp}]`, message, data)
        : console.warn(`⚠️ [${timestamp}]`, message);
    }
  },

  // ❗️Error selalu tampil di dev. Di production, konsol bisa terhapus oleh esbuild.drop.
  error: (message: string, error?: any) => {
    if (hasConsole) {
      const timestamp = new Date().toISOString().slice(11, 23);
      error !== undefined
        ? console.error(`🚨 [${timestamp}]`, message, error)
        : console.error(`🚨 [${timestamp}]`, message);
    }
  },

  debug: (message: string, data?: any) => {
    if (hasConsole && getShouldLog() && debugLevel === 'debug') {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.debug(`🔍 [${timestamp}]`, message, data)
        : console.debug(`🔍 [${timestamp}]`, message);
    }
  },

  success: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`✅ [${timestamp}]`, message, data)
        : console.log(`✅ [${timestamp}]`, message);
    }
  },

  api: (endpoint: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🌐 [${timestamp}] [API:${endpoint}]`, message, data)
        : console.log(`🌐 [${timestamp}] [API:${endpoint}]`, message);
    }
  },

  perf: (operation: string, duration: number, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      const icon = duration > 1000 ? '🐌' : duration > 500 ? '⏱️' : '⚡';
      data !== undefined
        ? console.log(`${icon} [${timestamp}] [PERF:${operation}] ${duration}ms`, data)
        : console.log(`${icon} [${timestamp}] [PERF:${operation}] ${duration}ms`);
    }
  },

  criticalError: (message: string, error?: any) => {
    if (hasConsole) {
      const timestamp = new Date().toISOString().slice(11, 23);
      error !== undefined
        ? console.error(`🚨 [${timestamp}] CRITICAL:`, message, error)
        : console.error(`🚨 [${timestamp}] CRITICAL:`, message);
    }
  },

  payment: (stage: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`💳 [${timestamp}] [PAYMENT:${stage}]`, message, data)
        : console.log(`💳 [${timestamp}] [PAYMENT:${stage}]`, message);
    }
  },

  orderVerification: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🎫 [${timestamp}] [ORDER-VERIFY]`, message, data)
        : console.log(`🎫 [${timestamp}] [ORDER-VERIFY]`, message);
    }
  },

  accessCheck: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔐 [${timestamp}] [ACCESS-CHECK]`, message, data)
        : console.log(`🔐 [${timestamp}] [ACCESS-CHECK]`, message);
    }
  },

  linking: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔗 [${timestamp}] [LINKING]`, message, data)
        : console.log(`🔗 [${timestamp}] [LINKING]`, message);
    }
  },

  cache: (operation: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🗄️ [${timestamp}] [CACHE:${operation}]`, message, data)
        : console.log(`🗄️ [${timestamp}] [CACHE:${operation}]`, message);
    }
  },

  flow: (step: number, stage: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const timestamp = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message, data)
        : console.log(`🔄 [${timestamp}] [FLOW-${step}:${stage}]`, message);
    }
  }
};

// ✅ Global debug helpers (browser only)
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;

  // Test immediately when loaded
  if (getShouldLog()) {
    console.log('🚀 Logger loaded! Environment:', { isDevelopmentMode: import.meta.env.DEV, SHOULD_LOG: getShouldLog() });
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
      console.log('🔧 Current logger status:', { SHOULD_LOG: getShouldLog(), isDevelopmentMode: import.meta.env.DEV, forceLogsEnabled });
    },
    forceEnable: () => {
      console.log('🔧 To force enable logs, set VITE_FORCE_LOGS=true in your .env file');
    }
  };
}
