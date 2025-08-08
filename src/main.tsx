// src/main.tsx - SIMPLIFIED VERSION WITH INLINE QUERY CLIENT
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { PaymentProvider } from './contexts/PaymentContext';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";

// ✅ Create QueryClient inline (no separate file needed)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 detik
      cacheTime: 1000 * 60 * 5, // 5 menit
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// ✅ Scheduler polyfill (if needed)
if (typeof globalThis !== 'undefined' && !globalThis.scheduler) {
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
  throw new Error("Root element with id 'root' not found");
}

// ✅ Create and render app
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <UserSettingsProvider>
              <PaymentProvider>
                <App />
              </PaymentProvider>
            </UserSettingsProvider>
          </AuthProvider>
        </Router>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// ✅ Optional: Add global debug functions
if (import.meta.env.DEV) {
  (window as any).testLogger = () => {
    console.log('🧪 Logger test available in dev mode');
  };
}