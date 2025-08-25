import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import { logger } from '@/utils/logger';

const AssetPage = React.lazy(() =>
  import(/* webpackChunkName: "assets" */ '@/components/assets/AssetPage').then(module => ({
    default: module.AssetPage,
  }))
);

const AssetErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={(error, errorInfo) => {
      logger.error('Asset Error:', error, errorInfo);
      return (
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
      );
    }}
  >
    {children}
  </ErrorBoundary>
);

const assetRoutes = (
  <Route
    path="aset"
    element={
      <RouteWrapper title="Memuat Manajemen Aset" specialErrorBoundary={AssetErrorBoundary}>
        <AssetPage />
      </RouteWrapper>
    }
  />
);

export default assetRoutes;
