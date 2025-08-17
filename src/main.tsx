// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import { logger } from '@/utils/logger';

// Vite will inject these via `define` in vite.config.ts.
// Add TS decls so TypeScript doesn't complain.
declare const __DEV__: boolean;
declare const __PROD__: boolean;
declare const __CONSOLE_ENABLED__: boolean;

// ------------------------------
// App start timer
// ------------------------------
const appStartTime = performance.now();

// ------------------------------
// Scheduler polyfill (fallback)
// ------------------------------
if (typeof globalThis !== 'undefined' && !(globalThis as any).scheduler) {
  if (__CONSOLE_ENABLED__ && __DEV__) {
    logger.info('Adding scheduler polyfill');
  }
  (globalThis as any).scheduler = {
    unstable_scheduleCallback: (_priority: any, callback: any) => setTimeout(callback, 0),
    unstable_cancelCallback: (node: any) => node?.id && clearTimeout(node.id),
    unstable_shouldYield: () => false,
    unstable_requestPaint: () => {},
    unstable_now: () => (performance as any).now?.() || Date.now(),
  } as any;
}

// ------------------------------
// Root element check
// ------------------------------
const rootElement = document.getElementById('root');
if (!rootElement) {
  logger.criticalError("Root element with id 'root' not found");
  throw new Error("Root element with id 'root' not found");
}

// ------------------------------
// App init logs
// ------------------------------
logger.info('Initializing React application', {
  environment: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
});

// ------------------------------
// Error boundary wrapper
// ------------------------------
const EnhancedErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      logger.criticalError('React Error Boundary caught error', {
        error: (error as any)?.message,
        stack: (error as any)?.stack,
        errorInfo,
      });
    }}
  >
    {children}
  </ErrorBoundary>
);

// ------------------------------
// React render
// ------------------------------
const root = createRoot(rootElement);
logger.debug('Starting React render process');

root.render(
  <React.StrictMode>
    <EnhancedErrorBoundary>
      <Router>
        <App />
      </Router>
    </EnhancedErrorBoundary>
  </React.StrictMode>
);

// ------------------------------
// Init timing
// ------------------------------
const appInitTime = performance.now() - appStartTime;
logger.perf('App Initialization', appInitTime, {
  environment: import.meta.env.MODE,
  hasDevtools: import.meta.env.DEV,
});

// ------------------------------
// Dev-only debug tools
// ------------------------------
if (import.meta.env.DEV) {
  (window as any).appDebug = {
    logger,
    testLogger: () => {
      (logger as any).test?.();
      logger.info('Logger test completed');
    },
    performance: {
      initTime: appInitTime,
      getCurrentTime: () => performance.now(),
      getInitDuration: () => appInitTime,
    },
    environment: {
      mode: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      nodeEnv: import.meta.env.NODE_ENV,
    },
  };

  logger.success('Development debug tools loaded', {
    tools: ['logger', 'performance', 'environment'],
    accessVia: 'window.appDebug',
  });
}

// ------------------------------
// Perf monitoring (only in dev)
// ------------------------------
if (import.meta.env.DEV && 'performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0] as any;
      if (nav) {
        logger.perf('Page Load', nav.loadEventEnd - nav.fetchStart, {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
          firstPaint: nav.loadEventEnd - nav.fetchStart,
          type: 'page-load',
        });
      }
    }, 0);
  });
}

// ------------------------------
// Global error handling
// ------------------------------
window.addEventListener('error', (event) => {
  logger.criticalError('Unhandled JavaScript error', {
    message: (event as any)?.message,
    filename: (event as any)?.filename,
    lineno: (event as any)?.lineno,
    colno: (event as any)?.colno,
    error: (event as any)?.error,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.criticalError('Unhandled Promise rejection', {
    reason: (event as any)?.reason,
    // promise object is not enumerable—log minimal info
  });
});

// ------------------------------
// Final success log
// ------------------------------
logger.success('React application initialized successfully', {
  initTime: appInitTime,
  timestamp: new Date().toISOString(),
});
