// src/main.tsx - Single React Query provider lives in App.tsx

// 🚀 FIRST: Disable console in production BEFORE any imports
import { disableConsoleInProduction } from '@/utils/productionConsoleOverride';
disableConsoleInProduction();

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import { logger } from '@/utils/logger';

// Performance tracking
const appStartTime = performance.now();

// Scheduler polyfill (if needed)
if (typeof globalThis !== 'undefined' && !(globalThis as any).scheduler) {
  logger.info('Adding scheduler polyfill');
  (globalThis as any).scheduler = {
    unstable_scheduleCallback: (_priority: any, callback: any) => setTimeout(callback, 0),
    unstable_cancelCallback: (node: any) => node?.id && clearTimeout(node.id),
    unstable_shouldYield: () => false,
    unstable_requestPaint: () => {},
    unstable_now: () => (performance as any).now?.() || Date.now()
  } as any;
}

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  logger.criticalError("Root element with id 'root' not found");
  throw new Error("Root element with id 'root' not found");
}

logger.info('Initializing React application', {
  environment: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
});

// Enhanced error boundary with logging
const EnhancedErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      logger.criticalError('React Error Boundary caught error', {
        error: (error as any).message,
        stack: (error as any).stack,
        errorInfo,
      });
    }}
  >
    {children}
  </ErrorBoundary>
);

// Create and render app
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

// App initialization complete
const appInitTime = performance.now() - appStartTime;
logger.perf('App Initialization', appInitTime, {
  environment: import.meta.env.MODE,
  hasDevtools: import.meta.env.DEV,
});

// Enhanced global debug functions
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

// Performance monitoring in development
if (import.meta.env.DEV && 'performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = (performance.getEntriesByType('navigation')[0] as any);
      if (perfData) {
        logger.perf('Page Load', perfData.loadEventEnd - perfData.fetchStart, {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
          firstPaint: perfData.loadEventEnd - perfData.fetchStart,
          type: 'page-load',
        });
      }
    }, 0);
  });
}

// Unhandled error logging
window.addEventListener('error', (event) => {
  logger.criticalError('Unhandled JavaScript error', {
    message: (event as any).message,
    filename: (event as any).filename,
    lineno: (event as any).lineno,
    colno: (event as any).colno,
    error: (event as any).error,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.criticalError('Unhandled Promise rejection', {
    reason: (event as any).reason,
    promise: (event as any).promise,
  });
});

logger.success('React application initialized successfully', {
  initTime: appInitTime,
  timestamp: new Date().toISOString(),
});

// 🔧 Production Console Debug Helper
if (typeof window !== 'undefined') {
  (window as any).__CONSOLE_STATUS__ = () => {
    const isDisabled = (window as any).__CONSOLE_DISABLED__;
    const hostname = window.location.hostname;
    const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';
    const originalConsole = (window as any).__ORIGINAL_CONSOLE__;
    
    // Use original console even if disabled
    const logFunc = originalConsole ? originalConsole.log : console.log;
    
    logFunc('📊 Console Status:', {
      disabled: isDisabled,
      hostname,
      isProduction: isProd,
      canRestore: !!originalConsole
    });
    
    if (isDisabled) {
      logFunc('🔧 To restore console temporarily: window.__RESTORE_CONSOLE__()');
      logFunc('🔧 To check this status again: window.__CONSOLE_STATUS__()');
    } else {
      logFunc('✅ Console is currently active');
    }
  };
}
