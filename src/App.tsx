// Impor yang dibutuhkan untuk code-splitting
import React, { Suspense, useEffect, useState } from 'react'; 
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LogOut } from "lucide-react";
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

// ===================================================================
// --- LANGKAH 1: HAPUS SEMUA IMPOR HALAMAN STATIS ---
// ===================================================================
// import Dashboard from "./pages/Dashboard";
// import HPPCalculatorPage from "./pages/HPPCalculator";
// ... (dan semua import halaman lainnya)

// ===================================================================
// --- LANGKAH 2: GUNAKAN React.lazy UNTUK MEMBUAT IMPOR DINAMIS ---
// ===================================================================
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const HPPCalculatorPage = React.lazy(() => import("./pages/HPPCalculator"));
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


// Komponen UI dari ShadCN
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Hooks dan utilitas
import { AppProviders } from "@/contexts/AppProviders";
import { usePaymentContext } from "./contexts/PaymentContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { performSignOut } from "@/lib/authUtils";

const queryClient = new QueryClient();

// Komponen sederhana untuk fallback saat halaman sedang dimuat
const PageLoader = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
);

const AppLayout = () => {
  const isMobile = useIsMobile();
  const { isPaid } = usePaymentContext();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    const success = await performSignOut();
    if (success) {
      toast.success("Berhasil keluar");
      setTimeout(() => window.location.href = '/auth', 500);
    } else {
      toast.error("Gagal keluar");
    }
  };

  return (
    <>
      {isMobile ? (
        // Mobile layout
        <div className="min-h-screen flex flex-col bg-background">
          <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex-1"><h1 className="text-lg font-bold text-primary">HPP by Monifine</h1></div>
            <div className="flex items-center space-x-2">{isPaid && <PaymentStatusIndicator />}<NotificationBell /><MobileExportButton /></div>
          </header>
          <main className="flex-1 overflow-auto pb-16">
            {/* --- LANGKAH 3: BUNGKUS Routes DENGAN Suspense --- */}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/hpp" element={<HPPCalculatorPage />} />
                  <Route path="/resep" element={<RecipesPage />} />
                  <Route path="/gudang" element={<WarehousePage />} />
                  <Route path="/supplier" element={<SupplierManagement />} />
                  <Route path="/pembelian" element={<PurchaseManagement />} />
                  <Route path="/pesanan" element={<OrdersPage />} />
                  <Route path="/laporan" element={<FinancialReportPage />} />
                  <Route path="/aset" element={<AssetManagement />} />
                  <Route path="/pengaturan" element={<Settings />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  <Route path="/invoice" element={<InvoicePage />} />
                  <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <BottomTabBar />
          {!isPaid && (<div className="fixed bottom-20 right-4 z-50"><PaymentStatusIndicator size="lg" /></div>)}
        </div>
      ) : (
        // Desktop layout
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
              <header className="sticky top-0 z-40 flex h-12 sm:h-14 lg:h-[60px] items-center gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 lg:px-6 w-full">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1" />
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                  <PaymentStatusIndicator /><DateTimeDisplay /><NotificationBell />
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /></Button>
                </div>
              </header>
              <main className="flex-1 w-full min-w-0 overflow-auto">
                <div className="w-full max-w-none">
                  {/* --- LANGKAH 3: BUNGKUS Routes DENGAN Suspense --- */}
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/hpp" element={<HPPCalculatorPage />} />
                      <Route path="/resep" element={<RecipesPage />} />
                      <Route path="/gudang" element={<WarehousePage />} />
                      <Route path="/supplier" element={<SupplierManagement />} />
                      <Route path="/pembelian" element={<PurchaseManagement />} />
                      <Route path="/pesanan" element={<OrdersPage />} />
                      <Route path="/laporan" element={<FinancialReportPage />} />
                      <Route path="/aset" element={<AssetManagement />} />
                      <Route path="/pengaturan" element={<Settings />} />
                      <Route path="/menu" element={<MenuPage />} />
                      <Route path="/payment-success" element={<PaymentSuccessPage />} />
                      <Route path="/invoice" element={<InvoicePage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </div>
              </main>
            </SidebarInset>
          </div>
          <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle><AlertDialogDescription>Apakah Anda yakin ingin keluar?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={confirmLogout}>Keluar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </SidebarProvider>
      )}
    </>
  );
};

const App = () => {
  useEffect(() => {
    const handleAuthFromHash = async () => {
      if (window.location.hash.includes("access_token")) {
        // `getSessionFromUrl` sudah digantikan di versi baru, tapi jika ini bekerja, biarkan saja.
        // Jika ada masalah, pertimbangkan menggunakan listener `onAuthStateChange`.
        await supabase.auth.getSession();
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    handleAuthFromHash();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppProviders>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/auth" element={<EmailAuthPage />} />
              <Route
                path="*"
                element={
                  <AuthGuard>
                    <PaymentGuard>
                      <AppLayout />
                    </PaymentGuard>
                  </AuthGuard>
                }
              />
            </Routes>
          </AppProviders>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;