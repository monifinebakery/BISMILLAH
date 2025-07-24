// components/promo/PromoErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Calculator, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string;
}

class PromoErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `promo_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `promo_error_${Date.now()}`
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`🚨 PromoErrorBoundary - ${this.props.componentName || 'Unknown Component'}:`, {
      error,
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString()
    });
    
    this.setState({
      error,
      errorInfo
    });

    // 📊 Report to error tracking service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: any) => {
    // Send to error tracking service (Sentry, Bugsnag, etc.)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component: this.props.componentName || 'PromoComponent',
          errorId: this.state.errorId,
          stack: error.stack
        }
      });
    }
  };

  // 🔄 Retry mechanism
  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        errorId: this.generateErrorId() 
      });
      
      // Call parent reset if provided
      if (this.props.onReset) {
        this.props.onReset();
      }
    } else {
      // 🔃 Force page reload if too many retries
      window.location.reload();
    }
  };

  // 📄 Reload component
  private handleReload = () => {
    window.location.reload();
  };

  // 🏠 Back to main
  private handleBackToMain = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: this.generateErrorId() 
    });
  };

  render() {
    if (this.state.hasError) {
      // 🎨 Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 🚨 Default error UI for Promo components
      return (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Komponen Promo Bermasalah
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="text-center">
              {/* 🎯 Error Icon */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Calculator className="w-8 h-8 text-red-600" />
              </div>

              {/* 📝 Error Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {this.props.componentName || 'Komponen Promo'} Mengalami Masalah
              </h3>
              <p className="text-gray-600 mb-6">
                Terjadi kesalahan saat memuat komponen. Data perhitungan Anda tetap aman.
              </p>

              {/* 🔧 Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">
                    🐛 Debug Info (Dev Only):
                  </h4>
                  <div className="text-xs text-red-600 font-mono space-y-1">
                    <div><strong>Error:</strong> {this.state.error.message}</div>
                    <div><strong>Component:</strong> {this.props.componentName || 'Unknown'}</div>
                    <div><strong>Error ID:</strong> {this.state.errorId}</div>
                    <div><strong>Retry Count:</strong> {this.retryCount}/{this.maxRetries}</div>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">Component Stack</summary>
                      <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* 🎯 Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {this.retryCount < this.maxRetries && (
                  <Button 
                    onClick={this.handleRetry}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Coba Lagi ({this.maxRetries - this.retryCount} tersisa)
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleBackToMain}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Reset Komponen
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant={this.retryCount < this.maxRetries ? 'outline' : 'default'}
                  className="border-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang Halaman
                </Button>
              </div>

              {/* 💡 Help Text */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tips:</strong> Jika masalah berlanjut, coba refresh halaman atau hubungi support. 
                  Error ID: <code className="font-mono bg-blue-100 px-1 rounded">{this.state.errorId}</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// 🎯 HOC untuk wrapping komponen dengan error boundary
export const withPromoErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PromoErrorBoundary componentName={componentName}>
      <Component {...props} />
    </PromoErrorBoundary>
  );

  WrappedComponent.displayName = `withPromoErrorBoundary(${Component.displayName || Component.name || componentName || 'Component'})`;
  
  return WrappedComponent;
};

export default PromoErrorBoundary;