// src/config/routes.tsx - Konfigurasi Rute Utama (modular)
import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import EmailAuthPage from "@/components/EmailAuthPage";
import { AuthGuard } from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";
import { logger } from "@/utils/logger";

import dashboardRoutes from "@/routes/dashboard";
import recipeRoutes from "@/routes/recipes";
import warehouseRoutes from "@/routes/warehouse";
import supplierRoutes from "@/routes/supplier";
import LazyPurchasePage from "@/pages/Purchase";
import ordersRoutes from "@/routes/orders";
import operationalCostRoutes from "@/routes/operational-costs";
import invoiceRoutes from "@/routes/invoice";
import financialRoutes from "@/routes/financial";
import profitAnalysisRoutes from "@/routes/profit-analysis";
import assetRoutes from "@/routes/assets";
import purchaseRoutes from "@/routes/purchase";

import settingsRoutes from "@/routes/settings";
import deviceRoutes from "@/routes/devices";
import paymentRoutes from "@/routes/payment";
import promoRoutes from "@/routes/promo";
import preloadingRoutes from "@/routes/preloading";
import networkOptimizationRoutes from "@/routes/network-optimization";
import notFoundRoutes from "@/routes/not-found";
import tutorialRoutes from "@/routes/tutorial";
import menuRoutes from "@/routes/menu";

// Development only - Calendar testing
import TestCalendarPage from "@/test-calendar-page";
import { OverheadDebug } from "@/components/debug/OverheadDebug";

import { useAuth } from "@/contexts/AuthContext";

// ... (imports)

// Membuat komponen AppRouter agar dapat diimpor sebagai named export
export const AppRouter: React.FC = () => {
  const { isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Memuat Aplikasi
          </h2>
          <p className="text-gray-500 text-sm">Menyiapkan rute...</p>
        </div>
      </div>
    );
  }

  return (
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
        {paymentRoutes}
        {promoRoutes}
        {preloadingRoutes}
        {networkOptimizationRoutes}
        {tutorialRoutes}
        {menuRoutes}

        {/* Development only - Testing pages */}
        {process.env.NODE_ENV === "development" && (
          <>
            <Route path="/test-calendar" element={<TestCalendarPage />} />
            <Route path="/debug-overhead" element={<OverheadDebug />} />
          </>
        )}

        {notFoundRoutes}
      </Route>
    </Routes>
  );
};

export default AppRouter;
