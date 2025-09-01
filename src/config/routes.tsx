// src/config/routes.tsx - Konfigurasi Rute Utama (modular)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import EmailAuthPage from '@/components/EmailAuthPage';
import AuthGuard from '@/components/AuthGuard';
import PaymentGuard from '@/components/PaymentGuard';
import { logger } from '@/utils/logger';

import dashboardRoutes from '@/routes/dashboard';
import recipeRoutes from '@/routes/recipes';
import warehouseRoutes from '@/routes/warehouse';
import supplierRoutes from '@/routes/supplier';
import purchaseRoutes from '@/routes/purchase';
import ordersRoutes from '@/routes/orders';
import operationalCostRoutes from '@/routes/operational-costs';
import invoiceRoutes from '@/routes/invoice';
import financialRoutes from '@/routes/financial';
import profitAnalysisRoutes from '@/routes/profit-analysis';
import assetRoutes from '@/routes/assets';
import updateRoutes from '@/routes/updates';
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
      {purchaseRoutes}
      {ordersRoutes}
      {operationalCostRoutes}
      {invoiceRoutes}
      {financialRoutes}
      {profitAnalysisRoutes}
      {assetRoutes}
      {updateRoutes}
      {settingsRoutes}
      {deviceRoutes}
      {menuRoutes}
      {paymentRoutes}
      {promoRoutes}
      {preloadingRoutes}
      {networkOptimizationRoutes}
      {tutorialRoutes}
      
      {/* Development only - Calendar responsiveness test */}
      {process.env.NODE_ENV === 'development' && (
        <Route path="/test-calendar" element={<TestCalendarPage />} />
      )}
      
      {notFoundRoutes}
    </Route>
  </Routes>
);

export default AppRouter;
