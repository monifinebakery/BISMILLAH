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

// Impor Utilitas dan Hooks
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy-loading semua halaman untuk performa
const Dashboard = React.lazy(() => import("./pages/Dashboard"));

// ✅ UPDATE: Recipe Management dengan struktur modular baru
const RecipesPage = React.lazy(() => 
  import("@/pages/Recipes")
);

const WarehousePage = React.lazy(() => 
  import("@/components/warehouse/WarehousePage")
);

// ✅ NEW: Order Management dengan struktur modular baru
const OrdersPage = React.lazy(() => 
  import("@/components/orders/components/OrdersPage")
);

const FinancialReportPage = React.lazy(() => import("@/components/financial/FinancialReportPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AssetManagement = React.lazy(() => import("./pages/AssetManagement"));
const Settings = React.lazy(() => import("./pages/Settings"));
const SupplierManagement = React.lazy(() => import("./pages/SupplierManagement"));

// Purchase Management dengan struktur modular
const PurchaseManagement = React.lazy(() => 
  import("./components/purchase/components/layout/PurchasePage")
);

const MenuPage = React.lazy(() => import("./pages/MenuPage"));
const PaymentSuccessPage = React.lazy(() => import("./pages/PaymentSuccessPage"));
const InvoicePage = React.lazy(() => import("./pages/InvoicePage"));
const PromoCalculatorPage = React.lazy(() => import("./pages/PromoCalculatorPage"));

// Inisialisasi Query Client
const queryClient = new QueryClient();

// Komponen Loading State dengan design yang lebih baik
const PageLoader = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Memuat halaman...</p>
        </div>
    </div>
);

// Enhanced loading khusus untuk Recipe Management
const RecipePageLoader = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-100 rounded-full animate-pulse"></div>
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Memuat Manajemen Resep</p>
                <p className="text-xs text-gray-500 mt-1">Sedang menyiapkan data resep...</p>
            </div>
        </div>
    </div>
);

// ✅ NEW: Enhanced loading khusus untuk Order Management
const OrderPageLoader = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-100 rounded-full animate-pulse"></div>
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Memuat Manajemen Pesanan</p>
                <p className="text-xs text-gray-500 mt-1">Sedang menyiapkan data pesanan...</p>
            </div>
        </div>
    </div>
);

// Enhanced loading khusus untuk Purchase Management
const PurchasePageLoader = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-100 rounded-full animate-pulse"></div>
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Memuat Manajemen Pembelian</p>
                <p className="text-xs text-gray-500 mt-1">Sedang menyiapkan data...</p>
            </div>
        </div>
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

// Specialized error boundary untuk Recipe Management
const RecipeErrorFallback = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
            <div className="container mx-auto p-4 sm:p-8">
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <div className="bg-red-100 rounded-full p-6 mb-4">
                        <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        Gagal Memuat Manajemen Resep
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                        Terjadi kesalahan saat memuat halaman resep. Pastikan koneksi internet stabil dan coba lagi.
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
                            Kembali ke Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ✅ NEW: Specialized error boundary untuk Order Management
const OrderErrorFallback = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
            <div className="container mx-auto p-4 sm:p-8">
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <div className="bg-red-100 rounded-full p-6 mb-4">
                        <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        Gagal Memuat Manajemen Pesanan
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                        Terjadi kesalahan saat memuat halaman pesanan. Pastikan koneksi internet stabil dan coba lagi.
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
                            Kembali ke Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Specialized error boundary untuk Purchase Management
const PurchaseErrorFallback = () => {
    const navigate = useNavigate();
    return (
        <div className="container mx-auto p-4 sm:p-8">
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="bg-red-100 rounded-full p-6 mb-4">
                    <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Gagal Memuat Manajemen Pembelian
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                    Terjadi kesalahan saat memuat halaman pembelian. Pastikan koneksi internet stabil dan coba lagi.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
                    >
                        Muat Ulang
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
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
                                
                                {/* ✅ UPDATE: Recipe Management dengan enhanced loading dan error handling */}
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
                                <Route path="supplier" element={<SupplierManagement />} />
                                
                                {/* Purchase Management dengan enhanced loading dan error handling */}
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
                                
                                {/* ✅ NEW: Order Management dengan enhanced loading dan error handling */}
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