import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider, QueryClientProviderProps } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmailAuthPage from "@/components/EmailAuthPage";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";
import AuthGuard from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import CloudSyncButton from "@/components/CloudSyncButton";
import Dashboard from "./pages/Dashboard";
import HPPCalculatorPage from "./pages/HPPCalculator";
import RecipesPage from "./pages/Recipes";
import WarehousePage from "./pages/Warehouse";
import OrdersPage from "./pages/Orders";
import FinancialReportPage from "./pages/FinancialReport";
import NotFound from "./pages/NotFound";
import AssetManagement from "./pages/AssetManagement";
import Settings from "./pages/Settings";
import DateTimeDisplay from "./components/DateTimeDisplay";
import NotificationBell from "./components/NotificationBell";
import SupplierManagement from "./pages/SupplierManagement";
import PurchaseManagement from "./pages/PurchaseManagement";
import BottomTabBar from "./components/BottomTabBar";
import MenuPage from "./pages/MenuPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { performSignOut } from "@/lib/authUtils";
import { usePaymentContext } from "./contexts/PaymentContext";
// MODIFIED: Impor ThemeToggle
import ThemeToggle from "@/components/ThemeToggle"; // Hapus kurung kurawal; 

// Konfigurasi QueryClient dengan retry yang lebih sedikit untuk mengurangi beban server
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
    },
  },
});

// MODIFIED: Logika layout dipindahkan ke komponen baru agar bisa mengakses context
const AppLayout = () => {
  const isMobile = useIsMobile();
  const { isPaid } = usePaymentContext(); // Mengambil status pembayaran

  const handleLogout = async () => {
    try {
      const success = await performSignOut();
      if (success) {
        toast.success("Berhasil keluar");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error("Gagal keluar");
      }
    } catch (error) {
      toast.error("Gagal keluar");
    }
  }

  return (
    <>
      {isMobile ? (
        // Mobile layout
        <div className="min-h-screen flex flex-col bg-background"> {/* MODIFIED: bg-background */}
          <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-primary">HPP by Monifine</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* MODIFIED: Indikator hanya tampil di header jika sudah bayar */}
              {isPaid && <PaymentStatusIndicator />}
              <CloudSyncButton variant="upload" className="text-xs px-2 py-1" />
              {/* MODIFIED: Tambahkan ThemeToggle untuk mobile */}
              <ThemeToggle /> 
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:bg-destructive/10 px-2 py-1" // MODIFIED: text-destructive hover:bg-destructive/10
              >
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
          {/* MODIFIED: Tombol upgrade mengambang jika belum bayar */}
          {!isPaid && (
            <div className="fixed bottom-20 right-4 z-50">
              <PaymentStatusIndicator size="lg" />
            </div>
          )}
        </div>
      ) : (
        // Desktop layout - tidak ada perubahan
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background"> {/* MODIFIED: bg-background */}
            <AppSidebar />
            <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
              <header className="sticky top-0 z-40 flex h-12 sm:h-14 lg:h-[60px] items-center gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 lg:px-6 w-full">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1" />
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                  <PaymentStatusIndicator />
                  <CloudSyncButton variant="upload" />
                  {/* MODIFIED: Tambahkan ThemeToggle untuk desktop */}
                  <ThemeToggle /> 
                  <DateTimeDisplay />
                  <NotificationBell />
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
        </SidebarProvider>
      )}
    </>
  );
};


const App = () => {
  // Handle Supabase auth hash from URL
  useEffect(() => {
    const handleAuthFromHash = async () => {
      try {
        // Check if URL has a hash that might contain auth data
        if (window.location.hash && window.location.hash.length > 1) {
          console.log("Auth hash detected, processing session...");
          
          // Process the hash and set the session
          const { data, error } = await supabase.auth.getSessionFromUrl();
          
          if (error) {
            console.error("Error getting session from URL:", error);
          } else if (data?.session) {
            console.log("Session successfully retrieved from URL");
            
            // Clear the hash from the URL to avoid processing it again
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }
      } catch (error) {
        console.error("Error handling auth from hash:", error);
      }
    };

    handleAuthFromHash();
  }, []);

  // Pastikan QueryClient tidak dibuat ulang pada setiap render
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppDataProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/auth" element={<EmailAuthPage />} />
              <Route path="*" element={
                <AuthGuard>
                  <PaymentGuard>
                    <AppLayout />
                  </PaymentGuard>
                </AuthGuard>
              } />
            </Routes>
          </AppDataProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
