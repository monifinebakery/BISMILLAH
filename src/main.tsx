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

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// ✅ STEP 1: FORCE ENABLE ALL LOGGING in development
// Safe environment check for browser console
const isDevelopment = (() => {
  try {
    return import.meta.env?.DEV || import.meta.env?.MODE === 'development';
  } catch {
    // Fallback for browser console
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('dev') ||
           !window.location.hostname.includes('.com');
  }
})();

// ✅ STEP 1: FORCE ENABLE ALL LOGGING - Always enable in development
const FORCE_ENABLE_LOGGING = true; // Change to false for production

if (FORCE_ENABLE_LOGGING) {
  console.log('🔥 DEV MODE - Force enabling all logs');
  console.log('🔍 React version:', React.version);
  console.log('🔍 Scheduler available:', !!globalThis.scheduler?.unstable_scheduleCallback);
  
  // ✅ Wait for logger to be available and then override
  const enableLogger = () => {
    if (window.__LOGGER__) {
      console.log('✅ Logger found, overriding methods');
      
      const originalLogger = window.__LOGGER__;
      
      // ✅ Force enable all logger methods
      window.__LOGGER__ = {
        ...originalLogger,
        
        // ✅ Always enable debug logs
        debug: (msg, data) => {
          if (data !== undefined) {
            console.log('🔍 DEBUG:', msg, data);
          } else {
            console.log('🔍 DEBUG:', msg);
          }
        },
        
        // ✅ Always enable API logs  
        api: (endpoint, msg, data) => {
          if (data !== undefined) {
            console.log(`🌐 API [${endpoint}]:`, msg, data);
          } else {
            console.log(`🌐 API [${endpoint}]:`, msg);
          }
        },
        
        // ✅ Always enable component logs
        component: (name, msg, data) => {
          if (data !== undefined) {
            console.log(`🧩 COMPONENT [${name}]:`, msg, data);
          } else {
            console.log(`🧩 COMPONENT [${name}]:`, msg);
          }
        },
        
        // ✅ Always enable hook logs
        hook: (name, msg, data) => {
          if (data !== undefined) {
            console.log(`🪝 HOOK [${name}]:`, msg, data);
          } else {
            console.log(`🪝 HOOK [${name}]:`, msg);
          }
        },
        
        // ✅ Always enable success logs
        success: (msg, data) => {
          if (data !== undefined) {
            console.log('✅ SUCCESS:', msg, data);
          } else {
            console.log('✅ SUCCESS:', msg);
          }
        },
        
        // ✅ Always enable error logs
        error: (msg, error) => {
          if (error !== undefined) {
            console.error('❌ ERROR:', msg, error);
          } else {
            console.error('❌ ERROR:', msg);
          }
        },
        
        // ✅ Always enable info logs
        info: (msg, data) => {
          if (data !== undefined) {
            console.log('ℹ️ INFO:', msg, data);
          } else {
            console.log('ℹ️ INFO:', msg);
          }
        },
        
        // ✅ Always enable warn logs
        warn: (msg, data) => {
          if (data !== undefined) {
            console.warn('⚠️ WARN:', msg, data);
          } else {
            console.warn('⚠️ WARN:', msg);
          }
        },
        
        // ✅ Enable order verification logs
        orderVerification: (msg, data) => {
          if (data !== undefined) {
            console.log('🎫 ORDER-VERIFY:', msg, data);
          } else {
            console.log('🎫 ORDER-VERIFY:', msg);
          }
        },
        
        // ✅ Keep original methods as backup
        test: originalLogger.test,
        getEnv: originalLogger.getEnv,
        context: originalLogger.context,
        perf: originalLogger.perf,
        criticalError: originalLogger.criticalError
      };
      
      console.log('🚀 All logger methods force-enabled!');
      
      // ✅ Test the overridden logger
      window.__LOGGER__.test();
      window.__LOGGER__.debug('Logger override test - debug');
      window.__LOGGER__.api('/test', 'Logger override test - api');
      window.__LOGGER__.success('Logger override test - success');
      
    } else {
      console.log('⚠️ Logger not found yet, retrying...');
      // Retry after a short delay
      setTimeout(enableLogger, 100);
    }
  };
  
  // ✅ Enable logger immediately or wait for it to load
  if (window.__LOGGER__) {
    enableLogger();
  } else {
    // Wait for logger to be available
    setTimeout(enableLogger, 50);
  }
  
  // ✅ Also add a global test function for manual testing
  window.testLogger = () => {
    console.log('🧪 Manual logger test');
    if (window.__LOGGER__) {
      window.__LOGGER__.debug('Manual test - debug works');
      window.__LOGGER__.api('/manual-test', 'Manual test - api works');
      window.__LOGGER__.success('Manual test - success works');
      window.__LOGGER__.error('Manual test - error works');
    } else {
      console.log('❌ Logger not available');
    }
  };
  
  console.log('💡 Use window.testLogger() to test logger manually');
}

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