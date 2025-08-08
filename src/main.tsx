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

// ✅ Debug info for development
if (import.meta.env.DEV) {
  console.log('🔍 React version:', React.version);
  console.log('🔍 Scheduler available:', !!globalThis.scheduler?.unstable_scheduleCallback);
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