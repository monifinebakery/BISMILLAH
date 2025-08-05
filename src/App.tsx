// src/App.tsx
import React, { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Opsional untuk debugging
import { TooltipProvider } from '@/components/ui/tooltip';
import { Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { Toaster } from 'sonner';
import { logger } from '@/utils/logger';

// UI & Layout Components
import { AppLayout } from "@/components/layout/AppLayout";
import AppLoader from "@/components/layout/AppLoader";
import AppError from "@/components/layout/AppError";
import NotFound from "@/components/layout/NotFound";
import BottomTabBar from "@/components/layout/BottomTabBar";

// ✅ CONSOLIDATED: Context imports grouped
import { AppProviders } from "@/contexts/AppProviders";
import { usePaymentContext } from "./contexts/PaymentContext";

// ✅ CONSOLIDATED: Core layout components grouped
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import EmailAuthPage from "@/components/EmailAuthPage";
import { AppSidebar } from "@/components/AppSidebar";
import AuthGuard from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";

// ✅ CONSOLIDATED: UI components grouped
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";

// ✅ CUSTOM HOOKS GROUPED
import { useNotification } from '@/hooks/useNotification';
import { useActivity } from '@/hooks/useActivity';

// ✅ LAZY LOADING: Page components (pastikan path sesuai struktur Anda)
const Dashboard = React.lazy(() => /* webpackChunkName: "dashboard" */ import("@/pages/Dashboard"));
const FinancialReportPage = React.lazy(() => /* webpackChunkName: "financial" */ import("@/pages/FinancialReportPage"));
const RecipePage = React.lazy(() => /* webpackChunkName: "recipe" */ import("@/pages/RecipePage"));
const WarehousePage = React.lazy(() => /* webpackChunkName: "warehouse" */ import("@/pages/WarehousePage"));
const SupplierManagementPage = React.lazy(() => /* webpackChunkName: "supplier" */ import("@/pages/SupplierManagementPage"));
const PurchaseManagement = React.lazy(() => /* webpackChunkName: "purchase" */ import("@/pages/PurchaseManagement"));
const OrdersPage = React.lazy(() => /* webpackChunkName: "orders" */ import("@/pages/OrdersPage"));
const OperationalCostPage = React.lazy(() => /* webpackChunkName: "operational-cost" */ import("@/pages/OperationalCostPage"));
const InvoicePage = React.lazy(() => /* webpackChunkName: "invoice" */ import("@/pages/InvoicePage"));
const AssetManagement = React.lazy(() => /* webpackChunkName: "asset" */ import("@/pages/AssetManagement"));
const Settings = React.lazy(() => /* webpackChunkName: "settings" */ import("@/pages/Settings"));
const MenuPage = React.lazy(() => /* webpackChunkName: "menu" */ import("@/pages/MenuPage"));
const PaymentSuccessPage = React.lazy(() => /* webpackChunkName: "payment-success" */ import("@/pages/PaymentSuccessPage"));

// ✅ PROMO: Lazy load komponen promo yang diperbarui
// Asumsi: PromoCalculator.jsx adalah halaman dashboard ringkas
const PromoCalculator = React.lazy(() => /* webpackChunkName: "promo" */ import("@/pages/PromoCalculator")); 
// Asumsi: PromoList.jsx adalah halaman daftar lengkap
const PromoList = React.lazy(() => /* webpackChunkName: "promo" */ import("@/pages/PromoList")); 
// Jika Anda memiliki halaman kalkulator penuh terpisah, tambahkan:
// const PromoFullCalculator = React.lazy(() => /* webpackChunkName: "promo" */ import("@/pages/PromoFullCalculator")); 

// Initialize Query Client with global settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.message?.includes('session missing') ||
          error?.message?.includes('not authenticated') ||
          error?.status === 401 ||
          error?.status === 403) {
          return false;
        }
        // Retry network errors up to 2 times
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Disable auto refetch on window focus
      refetchOnReconnect: true, // Enable refetch on network reconnect
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

// ✅ ENHANCED: App error with retry logic
const AppErrorComponent = ({ title = "Terjadi Kesalahan" }: { title?: string }) => {
  const navigate = useNavigate();
  return <AppError title={title} onRetry={() => navigate(0)} showRetry={true} />;
};

// ✅ CUSTOM HOOKS USAGE (example)
const useAppNotifications = () => {
  const { addNotification } = useNotification();
  const { addActivity } = useActivity();

  useEffect(() => {
    // Example: Handle global errors or notifications
    const handleError = (error: Error) => {
      logger.error('Global App Error:', error);
      addNotification({
        title: 'Error Sistem',
        message: error.message || 'Terjadi kesalahan tidak terduga',
        type: 'error',
        priority: 4,
      });
    };

    // You can add global error listeners here
    // window.addEventListener('error', handleError);
    // return () => window.removeEventListener('error', handleError);
  }, [addNotification]);

  return { addNotification, addActivity };
};

function App() {
  useAppNotifications(); // Initialize custom hooks
  const { isPaid } = usePaymentContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProviders>
          <Suspense fallback={<AppLoader />}>
            <Routes>
              <Route path="/auth" element={<EmailAuthPage />} />
              <Route
                element={
                  <AuthGuard>
                    <PaymentGuard>
                      <AppLayout />
                    </PaymentGuard>
                  </AuthGuard>
                }
              >
                <Route index element={<Dashboard />} />
                <Route
                  path="resep"
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Resep" />}>
                      <ErrorBoundary fallback={() => <AppErrorComponent title="Gagal Memuat Resep" />}>
                        <RecipesPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="gudang"
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Warehouse" />}>
                      {/* Tambahkan error boundary khusus jika diperlukan */}
                      <ErrorBoundary fallback={() => <AppErrorComponent title="Gagal Memuat Warehouse" />}>
                        <WarehousePage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="supplier"
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Supplier" />}>
                      <ErrorBoundary fallback={() => <AppErrorComponent title="Gagal Memuat Supplier" />}>
                        <SupplierManagementPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="pembelian"
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Pembelian" />}>
                      <ErrorBoundary fallback={() => <AppErrorComponent title="Gagal Memuat Pembelian" />}>
                        <PurchaseManagement />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="pesanan"
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Pesanan" />}>
                      <ErrorBoundary fallback={() => <AppErrorComponent title="Gagal Memuat Pesanan" />}>
                        <OrdersPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="biaya-operasional"
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Biaya Operasional" />}>
                      <ErrorBoundary fallback={() => <AppErrorComponent title="Gagal Memuat Biaya Operasional" />}>
                        <OperationalCostPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route path="invoice" element={<InvoicePage />} />
                <Route path="laporan" element={<FinancialReportPage />} />
                <Route path="aset" element={<AssetManagement />} />
                <Route path="pengaturan" element={<Settings />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="payment-success" element={<PaymentSuccessPage />} />
                
                {/* ✅ PROMO ROUTING YANG DIPERBARUI SESUAI OPSI 1 */}
                {/* /promo -> Dashboard ringkas promo */}
                <Route path="promo" element={<PromoCalculator />} /> 
                {/* /promo/list -> Daftar lengkap promo */}
                <Route path="promo/list" element={<PromoList />} /> 
                {/* Jika Anda memiliki halaman kalkulator penuh terpisah: */}
                {/* <Route path="promo/create" element={<PromoFullCalculator />} /> */}
                {/* <Route path="promo/edit/:id" element={<PromoFullCalculator />} /> */}

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </AppProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
