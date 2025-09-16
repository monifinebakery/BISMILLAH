// debug-user-errors.js
// Simple debugging script for users experiencing issues
// Just paste this in browser console to get detailed error info

console.log('🔍 Starting User Error Debug Session...');

// Get browser info
const browserInfo = {
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  cookieEnabled: navigator.cookieEnabled,
  onLine: navigator.onLine,
  screenSize: `${screen.width}x${screen.height}`,
  viewportSize: `${window.innerWidth}x${window.innerHeight}`,
  colorDepth: screen.colorDepth,
  pixelRatio: window.devicePixelRatio,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  url: window.location.href
};

console.log('📱 Browser Info:', browserInfo);

// Check for error monitoring
if (window.__USER_ERROR_MONITOR__) {
  console.log('✅ Error monitoring is active');
  const stats = window.__USER_ERROR_MONITOR__.getStats();
  const errors = window.__USER_ERROR_MONITOR__.getStoredErrors();
  
  console.log('📊 Error Stats:', stats);
  console.log('🚨 Stored Errors:', errors);
  
  if (errors.length > 0) {
    console.log('🔍 Recent errors detected. Details:');
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`, {
        message: error.error_message,
        type: error.error_type,
        timestamp: error.timestamp,
        url: error.page_info?.url,
        browser: error.browser_info?.userAgent
      });
    });
  }
} else {
  console.log('❌ Error monitoring not found');
}

// Check for logger
if (window.__LOGGER__) {
  console.log('✅ Logger is available');
  window.__LOGGER__.test();
} else {
  console.log('❌ Logger not found');
}

// Check for debug payment tools
if (window.__DEBUG_PAYMENT__) {
  console.log('✅ Payment debug tools available');
  window.__DEBUG_PAYMENT__.status();
} else {
  console.log('❌ Payment debug tools not found');
}

// Check React DevTools
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools available');
} else {
  console.log('❌ React DevTools not available');
}

// Check localStorage errors
try {
  const localStorageErrors = localStorage.getItem('userErrors');
  if (localStorageErrors) {
    const parsedErrors = JSON.parse(localStorageErrors);
    console.log('💾 LocalStorage errors:', parsedErrors);
  } else {
    console.log('💾 No stored errors in localStorage');
  }
} catch (e) {
  console.log('❌ Could not access localStorage errors:', e);
}

// Check for common issues
const commonChecks = {
  hasJavaScript: typeof window !== 'undefined',
  hasConsole: typeof console !== 'undefined',
  hasLocalStorage: typeof localStorage !== 'undefined',
  hasSessionStorage: typeof sessionStorage !== 'undefined',
  hasFetch: typeof fetch !== 'undefined',
  hasPromise: typeof Promise !== 'undefined',
  hasAsync: (async () => {})() instanceof Promise
};

console.log('🔧 Common JavaScript features:', commonChecks);

// Memory usage (if available)
if (performance.memory) {
  console.log('🧠 Memory Usage:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
  });
}

// Network connection info
if (navigator.connection) {
  console.log('🌐 Connection Info:', {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt,
    saveData: navigator.connection.saveData
  });
}

// Test basic functionality
console.log('🧪 Testing basic functionality...');

// Test Array operations
try {
  const testArray = [1, 2, 3];
  const mapped = testArray.map(x => x * 2);
  const filtered = testArray.filter(x => x > 1);
  console.log('✅ Array operations work:', { mapped, filtered });
} catch (e) {
  console.log('❌ Array operations failed:', e);
}

// Test Object operations
try {
  const testObj = { a: 1, b: 2 };
  const keys = Object.keys(testObj);
  const values = Object.values(testObj);
  console.log('✅ Object operations work:', { keys, values });
} catch (e) {
  console.log('❌ Object operations failed:', e);
}

// Test boolean iteration (common error)
try {
  const booleanValue = false;
  // This should NOT work
  const iterationTest = [...booleanValue];
  console.log('❌ Boolean iteration should have failed but worked:', iterationTest);
} catch (e) {
  console.log('✅ Boolean iteration correctly fails:', e.message);
}

console.log('🏁 Debug session complete!');
console.log('📋 Summary: Check the logs above for any ❌ indicators');
console.log('💡 If you see errors, take a screenshot and send to support');

// Export debug info for easy copying
window.debugInfo = {
  timestamp: new Date().toISOString(),
  browserInfo,
  commonChecks,
  errorMonitoringActive: !!window.__USER_ERROR_MONITOR__,
  loggerActive: !!window.__LOGGER__,
  debugPaymentActive: !!window.__DEBUG_PAYMENT__,
  reactDevToolsActive: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
  memoryInfo: performance.memory ? {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
  } : null,
  connectionInfo: navigator.connection ? {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink
  } : null
};

console.log('📁 Debug info saved to window.debugInfo - you can copy this object');