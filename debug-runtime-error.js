// Debug script untuk menangkap error "boolean false is not iterable"
// Jalankan di browser console untuk monitoring real-time

console.log('🔍 Debug script loaded - monitoring for boolean iteration errors...');

// Hook global error handler untuk menangkap error
const originalErrorHandler = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (message && message.includes('boolean false is not iterable')) {
    console.error('🚨 CAUGHT BOOLEAN ITERATION ERROR:', {
      message,
      source,
      lineno,
      colno,
      error,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
    
    // Inspect React DevTools jika tersedia
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
      console.log('📊 React DevTools available, inspecting components...');
    }
    
    // Log current URL dan state aplikasi
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Document title:', document.title);
  }
  
  // Call original error handler
  if (originalErrorHandler) {
    return originalErrorHandler.call(this, message, source, lineno, colno, error);
  }
};

// Monkey patch Array methods untuk debugging
const originalMap = Array.prototype.map;
Array.prototype.map = function(...args) {
  if (this == null || this === false) {
    console.error('🚨 Attempting to call .map() on:', this);
    console.trace('Stack trace:');
    return [];
  }
  return originalMap.apply(this, args);
};

const originalFilter = Array.prototype.filter;
Array.prototype.filter = function(...args) {
  if (this == null || this === false) {
    console.error('🚨 Attempting to call .filter() on:', this);
    console.trace('Stack trace:');
    return [];
  }
  return originalFilter.apply(this, args);
};

// Monitor React Query cache untuk values yang mungkin boolean false
if (window.__REACT_QUERY_STATE__) {
  console.log('🔍 React Query state available, monitoring...');
  
  setInterval(() => {
    try {
      const queryClient = window.queryClient;
      if (queryClient) {
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.getAll();
        
        queries.forEach(query => {
          const data = query.state.data;
          if (data === false || data === null) {
            console.warn('⚠️ Query with potentially problematic data:', {
              queryKey: query.queryKey,
              data: data,
              status: query.state.status
            });
          }
        });
      }
    } catch (e) {
      // Silent fail untuk monitoring
    }
  }, 5000);
}

// Monitor specific patterns yang sering bermasalah
const monitorPatterns = [
  'bahanBaku',
  'suppliers',
  'recipes',
  'transactions',
  'orders',
  'notifications'
];

monitorPatterns.forEach(pattern => {
  Object.defineProperty(window, `debug_${pattern}`, {
    get() {
      return this[`_${pattern}`];
    },
    set(value) {
      if (value === false) {
        console.warn(`🚨 ${pattern} set to boolean false!`);
        console.trace('Stack trace:');
      }
      this[`_${pattern}`] = value;
    }
  });
});

console.log('✅ Debug monitoring active. Check console for boolean iteration errors.');
console.log('💡 Patterns being monitored:', monitorPatterns);
