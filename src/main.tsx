// src/main.tsx - CLEAN VERSION
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

// ✅ Import context providers
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { PaymentProvider } from './contexts/PaymentContext';

// ✅ Simple scheduler polyfill (if needed)
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
    <Router>
      <AuthProvider>
        <UserSettingsProvider>
          <PaymentProvider>
            <App />
          </PaymentProvider>
        </UserSettingsProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);

// ✅ Optional: Add global debug functions (but keep them simple)
if (import.meta.env.DEV) {
  (window as any).testLogger = () => {
    console.log('🧪 Logger test available in dev mode');
  };
}