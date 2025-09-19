import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import { logger } from '@/utils/logger';

const WarehousePage = React.lazy(() =>
  import(/* webpackChunkName: "warehouse" */ '@/components/warehouse/WarehousePageRefactored')
);

const WarehouseAddEditPage = React.lazy(() =>
  import(/* webpackChunkName: "warehouse-add-edit" */ '@/components/warehouse/components/WarehouseAddEditPage')
);

const EditBahanBaku = React.lazy(() =>
  import(/* webpackChunkName: "warehouse-edit-fullpage" */ '@/components/warehouse/pages/EditBahanBaku')
);

const WarehouseErrorFallback: React.FC<{ 
  error: Error; 
  resetErrorBoundary: () => void;
  routeName?: string;
}> = ({ error, resetErrorBoundary, routeName }) => {
  logger.error('Warehouse Error:', error);
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="bg-red-100 rounded-full p-6 mb-6">
        <div className="h-12 w-12 text-red-500 text-3xl flex items-center justify-center">🏪</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Error Warehouse</h3>
      <p className="text-gray-600 mb-6">Terjadi kesalahan saat memuat data gudang.</p>
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={resetErrorBoundary}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          🔄 Muat Ulang Halaman
        </button>
        <button
          onClick={() => window.location.href = '/auth'}
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors"
        >
          🔙 Kembali ke Login
        </button>
      </div>
    </div>
  );
};

const warehouseRoutes = (
  <>
    <Route
      path="warehouse"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse" 
          priority="high"
          preloadOnHover={true}
          errorFallback={WarehouseErrorFallback}
        >
          <WarehousePage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="warehouse/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-edit-fullpage" 
          priority="medium"
          preloadOnHover={true}
          errorFallback={WarehouseErrorFallback}
        >
          <EditBahanBaku />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="warehouse/new"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-add-fullpage" 
          priority="medium"
          preloadOnHover={true}
          errorFallback={WarehouseErrorFallback}
        >
          <EditBahanBaku />
        </OptimizedRouteWrapper>
      }
    />
    
    {/* Legacy routes */}
    <Route
      path="gudang"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-legacy" 
          priority="high"
          preloadOnHover={true}
          errorFallback={WarehouseErrorFallback}
        >
          <WarehousePage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="gudang/add"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-add" 
          priority="medium"
          preloadOnHover={true}
          errorFallback={WarehouseErrorFallback}
        >
          <WarehouseAddEditPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="gudang/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-edit" 
          priority="medium"
          preloadOnHover={true}
          errorFallback={WarehouseErrorFallback}
        >
          <WarehouseAddEditPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default warehouseRoutes;
