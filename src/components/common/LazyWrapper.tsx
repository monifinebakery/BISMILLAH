import React, { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// ULTRA PERFORMANCE: Lazy loading wrapper dengan loading state yang optimal
interface LazyWrapperProps {
  fallback?: React.ReactNode;
  className?: string;
}

// Loading component yang ringan dengan skeleton
const DefaultLoader = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center p-8 ${className || ''}`}>
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

// HOC untuk lazy loading dengan error boundary
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: P & LazyWrapperProps) {
    const { fallback: customFallback, className, ...componentProps } = props;
    
    return (
      <Suspense fallback={customFallback || fallback || <DefaultLoader className={className} />}>
        <LazyComponent {...(componentProps as P)} />
      </Suspense>
    );
  };
}

// Utility untuk preload komponen
export function preloadComponent<P extends object>(importFunc: () => Promise<{ default: ComponentType<P> }>) {
  return importFunc();
}

// Hook untuk conditional lazy loading
export function useLazyComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  condition: boolean = true
) {
  const [Component, setComponent] = React.useState<ComponentType<P> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    if (condition && !Component && !loading) {
      setLoading(true);
      importFunc()
        .then(module => {
          setComponent(() => module.default);
          setError(null);
        })
        .catch(err => {
          setError(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [condition, Component, loading, importFunc]);
  
  return { Component, loading, error };
}

export default withLazyLoading;
