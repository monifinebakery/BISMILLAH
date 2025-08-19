// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import { logger } from "@/utils/logger";

// Vite inject via define() (lihat vite.config.ts)
declare const __DEV__: boolean;
declare const __PROD__: boolean;
declare const __CONSOLE_ENABLED__: boolean;

// ------------------------------
// Helper: detect dev domain
// ------------------------------
const isDevDomain = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host.startsWith("127.") ||
    host.endsWith(".local") ||
    (host.startsWith("dev3--gleaming-peony") && host.endsWith("netlify.app"))
  );
};

// ------------------------------
// Effective dev mode override
// ------------------------------
const effectiveDev = import.meta.env.DEV || isDevDomain();

// ------------------------------
// App start timer
// ------------------------------
const appStartTime = performance.now();

// ------------------------------
// Scheduler polyfill (fallback)
// ------------------------------
if (typeof globalThis !== "undefined" && !(globalThis as any).scheduler) {
  if (__CONSOLE_ENABLED__ && effectiveDev) {
    logger.info("Adding scheduler polyfill");
  }
  (globalThis as any).scheduler = {
    unstable_scheduleCallback: (_priority: any, callback: any) =>
      setTimeout(callback, 0),
    unstable_cancelCallback: (node: any) =>
      node?.id && clearTimeout(node.id),
    unstable_shouldYield: () => false,
    unstable_requestPaint: () => {},
    unstable_now: () => (performance as any).now?.() || Date.now(),
  } as any;
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
  effectiveDev,
  hostname: window.location.hostname,
});

// ------------------------------
// Error boundary wrapper
// ------------------------------
const EnhancedErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      logger.criticalError("React Error Boundary caught error", {
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
logger.debug("Starting React render process");

root.render(
  <React.StrictMode>
    <EnhancedErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light">
        <Router>
          <App />
        </Router>
      </ThemeProvider>
    </EnhancedErrorBoundary>
  </React.StrictMode>
);

// ------------------------------
// Init timing
// ------------------------------
const appInitTime = performance.now() - appStartTime;
logger.perf("App Initialization", appInitTime, {
  viteMode: import.meta.env.MODE,
  effectiveDev,
  hasDevtools: effectiveDev,
});

// ------------------------------
// Dev-only debug tools
// ------------------------------
if (effectiveDev) {
  (window as any).appDebug = {
    logger,
    testLogger: () => {
      (logger as any).test?.();
      logger.info("Logger test completed");
    },
    performance: {
      initTime: appInitTime,
      getCurrentTime: () => performance.now(),
      getInitDuration: () => appInitTime,
    },
    environment: {
      mode: import.meta.env.MODE,
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
// Perf monitoring (only in dev)
// ------------------------------
if (effectiveDev && "performance" in window) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType("navigation")[0] as any;
      if (nav) {
        logger.perf("Page Load", nav.loadEventEnd - nav.fetchStart, {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
          type: "page-load",
        });
      }
    }, 0);
  });
}

// ------------------------------
// Global error handling
// ------------------------------
window.addEventListener("error", (event) => {
  logger.criticalError("Unhandled JavaScript error", {
    message: (event as any)?.message,
    filename: (event as any)?.filename,
    lineno: (event as any)?.lineno,
    colno: (event as any)?.colno,
    error: (event as any)?.error,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  logger.criticalError("Unhandled Promise rejection", {
    reason: (event as any)?.reason,
  });
});

// ------------------------------
// Final success log
// ------------------------------
logger.success("React application initialized successfully", {
  initTime: appInitTime,
  timestamp: new Date().toISOString(),
  effectiveDev,
  hostname: window.location.hostname,
});
