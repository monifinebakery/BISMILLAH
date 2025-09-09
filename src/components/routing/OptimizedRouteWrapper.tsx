import React, { Suspense, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCodeSplittingContext } from '@/providers/CodeSplittingProvider';
import { Loader2 } from 'lucide-react';
import { pwaManager } from '@/utils/pwaUtils';

interface OptimizedRouteWrapperProps {
  children: React.ReactNode;
  routeName: string;
  preloadOnHover?: boolean;
  fallbackComponent?: React.ComponentType<{ routeName?: string }>;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void; routeName?: string }>;
  priority?: 'high' | 'medium' | 'low';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: React.ComponentType<{ error: Error; resetErrorBoundary: () => void; routeName?: string }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  routeName?: string;
}

/**
 * Custom Error Boundary component
 */
class CustomErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={this.resetErrorBoundary}
          routeName={this.props.routeName}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Loading fallback component yang dapat dikustomisasi
 */
const DefaultLoadingFallback: React.FC<{ routeName?: string }> = ({ routeName }) => (
  <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
      <p className="text-gray-600 text-sm">
        Memuat {routeName ? `halaman ${routeName}` : 'komponen'}...
      </p>
      <div className="mt-2 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  </div>
);

/**
 * Error fallback component yang dapat dikustomisasi
 */
const DefaultErrorFallback: React.FC<{ 
  error: Error; 
  resetErrorBoundary: () => void;
  routeName?: string;
}> = ({ error, resetErrorBoundary, routeName }) => {
  const [isFixing, setIsFixing] = React.useState(false);

  const isChunkError = /dynamically imported module|ChunkLoadError|Importing a module script failed/i.test(
    error?.message || ''
  );

  const handleFix = async () => {
    try {
      setIsFixing(true);
      // 1) Try to clear caches that may contain stale assets
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => /hpp-|static|dynamic|api|workbox|vite|assets/i.test(k))
            .map((k) => caches.delete(k))
        );
      }
      // 2) Ask SW to check for updates and immediately activate
      await pwaManager.updateServiceWorker();
      pwaManager.skipWaiting();
    } catch (e) {
      console.warn('Chunk error recovery encountered an issue:', e);
    } finally {
      // 3) Hard reload with cache-busting param
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now().toString());
      window.location.replace(url.toString());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-red-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Gagal Memuat {routeName ? `Halaman ${routeName}` : 'Komponen'}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {error.message || 'Terjadi kesalahan saat memuat komponen'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            disabled={isFixing}
          >
            Coba Lagi
          </button>
          {isChunkError && (
            <button
              onClick={handleFix}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-70"
              disabled={isFixing}
            >
              {isFixing ? 'Memperbarui Aset…' : 'Perbaiki & Muat Ulang'}
            </button>
          )}
        </div>
        {isChunkError && (
          <p className="text-xs text-gray-500 mt-3">
            Tip: Ini biasanya terjadi karena cache versi lama. Tombol “Perbaiki & Muat Ulang” akan
            menyegarkan aset aplikasi Anda.
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Wrapper komponen yang mengoptimalkan loading route dengan code splitting
 * Menyediakan preloading, error handling, dan loading states yang optimal
 */
export const OptimizedRouteWrapper: React.FC<OptimizedRouteWrapperProps> = ({
  children,
  routeName,
  preloadOnHover = true,
  fallbackComponent: FallbackComponent = DefaultLoadingFallback,
  errorFallback: ErrorFallback = DefaultErrorFallback,
  priority = 'medium'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preloadRoute, isChunkLoaded, isChunkLoading, isChunkFailed } = useCodeSplittingContext();
  const [isPreloading, setIsPreloading] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  // Preload komponen saat route aktif
  useEffect(() => {
    if (!isChunkLoaded(routeName) && !isChunkLoading(routeName)) {
      setLoadStartTime(Date.now());
      setIsPreloading(true);
      
      preloadRoute(routeName)
        .then(() => {
          if (loadStartTime) {
            const loadTime = Date.now() - loadStartTime;
            console.log(`✅ Route '${routeName}' loaded in ${loadTime}ms`);
          }
        })
        .catch((error) => {
          console.error(`❌ Failed to preload route '${routeName}':`, error);
        })
        .finally(() => {
          setIsPreloading(false);
          setLoadStartTime(null);
        });
    }
  }, [routeName, preloadRoute, isChunkLoaded, isChunkLoading, loadStartTime]);

  // Preload komponen prioritas tinggi dari route lain
  useEffect(() => {
    if (priority === 'high') {
      const preloadRelatedRoutes = async () => {
        const relatedRoutes = getRelatedRoutes(routeName);
        for (const route of relatedRoutes) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Delay kecil
          preloadRoute(route).catch(console.error);
        }
      };
      
      const timer = setTimeout(preloadRelatedRoutes, 1000);
      return () => clearTimeout(timer);
    }
  }, [routeName, priority, preloadRoute]);

  // Handler untuk preload on hover
  const handleMouseEnter = () => {
    if (preloadOnHover && !isChunkLoaded(routeName)) {
      preloadRoute(routeName).catch(console.error);
    }
  };

  // Render loading state
  if (isPreloading || isChunkLoading(routeName)) {
    return <FallbackComponent routeName={routeName} />;
  }

  // Render error state
  if (isChunkFailed(routeName)) {
    return (
      <ErrorFallback 
        error={new Error(`Failed to load route: ${routeName}`)} 
        resetErrorBoundary={() => window.location.reload()}
        routeName={routeName}
      />
    );
  }

  return (
    <div onMouseEnter={handleMouseEnter}>
      <CustomErrorBoundary
        fallback={ErrorFallback}
        onError={(error: Error, errorInfo: ErrorInfo) => {
          console.error(`Error in route '${routeName}':`, error, errorInfo);
          // Bisa ditambahkan error reporting ke service eksternal
        }}
        routeName={routeName}
      >
        <Suspense fallback={<FallbackComponent routeName={routeName} />}>
          {children}
        </Suspense>
      </CustomErrorBoundary>
    </div>
  );
};

/**
 * Fungsi helper untuk menentukan route terkait yang perlu di-preload
 */
function getRelatedRoutes(routeName: string): string[] {
  const routeRelations: Record<string, string[]> = {
    'dashboard': ['orders', 'warehouse'],
    'orders': ['dashboard', 'invoice'],
    'warehouse': ['dashboard', 'recipe'],
    'recipe': ['warehouse', 'orders'],
    'profit-analysis': ['dashboard', 'orders'],
    'invoice': ['orders', 'profit-analysis']
  };
  
  return routeRelations[routeName] || [];
}

/**
 * HOC untuk wrapping route components dengan optimized loading
 */
export const withOptimizedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  routeName: string,
  options?: Partial<OptimizedRouteWrapperProps>
) => {
  const WrappedComponent = (props: P) => (
    <OptimizedRouteWrapper routeName={routeName} {...options}>
      <Component {...props} />
    </OptimizedRouteWrapper>
  );
  
  WrappedComponent.displayName = `withOptimizedRoute(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook untuk menggunakan optimized navigation dengan preloading
 */
export const useOptimizedNavigation = () => {
  const navigate = useNavigate();
  const { preloadRoute } = useCodeSplittingContext();
  
  const navigateWithPreload = async (to: string, routeName?: string) => {
    if (routeName) {
      try {
        await preloadRoute(routeName);
      } catch (error) {
        console.warn(`Failed to preload route '${routeName}' before navigation:`, error);
      }
    }
    navigate(to);
  };
  
  return { navigateWithPreload };
};