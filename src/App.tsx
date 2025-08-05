// ===== 3. UPDATE App.tsx - Full version dengan warehouse useQuery integration =====
// App.tsx - Full updated version
import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Outlet, useNavigate } from "react-router-dom";

// ✅ CONSOLIDATED: UI components grouped
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

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
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import MobileExportButton from "@/components/MobileExportButton";
import OrderConfirmationPopup from "@/components/OrderConfirmationPopup";

// ✅ CONSOLIDATED: Utilities grouped
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/utils/logger";

// ✅ LAZY LOADING: All page components
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

const SupplierManagementPage = React.lazy(() => 
  import(/* webpackChunkName: "suppliers" */ "@/components/supplier").then(module => ({
    default: module.SupplierManagement
  }))
);

const PurchaseManagement = React.lazy(() => 
  import(/* webpackChunkName: "purchase" */ "./components/purchase/PurchasePage")
);

const PromoFullCalculator = React.lazy(() => /* webpackChunkName: "promo" */ import("@/components/promoCalculator/PromoFullCalculator"));

// const PromoCalculatorPage = React.lazy(() => import(/* webpackChunkName: "promo" */ "./pages/PromoCalculatorPage")); // Hapus atau komentari baris lama
const PromoCalculator = React.lazy(() => import(/* webpackChunkName: "promo" */ "@/components/promoCalculator/calculator/PromoCalculator")); // ✅ Tambahkan ini
const PromoList = React.lazy(() => import(/* webpackChunkName: "promo" */ "@/components/promoCalculator/promoList/PromoList")); // ✅ Tambahkan ini

const [NotFound, AssetManagement, Settings, MenuPage, PaymentSuccessPage, InvoicePage] = [
  React.lazy(() => import(/* webpackChunkName: "misc" */ "./pages/NotFound")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "./pages/AssetManagement")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "./pages/Settings")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "./pages/MenuPage")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "./pages/PaymentSuccessPage")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "./pages/InvoicePage"))
];

// ✅ ENHANCED: QueryClient configuration optimized untuk warehouse
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.message?.includes('session missing') || 
            error?.message?.includes('not authenticated') ||
            error?.status === 401 || error?.status === 403) {
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

// ✅ ENHANCED: App loader dengan warehouse context
const AppLoader = ({ title = "Memuat aplikasi..." }: { title?: string }) => (
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

// ✅ ENHANCED: App error dengan retry logic
const AppError = ({ 
  title = "Terjadi Kesalahan", 
  onRetry, 
  showRetry = true 
}: { 
  title?: string; 
  onRetry?: () => void;
  showRetry?: boolean;
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-50">
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
        <div className="bg-red-100 rounded-full p-6 mb-6">
          <div className="h-12 w-12 text-red-500 text-3xl flex items-center justify-center">⚠️</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Gagal memuat halaman. Silakan coba lagi atau kembali ke dashboard.
        </p>
        <div className="flex gap-3">
          {showRetry && (
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg transition-all"
            >
              Muat Ulang
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ NEW: Warehouse-specific error boundary
const WarehouseErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary 
    fallback={(error, errorInfo) => {
      // Log warehouse errors for debugging
      logger.error('Warehouse Error:', { error, errorInfo });
      
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-6 mb-6">
            <div className="h-12 w-12 text-red-500 text-3xl flex items-center justify-center">📦</div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Error Warehouse</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Terjadi error saat memuat data warehouse. Hal ini mungkin karena masalah koneksi atau server.
          </p>
          
          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left bg-gray-100 p-4 rounded mb-4 max-w-full overflow-auto">
              <summary className="cursor-pointer font-medium text-red-600 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {error.toString()}
              </pre>
            </details>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Clear warehouse cache and reload
                queryClient.invalidateQueries({ queryKey: ['warehouse'] });
                window.location.reload();
              }}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg transition-all"
            >
              Reset & Reload
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      );
    }}
  >
    {children}
  </ErrorBoundary>
);

// ✅ ENHANCED: App layout dengan warehouse optimizations
const AppLayout = () => {
  const isMobile = useIsMobile();
  const { 
    isPaid, 
    showOrderPopup,
    setShowOrderPopup,
    refetchPayment,
    unlinkedPaymentCount,
    needsOrderLinking
  } = usePaymentContext();

  const handleOrderLinked = (payment: any) => {
    console.log('✅ Order linked successfully:', payment);
    refetchPayment();
  };

  const renderOrderLinkButton = (isMobileVersion = false) => {
    if (isPaid) return null;

    const baseClasses = isMobileVersion 
      ? "text-xs bg-blue-600 text-white px-2 py-1 rounded"
      : "text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors";

    const urgentClasses = needsOrderLinking || unlinkedPaymentCount > 0
      ? isMobileVersion
        ? "bg-orange-600 animate-pulse"
        : "bg-orange-600 hover:bg-orange-700 animate-pulse"
      : "";

    const buttonText = isMobileVersion
      ? unlinkedPaymentCount > 0 ? `Link (${unlinkedPaymentCount})` : "Link Order"
      : unlinkedPaymentCount > 0 ? `Hubungkan Order (${unlinkedPaymentCount})` : "Hubungkan Order";

    return (
      <button
        onClick={() => setShowOrderPopup(true)}
        className={`${baseClasses} ${urgentClasses}`}
        title={unlinkedPaymentCount > 0 ? `${unlinkedPaymentCount} pembayaran menunggu untuk dihubungkan` : "Hubungkan pembayaran Anda"}
      >
        {buttonText}
      </button>
    );
  };

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary">HPP App</h1>
          </div>
          <div className="flex items-center space-x-2">
            {isPaid && <PaymentStatusIndicator />}
            <NotificationBell />
            <MobileExportButton />
            {renderOrderLinkButton(true)}
          </div>
        </header>
        <main className="flex-1 overflow-auto pb-16">
          <ErrorBoundary fallback={() => <AppError />}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BottomTabBar />
        {!isPaid && (
          <div className="fixed bottom-20 right-4 z-50">
            <PaymentStatusIndicator size="lg" />
          </div>
        )}
        
        <OrderConfirmationPopup
          isOpen={showOrderPopup}
          onClose={() => setShowOrderPopup(false)}
          onSuccess={handleOrderLinked}
        />
      </div>
    );
  }

  return (
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
              {renderOrderLinkButton(false)}
            </div>
          </header>
          <main className="flex-1 w-full min-w-0 overflow-auto p-4 sm:p-6">
            <ErrorBoundary fallback={() => <AppError />}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </SidebarInset>
        
        <OrderConfirmationPopup
          isOpen={showOrderPopup}
          onClose={() => setShowOrderPopup(false)}
          onSuccess={handleOrderLinked}
        />
      </div>
    </SidebarProvider>
  );
};

// ✅ MAIN: App component dengan QueryClient dan Warehouse optimizations
const App = () => {
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && window.location.hash.includes("access_token")) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Auth redirect error:', error);
      }
    };
    handleAuthRedirect();
  }, []);

  // ✅ Enhanced error handling untuk QueryClient
  const handleQueryError = (error: any) => {
    logger.error('React Query Error:', error);
    
    // Handle specific Supabase errors
    if (error?.message?.includes('session missing')) {
      logger.warn('Session expired, redirecting to auth...');
      window.location.href = '/auth';
    }
  };

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
                      <ErrorBoundary fallback={() => <AppError title="Gagal Memuat Resep" />}>
                        <RecipesPage />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                {/* ✅ ENHANCED: Warehouse route dengan special error boundary */}
                <Route 
                  path="gudang" 
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Warehouse" />}>
                      <WarehouseErrorBoundary>
                        <WarehousePage />
                      </WarehouseErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="supplier" 
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Supplier" />}>
                      <ErrorBoundary fallback={() => <AppError title="Gagal Memuat Supplier" />}>
                        <SupplierManagementPage />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="pembelian" 
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Pembelian" />}>
                      <ErrorBoundary fallback={() => <AppError title="Gagal Memuat Pembelian" />}>
                        <PurchaseManagement />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="pesanan" 
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Pesanan" />}>
                      <ErrorBoundary fallback={() => <AppError title="Gagal Memuat Pesanan" />}>
                        <OrdersPage />
                      </ErrorBoundary>
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="biaya-operasional" 
                  element={
                    <Suspense fallback={<AppLoader title="Memuat Biaya Operasional" />}>
                      <ErrorBoundary fallback={() => <AppError title="Gagal Memuat Biaya Operasional" />}>
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
                <Route path="promo" element={<PromoCalculator />} /> {/* Dashboard ringkas promo */}
                <Route path="promo/list" element={<PromoList />} /> {/* Daftar lengkap promo */}
                {/* Jika Anda memiliki halaman kalkulator penuh terpisah: */}
                <Route path="promo/create" element={<PromoFullCalculator />} />
                <Route path="promo/edit/:id" element={<PromoFullCalculator />} />
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
          
          {/* ✅ ENHANCED: React Query DevTools hanya di development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false} 
              position="bottom-right"
              toggleButtonProps={{
                style: {
                  background: '#f97316', // Orange color to match theme
                  color: 'white',
                }
              }}
            />
          )}
        </AppProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;