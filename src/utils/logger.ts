// src/utils/logger.ts — environment-aware logger (Netlify dev fixed)

// ✅ Early environment snapshot - ONLY IN DEV
if (import.meta.env.DEV) {
  console.log('🔍 Environment Check:', {
    VITE_DEBUG_LEVEL: import.meta.env.VITE_DEBUG_LEVEL,
    VITE_FORCE_LOGS: import.meta.env.VITE_FORCE_LOGS,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
    NODE_ENV: import.meta.env.NODE_ENV,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
  });
}

// ----------------------
// Config & helpers
// ----------------------

type Level = 'debug' | 'warn' | 'error';
const normalizeLevel = (raw?: string): Level => {
  const v = String(raw || 'error').toLowerCase().trim();
  if (v === 'debug' || v === 'warn' || v === 'error') return v;
  return 'debug';
};

const forceLogsEnabled = String(import.meta.env.VITE_FORCE_LOGS || '').toLowerCase() === 'true';
const debugLevel: Level = normalizeLevel(import.meta.env.VITE_DEBUG_LEVEL);

const levelRank: Record<Level, number> = { debug: 0, warn: 1, error: 2 };
const allowInfoLike = levelRank[debugLevel] <= levelRank.debug;
const allowWarnLike = levelRank[debugLevel] <= levelRank.warn;

// ----------------------
// Host guards - UPDATED
// ----------------------

const PROD_HOSTS = new Set<string>([
  'kalkulator.monifine.my.id',
  'www.kalkulator.monifine.my.id',
]);

const isProductionHostname = (hostname: string): boolean => {
  return PROD_HOSTS.has(hostname);
};

// ✅ FIXED: Better Netlify detection
const isNetlifyDev = (hostname: string): boolean => {
  // Netlify dev patterns: dev3—gleaming-peony-f4a091.netlify.app
  return hostname.includes('netlify.app') && !isProductionHostname(hostname);
};

const ENV_DEV_HOSTS = String(import.meta.env.VITE_DEV_HOSTS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const isPreviewHostname = (hostname: string): boolean => {
  if (ENV_DEV_HOSTS.length > 0) return ENV_DEV_HOSTS.includes(hostname);
  return isNetlifyDev(hostname);
};

const disableLogsHosts = String(import.meta.env.VITE_DISABLE_LOGS_ON_HOSTS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ----------------------
// Final decision - FIXED
// ----------------------
const getShouldLog = () => {
  // 1) ✅ ALWAYS log in Vite dev mode (regardless of hostname)
  if (import.meta.env.DEV) {
    return true;
  }

  // 2) ✅ Force logs via env
  if (forceLogsEnabled) {
    return true;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // 3) Disabled hosts
    if (disableLogsHosts.includes(hostname)) {
      return false;
    }

    // 4) Preview/dev host (Netlify etc)
    if (isPreviewHostname(hostname)) {
      return true;
    }

    // 5) Production host
    if (isProductionHostname(hostname)) {
      return false;
    }

    // 6) ✅ FALLBACK: Unknown hostnames in dev mode should log
    if (import.meta.env.DEV) {
      return true;
    }
  }

  // 7) Default - disable in production
  return false;
};

const SHOULD_LOG = getShouldLog();

// Only log config in DEV mode
if (import.meta.env.DEV && SHOULD_LOG) {
  console.log('🔧 Logger Config:', {
    isDevelopmentMode: import.meta.env.DEV,
    forceLogsEnabled,
    debugLevel,
    SHOULD_LOG,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
  });
}

const hasConsole = typeof console !== 'undefined';

// ----------------------
// Public logger API
// ----------------------
export const logger = {
  test: () => {
    if (hasConsole) {
      console.log('🧪 Logger Test:', {
        timestamp: new Date().toISOString(),
        shouldLog: SHOULD_LOG,
        isDevelopmentMode: import.meta.env.DEV,
        forceLogsEnabled,
        debugLevel,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
      });
    }
  },

  context: (contextName: string, message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔄 [${t}] [${contextName}]`, message, data)
        : console.log(`🔄 [${t}] [${contextName}]`, message);
    }
  },

  component: (componentName: string, message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🧩 [${t}] [${componentName}]`, message, data)
        : console.log(`🧩 [${t}] [${componentName}]`, message);
    }
  },

  hook: (hookName: string, message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🪝 [${t}] [${hookName}]`, message, data)
        : console.log(`🪝 [${t}] [${hookName}]`, message);
    }
  },

  info: (message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG && allowInfoLike) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`ℹ️ [${t}]`, message, data)
        : console.log(`ℹ️ [${t}]`, message);
    }
  },

  warn: (message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG && allowWarnLike) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.warn(`⚠️ [${t}]`, message, data)
        : console.warn(`⚠️ [${t}]`, message);
    }
  },

  error: (message: string, error?: any) => {
    if (hasConsole) {
      const t = new Date().toISOString().slice(11, 23);
      error !== undefined
        ? console.error(`🚨 [${t}]`, message, error)
        : console.error(`🚨 [${t}]`, message);
    }
  },

  debug: (message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG && allowInfoLike) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.debug(`🔍 [${t}]`, message, data)
        : console.debug(`🔍 [${t}]`, message);
    }
  },

  success: (message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`✅ [${t}]`, message, data)
        : console.log(`✅ [${t}]`, message);
    }
  },

  api: (endpoint: string, message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🌐 [${t}] [API:${endpoint}]`, message, data)
        : console.log(`🌐 [${t}] [API:${endpoint}]`, message);
    }
  },

  perf: (operation: string, duration: number, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      const icon = duration > 1000 ? '🐌' : duration > 500 ? '⏱️' : '⚡';
      data !== undefined
        ? console.log(`${icon} [${t}] [PERF:${operation}] ${duration}ms`, data)
        : console.log(`${icon} [${t}] [PERF:${operation}] ${duration}ms`);
    }
  },

  criticalError: (message: string, error?: any) => {
    if (hasConsole) {
      const t = new Date().toISOString().slice(11, 23);
      error !== undefined
        ? console.error(`🚨 [${t}] CRITICAL:`, message, error)
        : console.error(`🚨 [${t}] CRITICAL:`, message);
    }
  },

  payment: (stage: string, message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`💳 [${t}] [PAYMENT:${stage}]`, message, data)
        : console.log(`💳 [${t}] [PAYMENT:${stage}]`, message);
    }
  },

  orderVerification: (message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🎫 [${t}] [ORDER-VERIFY]`, message, data)
        : console.log(`🎫 [${t}] [ORDER-VERIFY]`, message);
    }
  },

  accessCheck: (message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔐 [${t}] [ACCESS-CHECK]`, message, data)
        : console.log(`🔐 [${t}] [ACCESS-CHECK]`, message);
    }
  },

  linking: (message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔗 [${t}] [LINKING]`, message, data)
        : console.log(`🔗 [${t}] [LINKING]`, message);
    }
  },

  cache: (operation: string, message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🗄️ [${t}] [CACHE:${operation}]`, message, data)
        : console.log(`🗄️ [${t}] [CACHE:${operation}]`, message);
    }
  },

  flow: (step: number, stage: string, message: string, data?: any) => {
    if (hasConsole && SHOULD_LOG) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔄 [${t}] [FLOW-${step}:${stage}]`, message, data)
        : console.log(`🔄 [${t}] [FLOW-${step}:${stage}]`, message);
    }
  }
};

// ----------------------
// Global debug helpers - PRODUCTION SAFE
// ----------------------
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;

  // Test immediately when loaded - ONLY IN DEV
  if (import.meta.env.DEV && SHOULD_LOG) {
    console.log('🚀 Logger loaded! Environment:', {
      isDevelopmentMode: import.meta.env.DEV,
      SHOULD_LOG,
      level: debugLevel,
      hostname: window.location.hostname
    });
    
    logger.test();
  }

  // Debug helpers - controlled by SHOULD_LOG
  (window as any).__DEBUG_PAYMENT__ = {
    test: () => {
      if (SHOULD_LOG) {
        console.log('🧪 Payment debug test');
        logger.orderVerification('Test order verification log');
        logger.payment('TEST', 'Test payment log');
        logger.linking('Test linking log');
      }
    },
    status: () => {
      if (SHOULD_LOG) {
        console.log('🔧 Current logger status:', {
          SHOULD_LOG,
          isDevelopmentMode: import.meta.env.DEV,
          forceLogsEnabled,
          level: debugLevel,
          hostname: window.location.hostname
        });
      }
    },
    forceEnableHint: () => {
      console.log('🔧 To force enable logs, set VITE_FORCE_LOGS=true (or build with custom mode).');
    }
  };
}
