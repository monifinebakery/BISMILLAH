// src/config/routes.tsx - Konfigurasi Rute Utama (modular)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import EmailAuthPage from '@/components/EmailAuthPage';
import { AuthGuard } from '@/components/AuthGuard';
import PaymentGuard from '@/components/PaymentGuard';
import { logger } from '@/utils/logger';

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
import menuRoutes from '@/routes/menu';
import paymentRoutes from '@/routes/payment';
import promoRoutes from '@/routes/promo';
import preloadingRoutes from '@/routes/preloading';
import networkOptimizationRoutes from '@/routes/network-optimization';
import notFoundRoutes from '@/routes/not-found';
import tutorialRoutes from '@/routes/tutorial';

// Development only - Calendar testing
import TestCalendarPage from '@/test-calendar-page';
import { OverheadDebug } from '@/components/debug/OverheadDebug';

// Membuat komponen AppRouter agar dapat diimpor sebagai named export
export const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/auth" element={<EmailAuthPage />} />
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
      {menuRoutes}
      {paymentRoutes}
      {promoRoutes}
      {preloadingRoutes}
      {networkOptimizationRoutes}
      {tutorialRoutes}

      {/* Development only - Testing pages */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <Route path="/test-calendar" element={<TestCalendarPage />} />
          <Route path="/debug-overhead" element={<OverheadDebug />} />
        </>
      )}
      
      {notFoundRoutes}
    </Route>
  </Routes>
);

export default AppRouter;
