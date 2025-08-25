import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import { logger } from '@/utils/logger';

const WarehousePage = React.lazy(() =>
  import(/* webpackChunkName: "warehouse" */ '@/components/warehouse/WarehousePage')
);

const WarehouseErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={(error, errorInfo) => {
      logger.error('Warehouse Error:', error, errorInfo);
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-6 mb-6">
            <div className="h-12 w-12 text-red-500 text-3xl flex items-center justify-center"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Error Warehouse</h3>
          <p className="text-gray-600 mb-6">Terjadi kesalahan saat memuat data gudang.</p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => window.location.reload()}
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
    }}
  >
    {children}
  </ErrorBoundary>
);

const warehouseRoutes = (
  <Route
    path="gudang"
    element={
      <RouteWrapper title="Memuat Warehouse" specialErrorBoundary={WarehouseErrorBoundary}>
        <WarehousePage />
      </RouteWrapper>
    }
  />
);

export default warehouseRoutes;
