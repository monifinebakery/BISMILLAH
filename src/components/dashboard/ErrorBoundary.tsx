// src>components>dashboard>ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Dashboard ErrorBoundary caught error:', {
      error,
      errorInfo,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    } else {
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-red-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Terjadi Kesalahan
              </h1>
              <p className="text-gray-600 mb-6">
                Dashboard mengalami masalah. Jangan khawatir, data Anda aman.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Detail Error:</h3>
                  <p className="text-xs text-red-600 font-mono break-all">
                    {this.state.error instanceof Error ? this.state.error.message : String(this.state.error)}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">Component Stack</summary>
                      <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi ({this.maxRetries - this.retryCount} tersisa)
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  variant={this.retryCount < this.maxRetries ? 'outline' : 'default'}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang Halaman
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Jika masalah berlanjut, silakan hubungi support atau coba lagi nanti.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
