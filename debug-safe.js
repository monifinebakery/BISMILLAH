// Safe debug script - menangkap boolean iteration error dengan aman
console.log('🔍 Safe debug script loaded...');

// Clear existing debug properties if they exist
const debugProps = ['bahanBaku', 'suppliers', 'recipes', 'transactions', 'orders', 'notifications'];
debugProps.forEach(prop => {
  try {
    delete window[`debug_${prop}`];
  } catch (e) {
    // Ignore if property doesn't exist or can't be deleted
  }
});

// Enhanced error handler that catches more details
const originalErrorHandler = window.onerror;
const originalUnhandledRejection = window.onunhandledrejection;

// Track error occurrences
let errorCount = 0;
const maxErrors = 5; // Prevent spam

window.onerror = function(message, source, lineno, colno, error) {
  if (errorCount >= maxErrors) return;
  
  if (message && message.includes('boolean false is not iterable')) {
    errorCount++;
    console.error('🚨 BOOLEAN ITERATION ERROR CAUGHT:', {
      count: errorCount,
      message,
      source,
      lineno,
      colno,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      location: window.location.href,
      userAgent: navigator.userAgent.slice(0, 100)
    });
    
    // Try to get React component info if available
    try {
      const reactFiber = document.querySelector('[data-reactroot]');
      if (reactFiber && reactFiber._reactInternalFiber) {
        console.log('📊 React fiber info available');
      }
    } catch (e) {
      // Ignore
    }
    
    // Log current URL hash/params for context
    console.log('📍 Current context:', {
      pathname: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search
    });
  }
  
  if (originalErrorHandler) {
    return originalErrorHandler.call(this, message, source, lineno, colno, error);
  }
};

// Also catch promise rejections
window.onunhandledrejection = function(event) {
  if (event.reason && event.reason.message && event.reason.message.includes('boolean false is not iterable')) {
    console.error('🚨 UNHANDLED PROMISE REJECTION - Boolean iteration:', {
      reason: event.reason,
      stack: event.reason.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  if (originalUnhandledRejection) {
    return originalUnhandledRejection.call(this, event);
  }
};

// Enhanced Array method patching with better error reporting
const originalMap = Array.prototype.map;
const originalFilter = Array.prototype.filter;
const originalReduce = Array.prototype.reduce;

Array.prototype.map = function(...args) {
  if (this == null || this === false) {
    const error = new Error(`Attempting to call .map() on: ${this}`);
    console.error('🚨 MAP ON FALSE/NULL:', {
      value: this,
      type: typeof this,
      stack: error.stack,
      args: args.length
    });
    
    // Return empty array instead of throwing
    return [];
  }
  if (!Array.isArray(this)) {
    console.warn('⚠️ MAP ON NON-ARRAY:', {
      value: this,
      type: typeof this,
      isArray: Array.isArray(this),
      hasLength: 'length' in this
    });
  }
  return originalMap.apply(this, args);
};

Array.prototype.filter = function(...args) {
  if (this == null || this === false) {
    const error = new Error(`Attempting to call .filter() on: ${this}`);
    console.error('🚨 FILTER ON FALSE/NULL:', {
      value: this,
      type: typeof this,
      stack: error.stack,
      args: args.length
    });
    
    // Return empty array instead of throwing
    return [];
  }
  if (!Array.isArray(this)) {
    console.warn('⚠️ FILTER ON NON-ARRAY:', {
      value: this,
      type: typeof this,
      isArray: Array.isArray(this),
      hasLength: 'length' in this
    });
  }
  return originalFilter.apply(this, args);
};

Array.prototype.reduce = function(...args) {
  if (this == null || this === false) {
    const error = new Error(`Attempting to call .reduce() on: ${this}`);
    console.error('🚨 REDUCE ON FALSE/NULL:', {
      value: this,
      type: typeof this,
      stack: error.stack,
      args: args.length
    });
    
    // Return initial value or empty array
    return args.length > 1 ? args[1] : [];
  }
  if (!Array.isArray(this)) {
    console.warn('⚠️ REDUCE ON NON-ARRAY:', {
      value: this,
      type: typeof this,
      isArray: Array.isArray(this),
      hasLength: 'length' in this
    });
  }
  return originalReduce.apply(this, args);
};

// Monitor specific React Query keys that might return false
const monitorReactQuery = () => {
  try {
    // Try to access React Query client
    if (window.queryClient || window.__REACT_QUERY_CLIENT__) {
      const client = window.queryClient || window.__REACT_QUERY_CLIENT__;
      const cache = client.getQueryCache();
      
      if (cache) {
        const queries = cache.getAll();
        queries.forEach(query => {
          const data = query.state.data;
          if (data === false) {
            console.warn('⚠️ React Query with boolean false data:', {
              queryKey: query.queryKey,
              status: query.state.status,
              dataUpdatedAt: query.state.dataUpdatedAt
            });
          }
        });
      }
    }
  } catch (e) {
    // Silent fail for monitoring
  }
};

// Monitor every 3 seconds for React Query issues
const monitorInterval = setInterval(monitorReactQuery, 3000);

// Stop monitoring after 2 minutes to prevent performance impact
setTimeout(() => {
  clearInterval(monitorInterval);
  console.log('🔍 Debug monitoring stopped after 2 minutes');
}, 120000);

// Hook into React DevTools if available
try {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
    const hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook.onCommitFiberRoot) {
      const originalOnCommit = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = function(...args) {
        try {
          // Monitor for components with potentially problematic props
          const fiberRoot = args[1];
          if (fiberRoot && fiberRoot.current) {
            // This is just a marker for debugging
            console.debug('🔍 React commit detected');
          }
        } catch (e) {
          // Ignore errors in monitoring
        }
        return originalOnCommit.apply(this, args);
      };
    }
  }
} catch (e) {
  console.log('React DevTools hook not available');
}

console.log('✅ Safe debug monitoring active');
console.log('💡 Will monitor for boolean iteration errors for 2 minutes');
console.log('🎯 Try to reproduce the error now - detailed info will be logged');
