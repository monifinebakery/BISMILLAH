// src/components/common/UniversalErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { logger } from '@/utils/logger';

// Loading fallback component dengan skeleton
const UniversalLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-32', 
    lg: 'h-64'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center p-4`}>
      <div className="text-center space-y-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
      </div>
    </div>
  );
};

// Error fallback component
const ErrorFallback: React.FC<{
  error?: Error;
  resetError: () => void;
  isMinimal?: boolean;
}> = ({ error, resetError, isMinimal = false }) => {
  const handleHomeNavigation = () => {
    window.location.href = '/dashboard';
  };

  if (isMinimal) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
        <p className="text-sm text-red-800 mb-3">Terjadi kesalahan</p>
        <Button onClick={resetError} size="sm" className="bg-red-600 hover:bg-red-700">
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Terjadi Kesalahan
        </h2>
        
        <p className="text-gray-600 mb-4 text-sm">
          {error?.message || 'Komponen gagal dimuat. Silakan coba lagi.'}
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={resetError}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
          
          <Button
            onClick={handleHomeNavigation}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Detail Error (Development)
            </summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  minimal?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

// Main error boundary class
class UniversalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    logger.error('Universal Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler:', handlerError);
      }
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error reporting logic here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          isMinimal={this.props.minimal}
        />
      );
    }

    return this.props.children;
  }
}

// Suspense wrapper with error boundary
interface SafeSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  loadingMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  minimal?: boolean;
}

export const SafeSuspense: React.FC<SafeSuspenseProps> = ({
  children,
  fallback,
  errorFallback,
  loadingMessage,
  size = 'md',
  minimal = false
}) => {
  // Default to no visual fallback to avoid long-lived skeletons
  const defaultFallback = fallback ?? null;

  return (
    <UniversalErrorBoundary fallback={errorFallback} minimal={minimal}>
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </UniversalErrorBoundary>
  );
};

// Utility hook for programmatic error handling
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);
  
  const resetError = React.useCallback(() => setError(null), []);
  
  const captureError = React.useCallback((error: Error) => {
    logger.error('Programmatic error captured:', error);
    setError(error);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

export { UniversalLoader, ErrorFallback };
export default UniversalErrorBoundary;
