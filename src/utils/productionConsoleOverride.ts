// utils/productionConsoleOverride.ts - Override console in production

/**
 * 🚫 Production Console Override
 * Disables all console logging in production environment
 */

// Store original console methods
const originalConsole = {
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

// Function to disable console in production
export function disableConsoleInProduction() {
  // Only disable if we're in production
  const isProduction = import.meta.env.PROD || 
                      import.meta.env.MODE === 'production' || 
                      process.env.NODE_ENV === 'production';
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProductionHost = hostname === 'kalkulator.monifine.my.id' || 
                          hostname === 'www.kalkulator.monifine.my.id';
  
  // If we're in production OR on production hostname, disable console
  if (isProduction || isProductionHost) {
    console.log = () => {};
    console.warn = () => {};
    console.debug = () => {};
    console.info = () => {};
    console.trace = () => {};
    console.table = () => {};
    console.group = () => {};
    console.groupCollapsed = () => {};
    console.groupEnd = () => {};
    
    // Keep console.error for critical errors only
    console.error = (...args: any[]) => {
      // Only allow critical errors (those with "CRITICAL" in message)
      if (args.some(arg => typeof arg === 'string' && arg.includes('CRITICAL'))) {
        originalConsole.error(...args);
      }
    };
    
    // Create a flag to indicate console is disabled
    (window as any).__CONSOLE_DISABLED__ = true;
  }
}

// Function to restore console (for debugging)
export function restoreConsole() {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
  console.trace = originalConsole.trace;
  console.table = originalConsole.table;
  console.group = originalConsole.group;
  console.groupCollapsed = originalConsole.groupCollapsed;
  console.groupEnd = originalConsole.groupEnd;
  
  (window as any).__CONSOLE_DISABLED__ = false;
}

// Development helper
if (typeof window !== 'undefined') {
  (window as any).__RESTORE_CONSOLE__ = restoreConsole;
  (window as any).__DISABLE_CONSOLE__ = disableConsoleInProduction;
  (window as any).__ORIGINAL_CONSOLE__ = originalConsole;
}
