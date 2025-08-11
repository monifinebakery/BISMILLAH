// src/config/routes.tsx - Route Configuration (UPDATED)
import React from 'react';
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { AppLoader, AppError } from "@/components/loaders";
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import EmailAuthPage from "@/components/EmailAuthPage";
import AuthGuard from "@/components/AuthGuard";
import PaymentGuard from "@/components/PaymentGuard";

// ✅ LAZY LOADING: All page components
const Dashboard = React.lazy(() => 
  import(/* webpackChunkName: "dashboard" */ "@/pages/Dashboard")
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
  import(/* webpackChunkName: "purchase" */ "@/components/purchase/PurchasePage")
);

const PromoCalculator = React.lazy(() => 
  import(/* webpackChunkName: "promo" */ "@/components/promoCalculator/calculator/PromoCalculator")
);

const PromoList = React.lazy(() => 
  import(/* webpackChunkName: "promo-list" */ "@/components/promoCalculator/promoList/PromoList")
);

const PromoFullCalculator = React.lazy(() => 
  import(/* webpackChunkName: "promo-full" */ "@/components/promoCalculator/PromoFullCalculator")
    .catch(() => ({ default: () => <div>PromoFullCalculator not found</div> }))
);

// ✅ FIXED: Asset Management - Use AssetPage (no nested QueryClient)
const AssetPage = React.lazy(() => 
  import(/* webpackChunkName: "assets" */ "@/components/assets/AssetPage").then(module => ({
    default: module.AssetPage
  }))
);

// ✅ Other misc components
const [NotFound, Settings, MenuPage, PaymentSuccessPage, InvoicePage] = [
  React.lazy(() => import(/* webpackChunkName: "misc" */ "@/pages/NotFound")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "@/pages/Settings")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "@/pages/MenuPage")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "@/pages/PaymentSuccessPage")),
  React.lazy(() => import(/* webpackChunkName: "misc" */ "@/components/invoice/InvoicePage"))
];

// ✅ Route wrapper with error boundary
const RouteWrapper: React.FC<{ 
  children: React.ReactNode; 
  title?: string;
  specialErrorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
}> = ({ children, title, specialErrorBoundary: SpecialErrorBoundary }) => {
  const ErrorBoundaryComponent = SpecialErrorBoundary || ErrorBoundary;
  
  return (
    <React.Suspense fallback={<AppLoader title={title} />}>
      <ErrorBoundaryComponent fallback={() => <AppError title={`Gagal Memuat ${title || 'Halaman'}`} />}>
        {children}
      </ErrorBoundaryComponent>
    </React.Suspense>
  );
};

// ✅ Warehouse-specific error boundary
const WarehouseErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary 
    fallback={(error, errorInfo) => (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="bg-red-100 rounded-full p-6 mb-6">
          <div className="h-12 w-12 text-red-500 text-3xl flex items-center justify-center">📦</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Error Warehouse</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Terjadi error saat memuat data warehouse. Hal ini mungkin karena masalah koneksi atau server.
        </p>
        
        {import.meta.env.DEV && (
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
            onClick={() => window.location.reload()}
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
    )}
  >
    {children}
  </ErrorBoundary>
);

// ✅ Asset-specific error boundary
const AssetErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary 
    fallback={(error, errorInfo) => (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="bg-red-100 rounded-full p-6 mb-6">
          <div className="h-12 w-12 text-red-500 text-3xl flex items-center justify-center">🏢</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Error Asset Management</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Terjadi error saat memuat data aset. Hal ini mungkin karena masalah dengan sistem pengelolaan aset.
        </p>
        
        {import.meta.env.DEV && (
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
            onClick={() => window.location.reload()}
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
    )}
  >
    {children}
  </ErrorBoundary>
);

// ✅ Main App Router
export const AppRouter = () => (
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
          <RouteWrapper title="Memuat Resep">
            <RecipesPage />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="gudang" 
        element={
          <RouteWrapper title="Memuat Warehouse" specialErrorBoundary={WarehouseErrorBoundary}>
            <WarehousePage />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="supplier" 
        element={
          <RouteWrapper title="Memuat Supplier">
            <SupplierManagementPage />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="pembelian" 
        element={
          <RouteWrapper title="Memuat Pembelian">
            <PurchaseManagement />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="pesanan" 
        element={
          <RouteWrapper title="Memuat Pesanan">
            <OrdersPage />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="biaya-operasional" 
        element={
          <RouteWrapper title="Memuat Biaya Operasional">
            <OperationalCostPage />
          </RouteWrapper>
        } 
      />
      
      <Route path="invoice" element={<InvoicePage />} />
      <Route path="laporan" element={<FinancialReportPage />} />
      
      {/* ✅ FIXED: Asset Management without nested QueryClient */}
      <Route 
        path="aset" 
        element={
          <RouteWrapper title="Memuat Manajemen Aset" specialErrorBoundary={AssetErrorBoundary}>
            <AssetPage />
          </RouteWrapper>
        } 
      />
      
      <Route path="pengaturan" element={<Settings />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="payment-success" element={<PaymentSuccessPage />} />
      
      {/* ✅ Promo routes */}
      <Route 
        path="promo" 
        element={
          <RouteWrapper title="Memuat Kalkulator Promo">
            <PromoCalculator />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="promo/list" 
        element={
          <RouteWrapper title="Memuat Daftar Promo">
            <PromoList />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="promo/create" 
        element={
          <RouteWrapper title="Memuat Form Promo">
            <PromoFullCalculator />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path="promo/edit/:id" 
        element={
          <RouteWrapper title="Memuat Editor Promo">
            <PromoFullCalculator />
          </RouteWrapper>
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);