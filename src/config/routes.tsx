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
import notFoundRoutes from '@/routes/not-found';

// Membuat komponen AppRouter agar dapat diimpor sebagai named export
export const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/auth" element={<EmailAuthPage />} />
    <Route
      element={
        <ErrorBoundary
          fallback={(error, errorInfo) => {
            logger.error('Root Route Error:', error, errorInfo);
            return (
              <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl border border-red-200">
                  <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                      <span className="text-red-600 text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                      Oops! Terjadi Kesalahan
                    </h1>
                    <p className="text-gray-600 mb-6">
                      Dashboard mengalami masalah. Jangan khawatir, data Anda aman.
                    </p>
                    {import.meta.env.DEV && error && (
                      <details className="text-left bg-gray-100 p-4 rounded mb-4 max-w-full overflow-auto">
                        <summary className="cursor-pointer font-medium text-red-600 mb-2">
                          Error Details (Development Only)
                        </summary>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {error.toString()}
                        </pre>
                        {errorInfo?.componentStack && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Component Stack:</p>
                            <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </details>
                    )}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          logger.debug('User clicked reload button');
                          window.location.reload();
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        🔄 Muat Ulang Halaman
                      </button>
                      <button
                        onClick={() => {
                          logger.debug('User clicked back to login button');
                          window.location.href = '/auth';
                        }}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors"
                      >
                        🔙 Kembali ke Login
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Jika masalah berlanjut, silakan hubungi support atau coba lagi nanti.
                    </p>
                  </div>
                </div>
              </div>
            );
          }}
        >
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
      {notFoundRoutes}
    </Route>
  </Routes>
);

export default AppRouter;
