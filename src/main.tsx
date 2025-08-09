// src/main.tsx - FIXED (Remove Duplicate Providers)
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import './index.css';
// ❌ REMOVED: Individual providers (already in AppProviders)
// import { AuthProvider } from './contexts/AuthContext';
// import { UserSettingsProvider } from './contexts/UserSettingsContext';
// import { PaymentProvider } from './contexts/PaymentContext';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import { logger } from '@/utils/logger';

// ✅ Performance tracking
const appStartTime = performance.now();

// ✅ Create QueryClient with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      cacheTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
  logger: {
    log: (message) => logger.debug(`React Query: ${message}`),
    warn: (message) => logger.warn(`React Query: ${message}`),
    error: (message) => logger.error(`React Query: ${message}`),
  },
});

// ✅ Make QueryClient globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
  logger.debug('QueryClient attached to window for debugging');
}

// ✅ Scheduler polyfill (if needed)
if (typeof globalThis !== 'undefined' && !globalThis.scheduler) {
  logger.info('Adding scheduler polyfill');
  globalThis.scheduler = {
    unstable_scheduleCallback: (priority: any, callback: any) => setTimeout(callback, 0),
    unstable_cancelCallback: (node: any) => node?.id && clearTimeout(node.id),
    unstable_shouldYield: () => false,
    unstable_requestPaint: () => {},
    unstable_now: () => performance.now?.() || Date.now()
  };
}

// ✅ Ensure root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  logger.criticalError('Root element with id "root" not found');
  throw new Error("Root element with id 'root' not found");
}

logger.info('Initializing React application', {
  environment: import.meta.env.MODE,
  isDev: import.meta.env.DEV
});

// ✅ Enhanced error boundary with logging
const EnhancedErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.criticalError('React Error Boundary caught error', {
          error: error.message,
          stack: error.stack,
          errorInfo
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// ✅ Create and render app
const root = createRoot(rootElement);

logger.debug('Starting React render process');

// ✅ FIXED: Only QueryClient and Router here, all other providers in AppProviders
root.render(
  <React.StrictMode>
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          {/* ✅ FIXED: App contains AppProviders with all context providers */}
          <App />
        </Router>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  </React.StrictMode>
);

// ✅ App initialization complete
const appInitTime = performance.now() - appStartTime;
logger.perf('App Initialization', appInitTime, {
  environment: import.meta.env.MODE,
  hasDevtools: import.meta.env.DEV
});

// ✅ Enhanced global debug functions
if (import.meta.env.DEV) {
  (window as any).appDebug = {
    logger: logger,
    queryClient: queryClient,
    testLogger: () => {
      logger.test();
      logger.info('Logger test completed');
    },
    performance: {
      initTime: appInitTime,
      getCurrentTime: () => performance.now(),
      getInitDuration: () => appInitTime
    },
    environment: {
      mode: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      nodeEnv: import.meta.env.NODE_ENV
    }
  };
  
  logger.success('Development debug tools loaded', {
    tools: ['logger', 'queryClient', 'performance', 'environment'],
    accessVia: 'window.appDebug'
  });
}

// ✅ Performance monitoring in development
if (import.meta.env.DEV && 'performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as any;
      if (perfData) {
        logger.perf('Page Load', perfData.loadEventEnd - perfData.fetchStart, {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
          firstPaint: perfData.loadEventEnd - perfData.fetchStart,
          type: 'page-load'
        });
      }
    }, 0);
  });
}

// ✅ Unhandled error logging
window.addEventListener('error', (event) => {
  logger.criticalError('Unhandled JavaScript error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.criticalError('Unhandled Promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

logger.success('React application initialized successfully', {
  initTime: appInitTime,
  timestamp: new Date().toISOString()
});