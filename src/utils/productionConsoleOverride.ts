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
  // Check multiple conditions for production
  const envProd = import.meta.env.PROD;
  const envMode = import.meta.env.MODE === 'production';
  const nodeEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  
  // Check hostname if available
  let hostProd = false;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    hostProd = hostname === 'kalkulator.monifine.my.id' || 
               hostname === 'www.kalkulator.monifine.my.id' ||
               hostname.includes('netlify.app') || // Netlify production
               hostname.includes('vercel.app');   // Vercel production
  }
  
  // More aggressive production detection
  const isProduction = envProd || envMode || nodeEnv || hostProd;
  
  // Debug info (will be silenced once console is disabled)
  originalConsole.log('🔍 Console Override Check:', {
    envProd, envMode, nodeEnv, hostProd,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    willDisable: isProduction
  });
  
  if (isProduction) {
    // Disable all console methods immediately
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
    
    // Set global flags
    if (typeof window !== 'undefined') {
      (window as any).__CONSOLE_DISABLED__ = true;
    }
    if (typeof global !== 'undefined') {
      (global as any).__CONSOLE_DISABLED__ = true;
    }
    
    // Confirmation that console is disabled
    originalConsole.log('🚫 Console disabled for production');
  } else {
    originalConsole.log('✅ Console active for development');
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

// IMMEDIATE EXECUTION - Run as soon as this module is imported
// This ensures console is disabled before any other code runs
if (typeof window === 'undefined') {
  // Server-side: disable immediately if in production build
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    console.log = () => {};
    console.warn = () => {};
    console.debug = () => {};
    console.info = () => {};
  }
} else {
  // Client-side: wait for DOM ready then disable
  const checkAndDisable = () => {
    disableConsoleInProduction();
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndDisable);
  } else {
    checkAndDisable();
  }
}
