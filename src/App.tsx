// App.jsx

// Impor yang dibutuhkan
import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";

// Komponen dan Halaman
import EmailAuthPage from "@/components/EmailAuthPage";
import { AppSidebar } from "@/components/AppSidebar";
import AuthGuard from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import MobileExportButton from "@/components/MobileExportButton";

// Halaman di-load secara dinamis (lazy-loading)
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const RecipesPage = React.lazy(() => import("./pages/Recipes"));
const WarehousePage = React.lazy(() => import("./pages/Warehouse"));
const OrdersPage = React.lazy(() => import("./pages/Orders"));
const FinancialReportPage = React.lazy(() => import("./pages/FinancialReport"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AssetManagement = React.lazy(() => import("./pages/AssetManagement"));
const Settings = React.lazy(() => import("./pages/Settings"));
const SupplierManagement = React.lazy(() => import("./pages/SupplierManagement"));
const PurchaseManagement = React.lazy(() => import("./pages/PurchaseManagement"));
const MenuPage = React.lazy(() => import("./pages/MenuPage"));
const PaymentSuccessPage = React.lazy(() => import("./pages/PaymentSuccessPage"));
const InvoicePage = React.lazy(() => import("./pages/InvoicePage"));
const PromoCalculatorPage = React.lazy(() => import("./pages/PromoCalculatorPage"));

// Komponen UI
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

// Hooks dan utilitas
// 🔔 UPDATE: Pastikan import path sesuai dengan lokasi file AppProviders
import { AppProviders } from "@/contexts/AppProviders"; // atau sesuaikan dengan struktur folder kamu
import { usePaymentContext } from "./contexts/PaymentContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { performSignOut } from "@/lib/authUtils";

const queryClient = new QueryClient();

const PageLoader = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
);

const AppLayout = () => {
  const isMobile = useIsMobile();
  const { isPaid } = usePaymentContext();

  const confirmLogout = async () => {
    const success = await performSignOut();
    if (success) {
      toast.success("Berhasil keluar");
    } else {
      toast.error("Gagal keluar");
    }
  };

  return (
    <>
      {isMobile ? (
        <div className="min-h-screen flex flex-col bg-background">
          <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-primary">HPP App</h1>
            </div>
            <div className="flex items-center space-x-2">
              {isPaid && <PaymentStatusIndicator />}
              {/* 🔔 NotificationBell already here - GOOD! */}
              <NotificationBell />
              <MobileExportButton />
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-16">
            <Outlet />
          </main>
          <BottomTabBar />
          {!isPaid && (
            <div className="fixed bottom-20 right-4 z-50">
              <PaymentStatusIndicator size="lg" />
            </div>
          )}
        </div>
      ) : (
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
                  {/* 🔔 NotificationBell already here - GOOD! */}
                  <NotificationBell />
                </div>
              </header>
              <main className="flex-1 w-full min-w-0 overflow-auto p-4 sm:p-6">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      )}
    </>
  );
};

const App = () => {
  useEffect(() => {
    const handleAuthFromUrl = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && window.location.hash.includes("access_token")) {
        window.location.reload();
      }
    };
    handleAuthFromUrl();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* 🔔 AppProviders wraps everything - includes NotificationProvider */}
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
                <Route path="resep" element={<RecipesPage />} />
                <Route path="gudang" element={<WarehousePage />} />
                <Route path="supplier" element={<SupplierManagement />} />
                <Route path="pembelian" element={<PurchaseManagement />} />
                <Route path="pesanan" element={<OrdersPage />} />
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