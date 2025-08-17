// utils/immediateConsoleSilencer.ts - FIXED dev detection

// ✅ IMMEDIATE: Store original console FIRST
const __ORIGINAL_CONSOLE__ = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  info: console.info,
  trace: console.trace,
  table: console.table,
  group: console.group,
  groupCollapsed: console.groupCollapsed,
  groupEnd: console.groupEnd,
};

// ✅ ROBUST: Multiple environment checks
let isProduction = false;
let isDevelopment = false;

// ✅ DEVELOPMENT DETECTION: Check dev indicators first
if (import.meta.env.DEV === true || 
    import.meta.env.MODE === 'development' ||
    import.meta.env.NODE_ENV === 'development') {
  isDevelopment = true;
  __ORIGINAL_CONSOLE__.log('🛠️ DEVELOPMENT mode detected - console will remain active');
}

// ✅ PRODUCTION DETECTION: Only if NOT development
if (!isDevelopment && (
    import.meta.env.PROD === true || 
    import.meta.env.MODE === 'production' ||
    import.meta.env.NODE_ENV === 'production'
)) {
  isProduction = true;
  __ORIGINAL_CONSOLE__.log('🚫 PRODUCTION mode detected - console will be silenced');
}

// ✅ HOSTNAME DETECTION: Additional checks (non-blocking)
const checkHostname = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const hostname = window.location.hostname;
    
    // ✅ EXPLICIT: Development hostnames (these should NEVER be silenced)
    const developmentHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      // Local IP ranges
      /^192\.168\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
      // Netlify dev branches
      /^dev\d*--.*\.netlify\.app$/,
      /^main--.*\.netlify\.app$/,
      /^staging--.*\.netlify\.app$/,
      /^preview--.*\.netlify\.app$/,
      // Vite dev server
      /^.*\.local$/,
      /^.*\.test$/
    ];
    
    // ✅ PRODUCTION: Only these exact hostnames
    const productionHosts = [
      'kalkulator.monifine.my.id',
      'www.kalkulator.monifine.my.id',
      'gleaming-peony-f4a091.netlify.app' // Main production deploy only
    ];
    
    const isDevHost = developmentHosts.some(pattern => 
      typeof pattern === 'string' ? hostname === pattern : pattern.test(hostname)
    );
    
    const isProdHost = productionHosts.includes(hostname);
    
    __ORIGINAL_CONSOLE__.log('🔍 Hostname analysis:', {
      hostname,
      isDevHost,
      isProdHost,
      currentDecision: { isDevelopment, isProduction }
    });
    
    // ✅ OVERRIDE: Force development if dev hostname detected
    if (isDevHost && !isProdHost) {
      if (isProduction) {
        __ORIGINAL_CONSOLE__.log('🔄 OVERRIDE: Development hostname detected, restoring console...');
        restoreConsole();
        isDevelopment = true;
        isProduction = false;
      }
      return;
    }
    
    // ✅ ADDITIONAL: Silence if production hostname and not already silenced
    if (isProdHost && !isDevHost && !isProduction && !isDevelopment) {
      __ORIGINAL_CONSOLE__.log('🚫 Production hostname detected, silencing console...');
      silenceConsole();
      isProduction = true;
      isDevelopment = false;
    }
    
  } catch (error) {
    __ORIGINAL_CONSOLE__.warn('Hostname check failed:', error);
  }
};

// ✅ CONSOLE MANAGEMENT FUNCTIONS
const silenceConsole = () => {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.trace = () => {};
  console.table = () => {};
  console.group = () => {};
  console.groupCollapsed = () => {};
  console.groupEnd = () => {};
  
  // Keep critical errors only
  console.error = (...args: any[]) => {
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('CRITICAL')) {
      __ORIGINAL_CONSOLE__.error(...args);
    }
  };
  
  if (typeof window !== 'undefined') {
    (window as any).__CONSOLE_SILENCED__ = true;
  }
};

const restoreConsole = () => {
  console.log = __ORIGINAL_CONSOLE__.log;
  console.warn = __ORIGINAL_CONSOLE__.warn;
  console.error = __ORIGINAL_CONSOLE__.error;
  console.debug = __ORIGINAL_CONSOLE__.debug;
  console.info = __ORIGINAL_CONSOLE__.info;
  console.trace = __ORIGINAL_CONSOLE__.trace;
  console.table = __ORIGINAL_CONSOLE__.table;
  console.group = __ORIGINAL_CONSOLE__.group;
  console.groupCollapsed = __ORIGINAL_CONSOLE__.groupCollapsed;
  console.groupEnd = __ORIGINAL_CONSOLE__.groupEnd;
  
  if (typeof window !== 'undefined') {
    (window as any).__CONSOLE_SILENCED__ = false;
  }
};

// ✅ APPLY INITIAL DECISION
if (isDevelopment) {
  // ✅ DEVELOPMENT: Keep console active
  __ORIGINAL_CONSOLE__.log('✅ Console remains ACTIVE for development');
} else if (isProduction) {
  // ✅ PRODUCTION: Silence console
  silenceConsole();
  __ORIGINAL_CONSOLE__.log('🚫 Console SILENCED for production');
} else {
  // ✅ UNKNOWN: Default to development (safe choice)
  __ORIGINAL_CONSOLE__.log('❓ Environment unclear, defaulting to DEVELOPMENT mode (console active)');
  isDevelopment = true;
}

// ✅ DEFERRED: Hostname check (non-blocking)
if (typeof window !== 'undefined') {
  // Set global references
  (window as any).__ORIGINAL_CONSOLE__ = __ORIGINAL_CONSOLE__;
  (window as any).__CONSOLE_SILENCED__ = isProduction;
  
  // ✅ RECOVERY FUNCTIONS
  (window as any).__RESTORE_CONSOLE__ = () => {
    restoreConsole();
    isDevelopment = true;
    isProduction = false;
    console.log('✅ Console restored manually!');
  };
  
  (window as any).__SILENCE_CONSOLE__ = () => {
    silenceConsole();
    isDevelopment = false;
    isProduction = true;
    __ORIGINAL_CONSOLE__.log('🚫 Console silenced manually!');
  };
  
  (window as any).__CONSOLE_STATUS__ = () => {
    const logFunc = (window as any).__CONSOLE_SILENCED__ ? __ORIGINAL_CONSOLE__.log : console.log;
    logFunc('📊 Console Status:', {
      silenced: (window as any).__CONSOLE_SILENCED__ || false,
      isDevelopment,
      isProduction,
      hostname: window.location.hostname,
      'import.meta.env.DEV': import.meta.env.DEV,
      'import.meta.env.PROD': import.meta.env.PROD,
      'import.meta.env.MODE': import.meta.env.MODE,
      canRestore: true,
      canSilence: true
    });
    
    if ((window as any).__CONSOLE_SILENCED__) {
      logFunc('🔧 To restore: window.__RESTORE_CONSOLE__()');
    } else {
      logFunc('🔧 To silence: window.__SILENCE_CONSOLE__()');
    }
  };
  
  // ✅ DEFERRED: Non-blocking hostname check
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      checkHostname();
    });
  });
}

// ✅ EXPORTS
export const silenceConsoleManually = silenceConsole;
export const restoreConsoleManually = restoreConsole;
export const isConsoleSilenced = () => isProduction;
export const isConsoleDevelopment = () => isDevelopment;

// ✅ DEBUG INFO (using original console to ensure it shows)
__ORIGINAL_CONSOLE__.log('🎯 Console Silencer Initialized:', {
  isDevelopment,
  isProduction,
  willBeSilenced: isProduction,
  'import.meta.env.DEV': import.meta.env.DEV,
  'import.meta.env.MODE': import.meta.env.MODE
});