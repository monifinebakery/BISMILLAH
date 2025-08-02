// App.jsx - Improved Lazy Loading Strategy

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Outlet, useNavigate } from "react-router-dom";

// ✅ CRITICAL: Keep only essential imports in main bundle
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppProviders } from "@/contexts/AppProviders";
import { usePaymentContext } from "./contexts/PaymentContext";

// ✅ KEEP: Core contexts that need to be available immediately
import { RecipeProvider } from "@/contexts/RecipeContext";
import { SupplierProvider } from "@/contexts/SupplierContext";
import { OperationalCostProvider } from "@/components/operational-costs/context/OperationalCostContext";

// ✅ KEEP: Critical components for layout
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import EmailAuthPage from "@/components/EmailAuthPage";
import { AppSidebar } from "@/components/AppSidebar";
import AuthGuard from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import MobileExportButton from "@/components/MobileExportButton";

import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// ✅ OPTIMIZED: More aggressive lazy loading with webpack comments for chunk naming
const Dashboard = React.lazy(() => 
  import(/* webpackChunkName: "dashboard" */ "./pages/Dashboard")
);

const RecipesPage = React.lazy(() => 
  import(/* webpackChunkName: "recipes" */ "@/pages/Recipes")
);

const WarehousePage = React.lazy(() => 
  import(/* webpackChunkName: "warehouse" */ "@/components/warehouse/WarehousePage")
);

const OrdersPage = React.lazy(() => 
  import(/* webpackChunkName: "orders" */ "@/components/orders/components/OrdersPage")
);

const OperationalCostPage = React.lazy(() => 
  import(/* webpackChunkName: "operational-costs" */ "@/components/operational-costs/OperationalCostPage")
);

const FinancialReportPage = React.lazy(() => 
  import(/* webpackChunkName: "financial" */ "@/components/financial/FinancialReportPage")
);

const NotFound = React.lazy(() => 
  import(/* webpackChunkName: "not-found" */ "./pages/NotFound")
);

const AssetManagement = React.lazy(() => 
  import(/* webpackChunkName: "assets" */ "./pages/AssetManagement")
);

const Settings = React.lazy(() => 
  import(/* webpackChunkName: "settings" */ "./pages/Settings")
);

const SupplierManagementPage = React.lazy(() => 
  import(/* webpackChunkName: "suppliers" */ "@/components/supplier").then(module => ({
    default: module.SupplierManagement
  }))
);

const PurchaseManagement = React.lazy(() => 
  import(/* webpackChunkName: "purchase" */ "./components/purchase/PurchasePage")
);

const MenuPage = React.lazy(() => 
  import(/* webpackChunkName: "menu" */ "./pages/MenuPage")
);

const PaymentSuccessPage = React.lazy(() => 
  import(/* webpackChunkName: "payment" */ "./pages/PaymentSuccessPage")
);

const InvoicePage = React.lazy(() => 
  import(/* webpackChunkName: "invoice" */ "./pages/InvoicePage")
);

const PromoCalculatorPage = React.lazy(() => 
  import(/* webpackChunkName: "promo" */ "./pages/PromoCalculatorPage")
);

// ✅ OPTIMIZED: Query client with smaller cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce default cache time to save memory
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// ✅ FIXED: Properly centered loading components
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Memuat...</p>
    </div>
  </div>
);

// ✅ FIXED: Properly centered page loaders with viewport units
const createPageLoader = (title) => () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{title}</p>
      </div>
    </div>
  </div>
);

// ✅ ALTERNATIVE: Even more precise centering with absolute positioning
const createPreciseCenteredLoader = (title) => () => (
  <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-orange-50 to-red-50 z-50">
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        <div className="text-center">
          <p className="text-base font-medium text-gray-700 whitespace-nowrap">{title}</p>
          <p className="text-xs text-gray-500 mt-1">Mohon tunggu sebentar...</p>
        </div>
      </div>
    </div>
  </div>
);

// ✅ MINIMAL: Ultra-lightweight loader for better performance
const MinimalLoader = () => (
  <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-orange-500 mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
);

// Usage examples for App.jsx:

// Replace the existing PageLoader with this:
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Memuat aplikasi...</p>
    </div>
  </div>
);

// And replace createPageLoader function with this:
const createPageLoader = (title) => () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-50">
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      <div className="text-center">
        <p className="text-base font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-500 mt-1">Sedang memuat...</p>
      </div>
    </div>
  </div>
);

const RecipePageLoader = createPageLoader("Memuat Resep");
const SupplierPageLoader = createPageLoader("Memuat Supplier");
const OrderPageLoader = createPageLoader("Memuat Pesanan");
const OperationalCostPageLoader = createPageLoader("Memuat Biaya Operasional");
const PurchasePageLoader = createPageLoader("Memuat Pembelian");

// ✅ SIMPLIFIED: Error fallbacks
const RouteErrorFallback = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-4 text-center">
      <h2 className="text-xl font-semibold text-destructive mb-2">Terjadi Kesalahan</h2>
      <p className="text-muted-foreground mb-4">Gagal memuat halaman.</p>
      <button
        onClick={() => navigate('/', { replace: true })}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
};

// ✅ OPTIMIZED: Simplified error boundaries (removed heavy SVGs)
const createErrorFallback = (title) => () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="bg-red-100 rounded-full p-6 mb-4">
            <div className="h-16 w-16 text-red-500 text-4xl">⚠️</div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Terjadi kesalahan saat memuat halaman. Coba lagi.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg"
            >
              Muat Ulang
            </button>
            <button
              onClick={() => navigate('/')}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecipeErrorFallback = createErrorFallback("Gagal Memuat Resep");
const SupplierErrorFallback = createErrorFallback("Gagal Memuat Supplier");
const OrderErrorFallback = createErrorFallback("Gagal Memuat Pesanan");
const OperationalCostErrorFallback = createErrorFallback("Gagal Memuat Biaya Operasional");
const PurchaseErrorFallback = createErrorFallback("Gagal Memuat Pembelian");

// ✅ MAIN LAYOUT: Keep providers but optimize structure
const AppLayout = () => {
  const isMobile = useIsMobile();
  const { isPaid } = usePaymentContext();

  if (isMobile) {
    return (
      <OperationalCostProvider>
        <RecipeProvider>
          <SupplierProvider>
            <div className="min-h-screen flex flex-col bg-background">
              <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                <div className="flex-1"><h1 className="text-lg font-bold text-primary">HPP App</h1></div>
                <div className="flex items-center space-x-2">
                  {isPaid && <PaymentStatusIndicator />}
                  <NotificationBell />
                  <MobileExportButton />
                </div>
              </header>
              <main className="flex-1 overflow-auto pb-16">
                <ErrorBoundary fallback={<RouteErrorFallback />}>
                  <Outlet />
                </ErrorBoundary>
              </main>
              <BottomTabBar />
              {!isPaid && (
                <div className="fixed bottom-20 right-4 z-50">
                  <PaymentStatusIndicator size="lg" />
                </div>
              )}
            </div>
          </SupplierProvider>
        </RecipeProvider>
      </OperationalCostProvider>
    );
  }

  return (
    <OperationalCostProvider>
      <RecipeProvider>
        <SupplierProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
              <AppSidebar />
              <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
                <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 w-full">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1" />
                  <div className="flex items-center space-x-4">
                    <PaymentStatusIndicator />
                    <DateTimeDisplay />
                    <NotificationBell />
                  </div>
                </header>
                <main className="flex-1 w-full min-w-0 overflow-auto p-4 sm:p-6">
                  <ErrorBoundary fallback={<RouteErrorFallback />}>
                    <Outlet />
                  </ErrorBoundary>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </SupplierProvider>
      </RecipeProvider>
    </OperationalCostProvider>
  );
};

const App = () => {
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && window.location.hash.includes("access_token")) {
        window.location.reload();
      }
    };
    handleAuthRedirect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProviders>
          <Suspense fallback={<PageLoader />}>
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
                    <Suspense fallback={<RecipePageLoader />}>
                      <ErrorBoundary fallback={<RecipeErrorFallback />}>
                        <RecipesPage />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route path="gudang" element={<WarehousePage />} />
                
                <Route 
                  path="supplier" 
                  element={
                    <Suspense fallback={<SupplierPageLoader />}>
                      <ErrorBoundary fallback={<SupplierErrorFallback />}>
                        <SupplierManagementPage />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="pembelian" 
                  element={
                    <Suspense fallback={<PurchasePageLoader />}>
                      <ErrorBoundary fallback={<PurchaseErrorFallback />}>
                        <PurchaseManagement />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="pesanan" 
                  element={
                    <Suspense fallback={<OrderPageLoader />}>
                      <ErrorBoundary fallback={<OrderErrorFallback />}>
                        <OrdersPage />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="biaya-operasional" 
                  element={
                    <Suspense fallback={<OperationalCostPageLoader />}>
                      <ErrorBoundary fallback={<OperationalCostErrorFallback />}>
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
                <Route path="promo" element={<PromoCalculatorPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </AppProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;