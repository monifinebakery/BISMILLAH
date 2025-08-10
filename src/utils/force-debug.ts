// src/utils/force-debug.ts - PAKSA CONSOLE KELUAR!

// ✅ IMMEDIATE CONSOLE TEST - INI PASTI KELUAR
console.log('🚀🚀🚀 FORCE DEBUG LOADED! 🚀🚀🚀');
console.log('🚀🚀🚀 FORCE DEBUG LOADED! 🚀🚀🚀');
console.log('🚀🚀🚀 FORCE DEBUG LOADED! 🚀🚀🚀');

// Test semua jenis console
console.log('✅ console.log works');
console.warn('⚠️ console.warn works');
console.error('🚨 console.error works');
console.info('ℹ️ console.info works');
console.debug('🔍 console.debug works');

// Test dengan styling
console.log('%c🎨 STYLED CONSOLE TEST', 'color: red; font-size: 20px; font-weight: bold;');

// Environment debug
console.log('🔍 RAW ENV:', {
  'import.meta.env': import.meta.env,
  'all keys': Object.keys(import.meta.env),
  'DEV': import.meta.env.DEV,
  'MODE': import.meta.env.MODE,
  'VITE_DEBUG_LEVEL': import.meta.env.VITE_DEBUG_LEVEL,
  'VITE_FORCE_LOGS': import.meta.env.VITE_FORCE_LOGS,
});

// Window info
if (typeof window !== 'undefined') {
  console.log('🌐 WINDOW INFO:', {
    hostname: window.location.hostname,
    href: window.location.href,
    userAgent: navigator.userAgent,
    consoleExists: typeof console !== 'undefined',
    consoleKeys: Object.keys(console),
  });
}

// Test setInterval untuk memastikan console tidak di-override
let counter = 0;
const intervalId = setInterval(() => {
  counter++;
  console.log(`🔄 INTERVAL TEST ${counter}/5 - Console still working!`);
  
  if (counter >= 5) {
    clearInterval(intervalId);
    console.log('✅ INTERVAL TEST COMPLETED');
  }
}, 1000);

// Test berbagai method console
const testAllConsoleMethods = () => {
  console.log('📋 TESTING ALL CONSOLE METHODS:');
  
  const methods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'table', 'group', 'groupEnd'];
  
  methods.forEach(method => {
    if (typeof (console as any)[method] === 'function') {
      try {
        (console as any)[method](`✅ console.${method} works`);
      } catch (e) {
        console.error(`❌ console.${method} failed:`, e);
      }
    } else {
      console.error(`❌ console.${method} not available`);
    }
  });
};

testAllConsoleMethods();

// Test dengan delay
setTimeout(() => {
  console.log('⏰ DELAYED TEST 1s - Console still working!');
}, 1000);

setTimeout(() => {
  console.log('⏰ DELAYED TEST 3s - Console still working!');
}, 3000);

// Export function untuk manual test
export const forceDebugTest = () => {
  console.log('🧪 MANUAL DEBUG TEST CALLED');
  console.log('Environment:', import.meta.env);
  console.log('Window location:', window.location.href);
  console.log('Current time:', new Date().toISOString());
  
  // Test styling
  console.log('%cIf you see this styled message, console is definitely working!', 
    'background: #000; color: #fff; padding: 10px; font-size: 16px;'
  );
  
  return true;
};

// Attach to window immediately
if (typeof window !== 'undefined') {
  (window as any).forceDebugTest = forceDebugTest;
  (window as any).FORCE_CONSOLE_TEST = () => {
    console.log('🎯 DIRECT CONSOLE TEST FROM WINDOW');
    return 'Console is working!';
  };
  
  console.log('🔧 DEBUG FUNCTIONS ATTACHED TO WINDOW:');
  console.log('- window.forceDebugTest()');
  console.log('- window.FORCE_CONSOLE_TEST()');
}

// Test apakah ada yang override console
const originalConsole = { ...console };
let overrideDetected = false;

// Monitor console override
Object.defineProperty(window, 'console', {
  get() { return originalConsole; },
  set(value) {
    console.error('🚨 CONSOLE OVERRIDE DETECTED!', value);
    overrideDetected = true;
    return originalConsole;
  }
});

// Final test
console.log('🏁 FORCE DEBUG SETUP COMPLETE');
console.log('Override detected:', overrideDetected);

export default forceDebugTest;