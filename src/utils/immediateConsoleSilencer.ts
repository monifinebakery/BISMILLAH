// utils/immediateConsoleSilencer.ts - Aggressive immediate console silencing

// This runs IMMEDIATELY when imported - no function calls needed

// Detect production environment
let isProduction = 
  (typeof import !== 'undefined' && import.meta?.env?.PROD) ||
  (typeof import !== 'undefined' && import.meta?.env?.MODE === 'production') ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

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
  }
}

// Store original console for recovery
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
