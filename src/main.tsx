// src/main.tsx - Optimized to prevent setTimeout violations

// 🚀 FIRST: Silence console in production IMMEDIATELY on import
import '@/utils/immediateConsoleSilencer';
import { disableConsoleInProduction } from '@/utils/productionConsoleOverride';
disableConsoleInProduction();

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import { logger } from '@/utils/logger';
import { performanceMonitor } from '@/utils/performanceMonitor';

// Performance tracking
const appStartTime = performance.now();

// ✅ CONDITIONAL: Only enable performance monitoring in DEV and disable in production
if (import.meta.env.DEV) {
  performanceMonitor.enable();
  logger.info('Performance monitoring enabled for setTimeout violations');
} else {
  // ✅ PRODUCTION: Ensure performance monitor is disabled to prevent overhead
  performanceMonitor.disable();
  logger.info('Performance monitoring disabled in production');
}

// ✅ LIGHTWEIGHT: Scheduler polyfill with non-blocking implementation
if (typeof globalThis !== 'undefined' && !(globalThis as any).scheduler) {
  logger.info('Adding scheduler polyfill');
  (globalThis as any).scheduler = {
    // ✅ Use MessageChannel for non-blocking scheduling instead of setTimeout
    unstable_scheduleCallback: (_priority: any, callback: any) => {
      if ('MessageChannel' in window) {
        const channel = new MessageChannel();
        channel.port2.onmessage = () => {
          try {
            callback();
          } catch (error) {
            logger.error('Scheduler callback error:', error);
          }
        };
        // Non-blocking post
        requestAnimationFrame(() => channel.port1.postMessage(null));
        return { id: Date.now() }; // Return fake node for cancellation
      } else {
        // Fallback to setTimeout with error handling
        const id = setTimeout(() => {
          try {
            callback();
          } catch (error) {
            logger.error('Scheduler callback error:', error);
          }
        }, 0);
        return { id };
      }
    },
    unstable_cancelCallback: (node: any) => {
      if (node?.id && typeof node.id === 'number') {
        clearTimeout(node.id);
      }
    },
    unstable_shouldYield: () => {
      // ✅ Use performance.now() with threshold to prevent blocking
      if ('performance' in window && performance.now) {
        const now = performance.now();
        return (now % 5) < 0.1; // Yield every ~5ms window
      }
      return false;
    },
    unstable_requestPaint: () => {
      // ✅ Use RAF instead of blocking operation
      if ('requestAnimationFrame' in window) {
        requestAnimationFrame(() => {});
      }
    },
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

// ✅ CONDITIONAL: Only load debug tools in development
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
      monitor: performanceMonitor,
      getTimeoutViolations: () => performanceMonitor.getViolations(),
      getPerformanceReport: () => performanceMonitor.getReport(),
      clearMetrics: () => performanceMonitor.clearMetrics(),
      // ✅ NEW: Manual toggle for performance monitoring
      enableMonitoring: () => {
        performanceMonitor.enable();
        logger.info('Performance monitoring enabled manually');
      },
      disableMonitoring: () => {
        performanceMonitor.disable();
        logger.info('Performance monitoring disabled manually');
      },
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

// ✅ OPTIMIZED: Non-blocking performance monitoring
if (import.meta.env.DEV && 'performance' in window) {
  window.addEventListener('load', () => {
    // ✅ Use requestIdleCallback to prevent blocking main thread
    const measurePerformance = () => {
      try {
        const perfData = (performance.getEntriesByType('navigation')[0] as any);
        if (perfData) {
          logger.perf('Page Load', perfData.loadEventEnd - perfData.fetchStart, {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            firstPaint: perfData.loadEventEnd - perfData.fetchStart,
            type: 'page-load',
          });
        }
      } catch (error) {
        logger.warn('Performance measurement failed:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(measurePerformance, { timeout: 5000 });
    } else {
      // ✅ Fallback: Use RAF instead of setTimeout to prevent violations
      requestAnimationFrame(() => {
        requestAnimationFrame(measurePerformance);
      });
    }
  });
}

// ✅ PRODUCTION OPTIMIZATION: Disable error logging in production to reduce overhead
const shouldLogErrors = import.meta.env.DEV || localStorage.getItem('enableErrorLogging') === 'true';

if (shouldLogErrors) {
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
} else {
  // ✅ PRODUCTION: Minimal error tracking
  window.addEventListener('error', (event) => {
    // Just track critical errors without heavy logging
    console.error('App Error:', (event as any).message);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise Rejection:', (event as any).reason);
  });
}

logger.success('React application initialized successfully', {
  initTime: appInitTime,
  timestamp: new Date().toISOString(),
});

// ✅ ENHANCED: Console debug helper with performance checks
if (typeof window !== 'undefined') {
  (window as any).__CONSOLE_STATUS__ = () => {
    const isDisabled = (window as any).__CONSOLE_DISABLED__;
    const hostname = window.location.hostname;
    const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';
    const originalConsole = (window as any).__ORIGINAL_CONSOLE__;
    
    const logFunc = originalConsole ? originalConsole.log : console.log;
    
    logFunc('📊 Console Status:', {
      disabled: isDisabled,
      hostname,
      isProduction: isProd,
      canRestore: !!originalConsole,
      performanceMonitoringEnabled: import.meta.env.DEV
    });
    
    if (isDisabled) {
      logFunc('🔧 To restore console temporarily: window.__RESTORE_CONSOLE__()');
      logFunc('🔧 To check this status again: window.__CONSOLE_STATUS__()');
    } else {
      logFunc('✅ Console is currently active');
    }

    // ✅ NEW: Show setTimeout violation status if in dev mode
    if (import.meta.env.DEV && performanceMonitor) {
      const report = performanceMonitor.getReport();
      logFunc('⏱️ Performance Status:', {
        violations: report.summary.totalViolations,
        recentViolations: report.summary.recentViolations,
        timeoutViolations: report.summary.timeoutViolations
      });
      
      if (report.summary.totalViolations > 0) {
        logFunc('🔧 To clear metrics: window.appDebug.performance.clearMetrics()');
        logFunc('🔧 To disable monitoring: window.appDebug.performance.disableMonitoring()');
      }
    }
  };

  // ✅ NEW: Quick performance check function
  (window as any).__PERF_CHECK__ = () => {
    if (import.meta.env.DEV && performanceMonitor) {
      const report = performanceMonitor.getReport();
      const logFunc = (window as any).__ORIGINAL_CONSOLE__?.log || console.log;
      
      logFunc('🚀 Performance Summary:', {
        appInitTime: appInitTime.toFixed(2) + 'ms',
        totalViolations: report.summary.totalViolations,
        recentViolations: report.summary.recentViolations,
        slowestOperations: report.slowestOperations.slice(0, 3).map(op => ({
          name: op.name,
          duration: op.duration.toFixed(2) + 'ms'
        }))
      });
      
      if (report.recentViolations.length > 0) {
        logFunc('⚠️ Recent Violations:', report.recentViolations.map(v => ({
          callback: v.callback,
          duration: v.duration.toFixed(2) + 'ms',
          ago: Math.round((Date.now() - v.timestamp.getTime()) / 1000) + 's ago'
        })));
      } else {
        logFunc('✅ No recent violations detected');
      }
    } else {
      const logFunc = (window as any).__ORIGINAL_CONSOLE__?.log || console.log;
      logFunc('ℹ️ Performance monitoring not available in production mode');
    }
  };
}

// ✅ PRODUCTION: Clean up unused references to prevent memory leaks
if (import.meta.env.PROD) {
  // Clear references that are only needed during development
  setTimeout(() => {
    // Don't expose debug tools in production
    delete (window as any).appDebug;
  }, 1000);
}