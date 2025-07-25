// src/components/orders/components/ErrorBoundary.tsx
// Error boundary and error components for orders module

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ===========================================
// ERROR BOUNDARY COMPONENT
// ===========================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Orders ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Terjadi Kesalahan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Maaf, terjadi kesalahan saat memuat halaman pesanan. 
                Silakan coba lagi atau kembali ke halaman utama.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Error Details (Development):
                  </p>
                  <p className="text-xs text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Coba Lagi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Ke Beranda
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===========================================
// CONTEXT ERROR COMPONENT
// ===========================================

// export const ContextError: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Context Tidak Tersedia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            Tidak dapat mengakses context pesanan. Pastikan komponen ini 
            dibungkus dengan OrderProvider yang benar.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Penyebab umum:</strong><br/>
              • OrderProvider belum terpasang<br/>
              • Context tidak ter-provide dengan benar<br/>
              • Import path yang salah
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ===========================================
// PAGE LOADING COMPONENT
// ===========================================

export const PageLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Memuat Pesanan
          </h3>
          <p className="text-gray-600 text-center">
            Mohon tunggu sebentar, sedang memuat data pesanan...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// ===========================================
// SKELETON LOADERS
// ===========================================

export const TableSkeleton: React.FC = () => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </CardContent>
  </Card>
);

// ===========================================
// DIALOG LOADING COMPONENT
// ===========================================

export const DialogLoader: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      <p className="text-sm text-gray-600">Memuat dialog...</p>
    </div>
  </div>
);

// ===========================================
// EXPLICIT EXPORTS - Make sure all components are exported
// ===========================================

export default {
  ErrorBoundary,
  ContextError,
  PageLoading,
  TableSkeleton,
  CardSkeleton,
  DialogLoader
};