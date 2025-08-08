import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// ✅ SCHEDULER POLYFILL - Fix unstable_scheduleCallback error
// Must be after imports but before React rendering
if (typeof window !== 'undefined') {
  // Fix React scheduler conflicts
  if (!(window as any).scheduler) {
    (window as any).scheduler = {};
  }
  
  if (!(window as any).scheduler.unstable_scheduleCallback) {
    (window as any).scheduler.unstable_scheduleCallback = function(
      priority: any, 
      callback: () => void,
      options?: any
    ) {
      return setTimeout(callback, 0);
    };
  }
  
  if (!(window as any).scheduler.unstable_cancelCallback) {
    (window as any).scheduler.unstable_cancelCallback = function(id: any) {
      clearTimeout(id);
    };
  }

  if (!(window as any).scheduler.unstable_shouldYield) {
    (window as any).scheduler.unstable_shouldYield = function() {
      return false;
    };
  }

  if (!(window as any).scheduler.unstable_requestPaint) {
    (window as any).scheduler.unstable_requestPaint = function() {};
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);