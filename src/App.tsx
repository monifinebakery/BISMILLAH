import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

// =============================================================
// --- MENGIMPOR SEMUA PROVIDER KONTEKS ---
// =============================================================
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { AssetProvider } from "@/contexts/AssetContext";
import { BahanBakuProvider } from "@/contexts/BahanBakuContext";
import { FinancialProvider } from "@/contexts/FinancialContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { PaymentProvider } from "@/contexts/PaymentContext"; // Asumsi PaymentContext tetap ada untuk timer
import { PurchaseProvider } from "@/contexts/PurchaseContext";
import { RecipeProvider } from "@/contexts/RecipeContext";
import { SupplierProvider } from "@/contexts/SupplierContext";
import { AppProvider } from "@/contexts/AppProvider";
// =============================================================

// --- Konfigurasi dan Komponen UI ---
import { supabase } from "@/integrations/supabase/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppSidebar } from "@/components/AppSidebar";
import AuthGuard from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import CloudSyncButton from "@/components/CloudSyncButton";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import ThemeToggle from "@/components/ThemeToggle"; // Asumsi ada komponen ini

// --- Halaman (Pages) ---
import EmailAuthPage from "@/components/EmailAuthPage";
import Dashboard from "./pages/Dashboard";
import HPPCalculatorPage from "./pages/HPPCalculator";
import RecipesPage from "./pages/Recipes";
import WarehousePage from "./pages/Warehouse";
import OrdersPage from "./pages/Orders";
import FinancialReportPage from "./pages/FinancialReport";
import NotFound from "./pages/NotFound";
import AssetManagement from "./pages/AssetManagement";
import Settings from "./pages/Settings";
import SupplierManagement from "./pages/SupplierManagement";
import PurchaseManagement from "./pages/PurchaseManagement";
import MenuPage from "./pages/MenuPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";

// --- Hooks dan Utilitas ---
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { performSignOut } from "@/lib/authUtils";


// Konfigurasi QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
    },
  },
});

// Komponen Layout Aplikasi
const AppLayout = () => {
  const isMobile = useIsMobile();
  const { isPaid } = usePaymentContext();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    const success = await performSignOut();
    if (success) {
      toast.success("Berhasil keluar");
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
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
              <h1 className="text-lg font-bold text-primary">HPP by Monifine</h1>
            </div>
            <div className="flex items-center space-x-2">
              {isPaid && <PaymentStatusIndicator />}
              <CloudSyncButton variant="upload" className="text-xs px-2 py-1" />
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 px-2 py-1">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-16">
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
                 <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <BottomTabBar />
          {!isPaid && (
            <div className="fixed bottom-20 right-4 z-50">
              <PaymentStatusIndicator size="lg" />
            </div>
          )}
          <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin keluar? Anda perlu login kembali untuk mengakses data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmLogout}>Keluar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
              <header className="sticky top-0 z-40 flex h-12 sm:h-14 lg:h-[60px] items-center gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 lg:px-6 w-full">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1" />
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                  <PaymentStatusIndicator />
                  <CloudSyncButton variant="upload" />
                  <DateTimeDisplay />
                  <NotificationBell />
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </header>
              <main className="flex-1 w-full min-w-0 overflow-auto">
                <div className="w-full max-w-none">
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </SidebarInset>
          </div>
          <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin keluar? Anda perlu login kembali untuk mengakses data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmLogout}>Keluar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarProvider>
      )}
    </>
  );
};

// Komponen utama App
const App = () => {
  useEffect(() => {
    const handleAuthFromHash = async () => {
      if (window.location.hash.includes("access_token")) {
        await supabase.auth.getSessionFromUrl();
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