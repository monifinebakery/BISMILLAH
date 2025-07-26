/ 🎯 Main entry point dengan lazy loading

import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy load components
const PromoCalculatorLayout = lazy(() => import('./PromoCalculatorLayout'));

// Loading component
const PromoLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Memuat Kalkulator Promo...</p>
    </div>
  </div>
);

// Error fallback component
const PromoErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center bg-red-50 p-6 rounded-lg max-w-md">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-700 mb-2">Error Kalkulator Promo</h3>
      <p className="text-red-600 mb-4">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  </div>
);

const PromoCalculatorIndex = () => {
  return (
    <ErrorBoundary FallbackComponent={PromoErrorFallback}>
      <Suspense fallback={<PromoLoadingFallback />}>
        <PromoCalculatorLayout />
      </Suspense>
    </ErrorBoundary>
  );
};

export default PromoCalculatorIndex;