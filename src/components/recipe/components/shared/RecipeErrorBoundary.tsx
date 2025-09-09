// src/components/recipe/components/shared/RecipeErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class RecipeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RecipeErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // You can log the error to an error reporting service here
    if (typeof window !== 'undefined') {
      // Log to console for debugging
      console.group('🔥 Recipe Component Error');
      console.error('Error:', error.message);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Stack:', error.stack);
      console.groupEnd();
    }
  }

  private handleRefresh = () => {
    // Reset error state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Terjadi Kesalahan
              </h2>
              
              <p className="text-gray-600 mb-4 text-sm">
                {this.state.error?.message || 'Komponen gagal dimuat. Silakan coba lagi.'}
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={this.handleRefresh}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Reload Halaman
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                    Detail Error (Development)
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RecipeErrorBoundary;
