// src/config/routes.tsx - Konfigurasi Rute Utama (modular)
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import EmailAuthPage from '@/components/EmailAuthPage';
import { AuthGuard } from '@/components/AuthGuard';
import PaymentGuard from '@/components/PaymentGuard';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import dashboardRoutes from '@/routes/dashboard';
import recipeRoutes from '@/routes/recipes';
import warehouseRoutes from '@/routes/warehouse';
import supplierRoutes from '@/routes/supplier';
import LazyPurchasePage from '@/pages/Purchase';
import ordersRoutes from '@/routes/orders';
import operationalCostRoutes from '@/routes/operational-costs';
import invoiceRoutes from '@/routes/invoice';
import financialRoutes from '@/routes/financial';
import profitAnalysisRoutes from '@/routes/profit-analysis';
import assetRoutes from '@/routes/assets';
import purchaseRoutes from '@/routes/purchase';

import settingsRoutes from '@/routes/settings';
import deviceRoutes from '@/routes/devices';
import paymentRoutes from '@/routes/payment';
import promoRoutes from '@/routes/promo';
import preloadingRoutes from '@/routes/preloading';
import networkOptimizationRoutes from '@/routes/network-optimization';
import notFoundRoutes from '@/routes/not-found';
import tutorialRoutes from '@/routes/tutorial';
import menuRoutes from '@/routes/menu';

// Development only - Calendar testing
import TestCalendarPage from '@/test-calendar-page';
import { OverheadDebug } from '@/components/debug/OverheadDebug';

// Simple auth debug component
const AuthDebugPage: React.FC = () => {
  const { user, session, isLoading, isReady } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Auth Debug</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Auth Context State</h2>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
              {JSON.stringify({ user: user?.email, session: !!session, isLoading, isReady }, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Actions</h2>
            <div className="flex flex-col gap-2 mt-2">
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                onClick={async () => {
                  await supabase.auth.signOut();
                  console.log('Sign out triggered');
                }}
              >
                Sign Out
              </button>
              <button 
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                onClick={() => {
                  navigate('/auth');
                }}
              >
                Go to Login
              </button>
              <button 
                className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AuthRoute wrapper dengan navigation callback
const AuthRoute: React.FC = () => {
  const navigate = useNavigate();
  
  const handleLoginSuccess = () => {
    logger.info('Login successful, redirecting to dashboard...');
    navigate('/', { replace: true });
  };
  
  return <EmailAuthPage onLoginSuccess={handleLoginSuccess} />;
};

// Membuat komponen AppRouter agar dapat diimpor sebagai named export
export const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute />} />
    <Route
      element={
        <ErrorBoundary>
          <AuthGuard>
            <PaymentGuard>
              <AppLayout />
            </PaymentGuard>
          </AuthGuard>
        </ErrorBoundary>
      }
    >
      {dashboardRoutes}
      {recipeRoutes}
      {warehouseRoutes}
      {supplierRoutes}
      {/* Back-compat and new purchase routes */}
      <Route path="/pembelian" element={<LazyPurchasePage />} />
      {/* Mount nested purchase routes including /purchase/add */}
      {purchaseRoutes}
      {/* Mount orders routes including /pesanan, /pesanan/add, /pesanan/edit/:id */}
      {ordersRoutes}
      {operationalCostRoutes}
      {invoiceRoutes}
      {financialRoutes}
      {profitAnalysisRoutes}
      {assetRoutes}

      {settingsRoutes}
      {deviceRoutes}
      {paymentRoutes}
      {promoRoutes}
      {preloadingRoutes}
      {networkOptimizationRoutes}
      {tutorialRoutes}
      {menuRoutes}

      {/* Development only - Testing pages */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <Route path="/test-calendar" element={<TestCalendarPage />} />
          <Route path="/debug-overhead" element={<OverheadDebug />} />
          <Route path="/auth-debug" element={<AuthDebugPage />} />
        </>
      )}
      
      {notFoundRoutes}
    </Route>
  </Routes>
);

export default AppRouter;
