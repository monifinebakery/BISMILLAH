// App.jsx

// Impor React dan hooks
import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Outlet, useNavigate } from "react-router-dom";

// Impor Provider dan Library
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppProviders } from "@/contexts/AppProviders";
import { usePaymentContext } from "./contexts/PaymentContext";

// Impor Komponen Aplikasi
import ErrorBoundary from "@/components/ErrorBoundary"; // <-- Tambahan baru
import EmailAuthPage from "@/components/EmailAuthPage";
import { AppSidebar } from "@/components/AppSidebar";
import AuthGuard from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import MobileExportButton from "@/components/MobileExportButton";

// Impor Utilitas dan Hooks
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy-loading semua halaman untuk performa
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

// Inisialisasi Query Client
const queryClient = new QueryClient();

// Komponen Loading State
const PageLoader = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
);

// Fallback UI untuk ErrorBoundary
const RouteErrorFallback = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center h-full bg-background p-4 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Terjadi Kesalahan</h2>
            <p className="text-muted-foreground mb-4">Gagal memuat halaman ini. Coba muat ulang.</p>
            <button
                onClick={() => {
                    // Coba navigasi ke halaman utama, jika gagal baru reload
                    navigate('/', { replace: true });
                    setTimeout(() => window.location.reload(), 200);
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
                Muat Ulang
            </button>
        </div>
    );
};

// Layout Utama Aplikasi
const AppLayout = () => {
    const isMobile = useIsMobile();
    const { isPaid } = usePaymentContext();

    // Layout untuk Mobile
    if (isMobile) {
        return (
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
                    {/* Melindungi setiap halaman dari error rendering */}
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
        );
    }

    // Layout untuk Desktop
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
                        </div>
                    </header>
                    <main className="flex-1 w-full min-w-0 overflow-auto p-4 sm:p-6">
                        {/* Melindungi setiap halaman dari error rendering */}
                        <ErrorBoundary fallback={<RouteErrorFallback />}>
                            <Outlet />
                        </ErrorBoundary>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

// Komponen Aplikasi Utama
const App = () => {
    // Efek untuk menangani auth redirect dari Supabase (magic link)
    useEffect(() => {
        const handleAuthRedirect = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // Jika tidak ada sesi tapi ada token di URL, reload untuk Supabase client memprosesnya
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
                            {/* Rute Publik */}
                            <Route path="/auth" element={<EmailAuthPage />} />

                            {/* Rute Terproteksi dengan Layout */}
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
                                
                                {/* Rute 'Not Found' untuk halaman terproteksi */}
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
