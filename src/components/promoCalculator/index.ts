import { lazy, Suspense, ComponentType, ReactElement } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Type definitions
interface PromoLoadingFallbackProps {
  size?: 'small' | 'default' | 'large';
}

interface PromoErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Lazy load main layout
const PromoCalculatorLayout: ComponentType = lazy(() => import('./PromoCalculatorLayout'));

// Enhanced loading component
const PromoLoadingFallback = ({ size = 'default' }: PromoLoadingFallbackProps): ReactElement => {
  const sizeClasses: Record<string, string> = {
    small: 'h-32',
    default: 'min-h-[400px]',
    large: 'min-h-screen'
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-orange-100 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div>
          <p className="text-gray-700 font-medium">Memuat Kalkulator Promo</p>
          <p className="text-sm text-gray-500 mt-1">Menyiapkan komponen...</p>
        </div>
      </div>
    </div>
  );
};

// Enhanced error fallback component
const PromoErrorFallback = ({ error, resetErrorBoundary }: PromoErrorFallbackProps): ReactElement => {
  const handleRetry = (): void => {
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      // Clear localStorage promo data if corrupted
      try {
        const keys: string[] = Object.keys(localStorage).filter((key: string) => key.startsWith('promo_'));
        keys.forEach((key: string) => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
    }
    
    resetErrorBoundary();
  };

  const handleReload = (): void => {
    window.location.reload();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Error Kalkulator Promo
        </h3>
        
        <p className="text-red-600 mb-6 text-sm">
          {error?.message || 'Terjadi kesalahan saat memuat kalkulator promo'}
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={handleRetry}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Coba Lagi</span>
          </button>
          
          <button 
            onClick={handleReload}
            className="w-full border border-red-300 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Muat Ulang Halaman
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-red-500 hover:text-red-700">
              Detail Error (Development)
            </summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
              {error?.stack || error?.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Main component with enhanced error boundaries
const PromoCalculatorIndex = (): ReactElement => {
  return (
    <ErrorBoundary 
      FallbackComponent={PromoErrorFallback}
      onError={(error: Error, errorInfo: any) => {
        // Log error untuk debugging
        console.error('PromoCalculator Error:', error);
        console.error('Error Info:', errorInfo);
        
        // Bisa tambah error reporting service di sini
        // contoh: Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      <Suspense fallback={<PromoLoadingFallback />}>
        <PromoCalculatorLayout />
      </Suspense>
    </ErrorBoundary>
  );
};

export default PromoCalculatorIndex;