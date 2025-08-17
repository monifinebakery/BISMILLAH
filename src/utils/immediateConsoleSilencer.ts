// utils/immediateConsoleSilencer.ts - Aggressive immediate console silencing

// This runs IMMEDIATELY when imported - no function calls needed

// Store original console FIRST before any logic
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

// Debug environment detection
__ORIGINAL_CONSOLE__.log('🔍 Console Silencer Debug:', {
  'import.meta.env.PROD': import.meta.env.PROD,
  'import.meta.env.MODE': import.meta.env.MODE,
  'import.meta.env.DEV': import.meta.env.DEV,
  'process.env.NODE_ENV': typeof process !== 'undefined' ? process.env?.NODE_ENV : 'undefined',
  'window.location.hostname': typeof window !== 'undefined' ? window.location.hostname : 'N/A'
});

// Detect production environment
let isProduction = false;

// Only enable in actual production builds
if (import.meta.env.PROD === true || import.meta.env.MODE === 'production') {
  isProduction = true;
  __ORIGINAL_CONSOLE__.log('🚫 Production environment detected via import.meta.env');
}

// Also check hostname-based detection
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const productionHosts = [
    'kalkulator.monifine.my.id',
    'www.kalkulator.monifine.my.id',
    // Netlify production patterns (based on screenshot)
    'gleaming-peony-f4a091.netlify.app', 
    // General Netlify patterns
    /.*--.*\.netlify\.app$/,
    /.*\.netlify\.app$/
  ];
  
  const isProductionHost = productionHosts.some(host => 
    typeof host === 'string' ? hostname === host : host.test(hostname)
  );
  
  if (isProductionHost) {
    isProduction = true;
    __ORIGINAL_CONSOLE__.log('🚫 Production environment detected via hostname:', hostname);
  }
}

__ORIGINAL_CONSOLE__.log('🎯 Final decision - isProduction:', isProduction);

if (isProduction) {
  // IMMEDIATE SILENT OVERRIDE - no debug messages
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
    if (args.some(arg => typeof arg === 'string' && arg.includes('CRITICAL'))) {
      __ORIGINAL_CONSOLE__.error(...args);
    }
  };
  
  // Set global flag
  if (typeof window !== 'undefined') {
    (window as any).__CONSOLE_SILENCED__ = true;
    (window as any).__ORIGINAL_CONSOLE__ = __ORIGINAL_CONSOLE__;
  }
  
  __ORIGINAL_CONSOLE__.log('🚫 Console has been silenced for production');
} else {
  __ORIGINAL_CONSOLE__.log('✅ Console active for development - no silencing applied');
}

// Always expose recovery functions
if (typeof window !== 'undefined') {
  (window as any).__RESTORE_CONSOLE__ = () => {
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
    console.log('✅ Console restored successfully!');
  };
}

// Export for explicit calls if needed
export const silenceConsole = () => {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.trace = () => {};
  console.table = () => {};
  console.group = () => {};
  console.groupCollapsed = () => {};
  console.groupEnd = () => {};
};
