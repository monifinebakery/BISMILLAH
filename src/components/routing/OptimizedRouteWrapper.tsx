import React, { Suspense, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCodeSplittingContext } from '@/providers/CodeSplittingProvider';
import { Loader2 } from 'lucide-react';
import { pwaManager } from '@/utils/pwaUtils';
import { RouteErrorFallback } from './RouteErrorFallback';
import { preloadLogger, classifyError } from '@/utils/routing/preloadLogger';

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
    // Log error with centralized logger
    preloadLogger.logRouteError({
      routeName: this.props.routeName || 'unknown',
      errorType: classifyError(error),
      errorMessage: error.message,
      errorStack: error.stack
    });

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
 * Simple loading fallback
 */
const DefaultLoadingFallback: React.FC<{ routeName?: string }> = ({ routeName }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
  </div>
);

/**
 * Enhanced Error fallback component with comprehensive recovery options
 */
const DefaultErrorFallback: React.FC<{ 
  error: Error; 
  resetErrorBoundary: () => void;
  routeName?: string;
}> = ({ error, resetErrorBoundary, routeName }) => {
  return (
    <RouteErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      routeName={routeName}
      showLoginFallback={true}
    />
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
      
      // Start preload logging
      preloadLogger.startPreload(routeName);
      
      preloadRoute(routeName)
        .then(() => {
          if (loadStartTime) {
            const loadTime = Date.now() - loadStartTime;
            preloadLogger.markPreloadSuccess(routeName, { 
              cacheHit: false, // Could be enhanced to detect cache hits
              chunkSize: undefined // Could be enhanced to measure chunk size
            });
          }
        })
        .catch((error) => {
          preloadLogger.markPreloadFailure(routeName, error);
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