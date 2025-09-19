// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

import App from "./App";
import "./index.css";
import "@/styles/toast-swipe.css";
import "@/styles/mobile-input-fixes.css";
import "@/styles/safari-optimizations.css";
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import { logger } from "@/utils/logger";
import { pwaManager } from '@/utils/pwaUtils'
import { initToastSwipeHandlers } from '@/utils/toastSwipeHandler'
import { safePerformance } from '@/utils/browserApiSafeWrappers';
import { initializeNetworkErrorHandler } from '@/utils/networkErrorHandler';
import { detectSafariIOS, initSafariUtils, shouldBypassServiceWorker, getSafariDelay, logSafariInfo } from '@/utils/safariUtils';
// import '@/utils/preload-optimizer'; // Temporarily disabled to prevent unused preload warnings

// Vite inject via define() (lihat vite.config.ts)
declare const __DEV__: boolean;
declare const __PROD__: boolean;
declare const __CONSOLE_ENABLED__: boolean;

// ------------------------------
// Env detection (Vercel-aware)
// ------------------------------
const VERCEL_ENV = import.meta.env.VITE_VERCEL_ENV as
  | "production"
  | "preview"
  | "development"
  | undefined;

// efektif dianggap "dev tools ON" untuk: vite dev (lokal) atau preview vercel
const effectiveDev = import.meta.env.DEV || VERCEL_ENV === "preview";

// ------------------------------
// App start timer
// ------------------------------
const appStartTime = safePerformance.now();

// ------------------------------
// Emergency reload-loop detector (works in production too)
// If more than 3 loads in 4s, assume SW loop and disable SW via flag
// ------------------------------
try {
  const RL_KEY = 'rlc_v1';
  const now = Date.now();
  const raw = sessionStorage.getItem(RL_KEY);
  const state = raw ? JSON.parse(raw) as { count: number; start: number } : { count: 0, start: now };
  const withinWindow = now - state.start < 4000;
  const nextState = withinWindow ? { count: state.count + 1, start: state.start } : { count: 1, start: now };
  sessionStorage.setItem(RL_KEY, JSON.stringify(nextState));

  if (nextState.count >= 3) {
    // Set DISABLE_SW and add ?nosw to URL to guarantee SW bypass
    try { localStorage.setItem('DISABLE_SW', '1'); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set('nosw', '1');
    // Reset counter to avoid further loops
    sessionStorage.setItem(RL_KEY, JSON.stringify({ count: 0, start: now }));

    // Best-effort cleanup before reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister()))).catch(() => {});
    }
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
    }

    // Redirect once with nosw
    setTimeout(() => {
      window.location.replace(url.toString());
    }, 50);
  }
} catch {
  // ignore
}

// ------------------------------
// Initialize network error handler
// ------------------------------
initializeNetworkErrorHandler();

// ------------------------------
// Scheduler polyfill (fallback)
// ------------------------------
interface SchedulerTask {
  id: NodeJS.Timeout;
}

interface Scheduler {
  unstable_scheduleCallback: (priority: any, callback: () => void) => SchedulerTask;
  unstable_cancelCallback: (task: SchedulerTask) => void;
  unstable_shouldYield: () => boolean;
  unstable_requestPaint: () => void;
  unstable_now: () => number;
}

if (typeof globalThis !== "undefined" && !(globalThis as any).scheduler) {
  if (__CONSOLE_ENABLED__ && effectiveDev) logger.info("Adding scheduler polyfill");
  const schedulerPolyfill: Scheduler = {
    unstable_scheduleCallback: (_p: any, cb: () => void) => {
      const id = setTimeout(cb, 0);
      return { id };
    },
    unstable_cancelCallback: (n: SchedulerTask) => n && clearTimeout(n.id),
    unstable_shouldYield: () => false,
    unstable_requestPaint: () => {},
    unstable_now: () => safePerformance.now(),
  };
  (globalThis as any).scheduler = schedulerPolyfill;
}

// ------------------------------
// Root element check
// ------------------------------
const rootElement = document.getElementById("root");
if (!rootElement) {
  logger.criticalError("Root element with id 'root' not found");
  throw new Error("Root element with id 'root' not found");
}

// ------------------------------
// App init logs
// ------------------------------
logger.info("Initializing React application", {
  viteMode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  vercelEnv: VERCEL_ENV,
  effectiveDev,
  hostname: window.location.hostname,
});

// ------------------------------
// Error boundary wrapper
// ------------------------------
const EnhancedErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
);

// ------------------------------
// React render
// ------------------------------
const root = createRoot(rootElement);
logger.debug("Starting React render process");

root.render(
  <EnhancedErrorBoundary>
    <Router>
      <App />
    </Router>
  </EnhancedErrorBoundary>
);

// ------------------------------
// Init timing
// ------------------------------
const appInitTime = safePerformance.now() - appStartTime;
logger.perf("App Initialization", appInitTime, {
  viteMode: import.meta.env.MODE,
  vercelEnv: VERCEL_ENV,
  effectiveDev,
});

// ------------------------------
// Dev-only debug tools (DEV local & Preview)
// ------------------------------
if (effectiveDev) {
  // Debug tools temporarily disabled due to build issues
  console.log("Debug tools available in development mode");
  
  // Import sample operational costs utility for testing
  import('@/utils/addSampleOperationalCosts').then(() => {
    logger.info('🔧 Sample operational costs utility loaded');
  }).catch((err) => {
    logger.warn('Failed to load operational costs utility:', err);
  });

  window.appDebug = {
    logger,
    testLogger: () => {
      logger.test();
      logger.info("Logger test completed");
    },
    performance: {
      initTime: appInitTime,
      getCurrentTime: () => safePerformance.now(),
      getInitDuration: () => appInitTime,
    },
    environment: {
      mode: import.meta.env.MODE,
      vercelEnv: VERCEL_ENV,
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      effectiveDev,
    },
  };

  logger.success("Development debug tools loaded", {
    tools: ["logger", "performance", "environment"],
    accessVia: "window.appDebug",
    hostname: window.location.hostname,
  });
}

// ------------------------------
// Perf monitoring (only in dev/preview)
// ------------------------------
if (effectiveDev && "performance" in window) {
  window.addEventListener("load", () => {
      setTimeout(() => {
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (nav) {
          logger.perf("Page Load", nav.loadEventEnd - nav.fetchStart, {
            domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
            type: "page-load",
          });
        }
      }, 0);
    });

    if (window.performance.memory) {
      setInterval(() => {
        const m = window.performance.memory;
        if (m) {
          logger.debug("Memory Usage", {
            used: Math.round(m.usedJSHeapSize / 1048576) + " MB",
            total: Math.round(m.totalJSHeapSize / 1048576) + " MB",
            limit: Math.round(m.jsHeapSizeLimit / 1048576) + " MB",
          });
        }
      }, 30000);
    }
  }

// Global error handlers now handled by networkErrorHandler

// ------------------------------
// PWA initialization - add DEV and emergency bypass to stop SW loops
// ------------------------------
const safariDetection = detectSafariIOS();

// Initialize Safari utilities
initSafariUtils();

// Determine if SW should be disabled (dev, query flag, or local flag)
const shouldDisableSW = (() => {
  try {
    const qs = new URLSearchParams(window.location.search);
    const byQuery = qs.has('nosw') || qs.has('disable_sw');
    const byLocal = localStorage.getItem('DISABLE_SW') === '1';
    return import.meta.env.DEV || byQuery || byLocal;
  } catch {
    return import.meta.env.DEV;
  }
})();

if (shouldDisableSW) {
  logger.warn('PWA: Service worker disabled for this session', {
    reason: import.meta.env.DEV ? 'dev-mode' : 'flag',
  });

  // Best-effort cleanup so stale SW does not control next loads
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
  }
  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {});
  }
} else {
  if (safariDetection.isSafariIOS) {
     logger.warn('PWA: Safari iOS detected - applying service worker workarounds', {
       version: safariDetection.version,
       userAgent: safariDetection.userAgent,
       timestamp: new Date().toISOString()
     });
     
     // Add Safari iOS class untuk CSS optimizations
     document.documentElement.classList.add('safari-ios');
     document.body.classList.add('safari-ios');
     
     // Log detailed Safari info for debugging
     logSafariInfo();
     
     if (shouldBypassServiceWorker()) {
       logger.warn('PWA: Bypassing service worker registration due to Safari iOS compatibility issues', {
         safariInfo: safariDetection,
         timestamp: new Date().toISOString()
       });
     } else {
      // Delay service worker registration for Safari iOS to prevent loading issues
      setTimeout(() => {
        pwaManager.registerServiceWorker().then((registration) => {
          if (registration) {
            logger.info('PWA: Service worker registered successfully (Safari iOS delayed)', {
              scope: registration.scope,
              mode: import.meta.env.MODE,
              cacheVersion: 'v4-safe'
            });
            
            // Skip automatic updates for Safari iOS to prevent conflicts
            logger.info('PWA: Skipping automatic update check for Safari iOS');
          }
        }).catch((error) => {
             logger.warn('PWA: Service worker registration failed on Safari iOS (non-critical):', {
               error,
               errorMessage: error instanceof Error ? error.message : 'Unknown error',
               safariInfo: safariDetection,
               timestamp: new Date().toISOString()
             });
             // Don't throw error for Safari iOS - app should work without SW
           });
      }, getSafariDelay(5000)); // Increased delay for Safari iOS
    }
  } else {
    // Normal registration for other browsers
    pwaManager.registerServiceWorker().then((registration) => {
      if (registration) {
        logger.info('PWA: Service worker registered successfully', {
          scope: registration.scope,
          mode: import.meta.env.MODE,
          cacheVersion: 'v4-safe'
        });
        
        // Check for updates every page load
        registration.update();
      }
    }).catch((error) => {
      logger.error('PWA: Service worker registration failed:', error);
    });
  }

  console.log('✅ [PWA] Service worker enabled with safe caching strategy');
}

// ------------------------------
// Initialize toast swipe handlers
// ------------------------------
setTimeout(() => {
  initToastSwipeHandlers();
  logger.info('🎯 Toast swipe handlers initialized');
}, 100);

logger.success("React application initialized successfully", {
  initTime: appInitTime,
  timestamp: new Date().toISOString(),
  vercelEnv: VERCEL_ENV,
  effectiveDev,
  hostname: window.location.hostname,
});
