// ✅ SCHEDULER POLYFILL - Must be FIRST before any React imports
if (typeof globalThis !== 'undefined' && typeof window !== 'undefined') {
  // Ensure globalThis.scheduler exists
  if (!globalThis.scheduler) {
    globalThis.scheduler = {};
  }
  
  // Polyfill missing scheduler methods
  const scheduler = globalThis.scheduler;
  
  if (!scheduler.unstable_scheduleCallback) {
    scheduler.unstable_scheduleCallback = function(priority, callback, options) {
      const timeoutId = setTimeout(callback, 0);
      return { id: timeoutId };
    };
  }
  
  if (!scheduler.unstable_cancelCallback) {
    scheduler.unstable_cancelCallback = function(callbackNode) {
      if (callbackNode && callbackNode.id) {
        clearTimeout(callbackNode.id);
      }
    };
  }
  
  if (!scheduler.unstable_shouldYield) {
    scheduler.unstable_shouldYield = function() {
      return false;
    };
  }
  
  if (!scheduler.unstable_requestPaint) {
    scheduler.unstable_requestPaint = function() {};
  }
  
  if (!scheduler.unstable_now) {
    scheduler.unstable_now = function() {
      return performance.now ? performance.now() : Date.now();
    };
  }
  
  // Also add to window for compatibility
  if (!window.scheduler) {
    window.scheduler = scheduler;
  }
}

if (import.meta.env.DEV) {
  import('./utils/debugOrderService');
}

// ✅ FIXED: Import logger IMMEDIATELY and override BEFORE React import
import { logger } from './utils/logger';

// ✅ STEP 1: FORCE OVERRIDE LOGGER IMMEDIATELY
console.log('🔥 MAIN.TSX: Force overriding logger immediately');

// Override logger methods directly in the imported logger object
const originalLogger = { ...logger };

// ✅ Force enable all methods by overriding the logger object
Object.assign(logger, {
  // ✅ Always enable debug logs
  debug: (msg: string, data?: any) => {
    if (data !== undefined) {
      console.log('🔍 DEBUG:', msg, data);
    } else {
      console.log('🔍 DEBUG:', msg);
    }
  },
  
  // ✅ Always enable info logs  
  info: (msg: string, data?: any) => {
    if (data !== undefined) {
      console.log('ℹ️ INFO:', msg, data);
    } else {
      console.log('ℹ️ INFO:', msg);
    }
  },
  
  // ✅ Always enable success logs
  success: (msg: string, data?: any) => {
    if (data !== undefined) {
      console.log('✅ SUCCESS:', msg, data);
    } else {
      console.log('✅ SUCCESS:', msg);
    }
  },
  
  // ✅ Always enable context logs
  context: (name: string, msg: string, data?: any) => {
    if (data !== undefined) {
      console.log(`🔄 CONTEXT [${name}]:`, msg, data);
    } else {
      console.log(`🔄 CONTEXT [${name}]:`, msg);
    }
  },
  
  // ✅ Always enable component logs
  component: (name: string, msg: string, data?: any) => {
    if (data !== undefined) {
      console.log(`🧩 COMPONENT [${name}]:`, msg, data);
    } else {
      console.log(`🧩 COMPONENT [${name}]:`, msg);
    }
  },
  
  // ✅ Always enable hook logs
  hook: (name: string, msg: string, data?: any) => {
    if (data !== undefined) {
      console.log(`🪝 HOOK [${name}]:`, msg, data);
    } else {
      console.log(`🪝 HOOK [${name}]:`, msg);
    }
  },
  
  // ✅ Always enable API logs
  api: (endpoint: string, msg: string, data?: any) => {
    if (data !== undefined) {
      console.log(`🌐 API [${endpoint}]:`, msg, data);
    } else {
      console.log(`🌐 API [${endpoint}]:`, msg);
    }
  },
  
  // ✅ Keep original methods
  warn: originalLogger.warn,
  error: originalLogger.error,
  criticalError: originalLogger.criticalError,
  perf: originalLogger.perf,
  orderVerification: originalLogger.orderVerification,
  test: originalLogger.test,
  getEnv: originalLogger.getEnv
});

// ✅ Also set window logger immediately
(window as any).__LOGGER__ = logger;

console.log('🚀 MAIN.TSX: Logger methods force-enabled BEFORE React import!');
logger.test();
logger.debug('Logger override test - debug from main.tsx');
logger.info('Logger override test - info from main.tsx');
logger.success('Logger override test - success from main.tsx');

// NOW import React and other components
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// ✅ Remove the old logger override code since we did it above

// ✅ Add global test functions
(window as any).testLogger = () => {
  console.log('🧪 Manual logger test');
  logger.debug('Manual test - debug works');
  logger.info('Manual test - info works');  
  logger.success('Manual test - success works');
  logger.error('Manual test - error works');
};

(window as any).checkLoggerState = () => {
  console.log('🔍 Logger State Check:', {
    loggerExists: !!logger,
    windowLoggerExists: !!(window as any).__LOGGER__,
    debugMethod: typeof logger.debug,
    infoMethod: typeof logger.info,
    environment: logger.getEnv()
  });
};

console.log('💡 Global functions available:');
console.log('  - window.testLogger() - Test logger methods');
console.log('  - window.checkLoggerState() - Check logger state');

// ✅ Ensure root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

// ✅ Create and render app
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);