// Impor yang dibutuhkan
import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
const PromoCalculatorPage = React.lazy(() => import("./pages/PromoCalculatorPage")); // ✨ HALAMAN BARU DITAMBAHKAN

// Komponen UI dari ShadCN
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Hooks dan utilitas
import { AppProviders } from "@/contexts/AppProviders";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => setShowLogoutConfirm(true);
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
            <div className="flex-1"><h1 className="text-lg font-bold text-primary">HPP App</h1></div>
            <div className="flex items-center space-x-2">{isPaid && <PaymentStatusIndicator />}<NotificationBell /><MobileExportButton /></div>
          </header>
          <main className="flex-1 overflow-auto pb-16">
            <Outlet />
          </main>
          <BottomTabBar />
          {!isPaid && (<div className="fixed bottom-20 right-4 z-50"><PaymentStatusIndicator size="lg" /></div>)}
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
                  <PaymentStatusIndicator /><DateTimeDisplay /><NotificationBell />
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /></Button>
                </div>
              </header>
              <main className="flex-1 w-full min-w-0 overflow-auto p-4 sm:p-6">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
          <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle><AlertDialogDescription>Apakah Anda yakin ingin keluar?</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={confirmLogout}>Keluar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
        <BrowserRouter>
          <AppProviders>
            <Toaster />
            <Sonner />
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
                  <Route path="laporan" element={<FinancialReportPage />} />
                  <Route path="aset" element={<AssetManagement />} />
                  <Route path="pengaturan" element={<Settings />} />
                  <Route path="menu" element={<MenuPage />} />
                  <Route path="payment-success" element={<PaymentSuccessPage />} />
                  
                  {/* ✨ PERBAIKAN UTAMA DI SINI ✨ */}
                  {/* Rute /pesanan dan /pesanan/invoice/:orderId sekarang disatukan */}
                  <Route path="pesanan">
                    <Route index element={<OrdersPage />} />
                    <Route path="invoice/:orderId" element={<InvoicePage />} />
                    <Route path="invoice" element={<InvoicePage />} />
                    
                  </Route>
                  <Route path="promo" element={<PromoCalculatorPage />} /> {/* ✨ RUTE BARU DITAMBAHKAN */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </AppProviders>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;