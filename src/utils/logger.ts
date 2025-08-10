// src/utils/logger.ts — environment-aware logger (dev fixed + preview aware)

// ✅ Early environment snapshot (aman dieksekusi saat module load)
console.log('🔍 Environment Check:', {
  VITE_DEBUG_LEVEL: import.meta.env.VITE_DEBUG_LEVEL,
  VITE_FORCE_LOGS: import.meta.env.VITE_FORCE_LOGS,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  NODE_ENV: import.meta.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time'
});

// ----------------------
// Config & helpers
// ----------------------

// Raw → normalized level
type Level = 'debug' | 'warn' | 'error';
const normalizeLevel = (raw?: string): Level => {
  const v = String(raw || 'error').toLowerCase().trim();
  if (v === 'debug' || v === 'warn' || v === 'error') return v;
  // map 'verbose' / 'info' / lainnya → 'debug'
  return 'debug';
};

const forceLogsEnabled = String(import.meta.env.VITE_FORCE_LOGS || '').toLowerCase() === 'true';
const debugLevel: Level = normalizeLevel(import.meta.env.VITE_DEBUG_LEVEL);

// rank utk cek izin level
const levelRank: Record<Level, number> = { debug: 0, warn: 1, error: 2 };
const allowInfoLike = levelRank[debugLevel] <= levelRank.debug; // info/debug only
const allowWarnLike = levelRank[debugLevel] <= levelRank.warn;  // warn & debug

// ----------------------
// Host guards
// ----------------------

// ✅ Production host list (ketat, bukan includes sembarangan)
const PROD_HOSTS = new Set<string>([
  'kalkulator.monifine.my.id',
  'www.kalkulator.monifine.my.id',
]);

const isProductionHostname = (hostname: string): boolean => {
  return PROD_HOSTS.has(hostname);
};

// ✅ Dev/preview host list (override agar log nyala pada build produksi di preview)
const ENV_DEV_HOSTS = String(import.meta.env.VITE_DEV_HOSTS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// default: semua *.netlify.app (kecuali prod host di atas) dianggap dev/preview
const isPreviewHostname = (hostname: string): boolean => {
  if (ENV_DEV_HOSTS.length > 0) return ENV_DEV_HOSTS.includes(hostname);
  return hostname.endsWith('netlify.app');
};

// ✅ Optional blacklist host dari .env (comma separated)
// contoh: VITE_DISABLE_LOGS_ON_HOSTS=staging.monifine.my.id,preview.monifine.my.id
const disableLogsHosts = String(import.meta.env.VITE_DISABLE_LOGS_ON_HOSTS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ----------------------
// Final decision
// ----------------------
const getShouldLog = () => {
  // 1) Vite dev server → selalu nyala
  if (import.meta.env.DEV) return true;

  // 2) Paksa via env → nyala di mana saja (kecuali nanti ketemu drop console saat build prod)
  if (forceLogsEnabled) return true;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // 3) Host yang memang kita matikan via env
    if (disableLogsHosts.includes(hostname)) return false;

    // 4) Preview/dev host (Netlify preview, dsb) → nyala
    if (isPreviewHostname(hostname) && !isProductionHostname(hostname)) return true;

    // 5) Production host → mati
    if (isProductionHostname(hostname)) return false;
  }

  // 6) Default non-dev, non-forced → mati
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

// ----------------------
// Public logger API
// ----------------------
export const logger = {
  /** Sanity test */
  test: () => {
    if (hasConsole) {
      console.log('🧪 Logger Test:', {
        timestamp: new Date().toISOString(),
        shouldLog: getShouldLog(),
        isDevelopmentMode: import.meta.env.DEV,
        forceLogsEnabled,
        debugLevel
      });
    }
  },

  /** Context logs (umum) */
  context: (contextName: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔄 [${t}] [${contextName}]`, message, data)
        : console.log(`🔄 [${t}] [${contextName}]`, message);
    }
  },

  /** Component logs (umum) */
  component: (componentName: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🧩 [${t}] [${componentName}]`, message, data)
        : console.log(`🧩 [${t}] [${componentName}]`, message);
    }
  },

  /** Hook logs (umum) */
  hook: (hookName: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🪝 [${t}] [${hookName}]`, message, data)
        : console.log(`🪝 [${t}] [${hookName}]`, message);
    }
  },

  /** Info (hanya saat level debug) */
  info: (message: string, data?: any) => {
    if (hasConsole && getShouldLog() && allowInfoLike) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`ℹ️ [${t}]`, message, data)
        : console.log(`ℹ️ [${t}]`, message);
    }
  },

  /** Warning (hanya saat level debug/warn) */
  warn: (message: string, data?: any) => {
    if (hasConsole && getShouldLog() && allowWarnLike) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.warn(`⚠️ [${t}]`, message, data)
        : console.warn(`⚠️ [${t}]`, message);
    }
  },

  /** Error selalu tampil (note: di prod build bisa hilang karena esbuild.drop) */
  error: (message: string, error?: any) => {
    if (hasConsole) {
      const t = new Date().toISOString().slice(11, 23);
      error !== undefined
        ? console.error(`🚨 [${t}]`, message, error)
        : console.error(`🚨 [${t}]`, message);
    }
  },

  /** Debug (hanya saat level debug) */
  debug: (message: string, data?: any) => {
    if (hasConsole && getShouldLog() && allowInfoLike) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.debug(`🔍 [${t}]`, message, data)
        : console.debug(`🔍 [${t}]`, message);
    }
  },

  /** Success (umum) */
  success: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`✅ [${t}]`, message, data)
        : console.log(`✅ [${t}]`, message);
    }
  },

  /** API trace (umum) */
  api: (endpoint: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🌐 [${t}] [API:${endpoint}]`, message, data)
        : console.log(`🌐 [${t}] [API:${endpoint}]`, message);
    }
  },

  /** Performance trace (umum) */
  perf: (operation: string, duration: number, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      const icon = duration > 1000 ? '🐌' : duration > 500 ? '⏱️' : '⚡';
      data !== undefined
        ? console.log(`${icon} [${t}] [PERF:${operation}] ${duration}ms`, data)
        : console.log(`${icon} [${t}] [PERF:${operation}] ${duration}ms`);
    }
  },

  /** Critical error (selalu tampil) */
  criticalError: (message: string, error?: any) => {
    if (hasConsole) {
      const t = new Date().toISOString().slice(11, 23);
      error !== undefined
        ? console.error(`🚨 [${t}] CRITICAL:`, message, error)
        : console.error(`🚨 [${t}] CRITICAL:`, message);
    }
  },

  /** Payment flow (umum) */
  payment: (stage: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`💳 [${t}] [PAYMENT:${stage}]`, message, data)
        : console.log(`💳 [${t}] [PAYMENT:${stage}]`, message);
    }
  },

  /** Order verification (umum) */
  orderVerification: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🎫 [${t}] [ORDER-VERIFY]`, message, data)
        : console.log(`🎫 [${t}] [ORDER-VERIFY]`, message);
    }
  },

  /** Access check (umum) */
  accessCheck: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔐 [${t}] [ACCESS-CHECK]`, message, data)
        : console.log(`🔐 [${t}] [ACCESS-CHECK]`, message);
    }
  },

  /** Linking (umum) */
  linking: (message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔗 [${t}] [LINKING]`, message, data)
        : console.log(`🔗 [${t}] [LINKING]`, message);
    }
  },

  /** Cache ops (umum) */
  cache: (operation: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🗄️ [${t}] [CACHE:${operation}]`, message, data)
        : console.log(`🗄️ [${t}] [CACHE:${operation}]`, message);
    }
  },

  /** Flow steps (umum) */
  flow: (step: number, stage: string, message: string, data?: any) => {
    if (hasConsole && getShouldLog()) {
      const t = new Date().toISOString().slice(11, 23);
      data !== undefined
        ? console.log(`🔄 [${t}] [FLOW-${step}:${stage}]`, message, data)
        : console.log(`🔄 [${t}] [FLOW-${step}:${stage}]`, message);
    }
  }
};

// ----------------------
// Global debug helpers (browser only)
// ----------------------
if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;

  // Test immediately when loaded
  if (getShouldLog()) {
    console.log('🚀 Logger loaded! Environment:', {
      isDevelopmentMode: import.meta.env.DEV,
      SHOULD_LOG: getShouldLog(),
      level: debugLevel
    });
    logger.test();
  }

  (window as any).__DEBUG_PAYMENT__ = {
    test: () => {
      console.log('🧪 Payment debug test');
      logger.orderVerification('Test order verification log');
      logger.payment('TEST', 'Test payment log');
      logger.linking('Test linking log');
    },
    status: () => {
      console.log('🔧 Current logger status:', {
        SHOULD_LOG: getShouldLog(),
        isDevelopmentMode: import.meta.env.DEV,
        forceLogsEnabled,
        level: debugLevel
      });
    },
    forceEnableHint: () => {
      console.log('🔧 To force enable logs, set VITE_FORCE_LOGS=true (or build with custom mode).');
    }
  };
}
