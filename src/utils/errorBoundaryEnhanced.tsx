// Enhanced Error Boundary dengan logging ke server
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

// Log error ke database untuk monitoring
async function logErrorToSupabase(error: Error, errorInfo: ErrorInfo, level: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('error_logs').insert({
      user_id: user?.id || 'anonymous',
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
      level,
      browser_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
  } catch (logError) {
    // Silent fail - jangan sampai error logging bikin app crash
    console.error('Failed to log error:', logError);
  }
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    
    // Log to Supabase for production monitoring
    if (!import.meta.env.DEV) {
      logErrorToSupabase(error, errorInfo, level);
    }
    
    // Save error details to localStorage for debugging
    const errorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch {
      // Silent fail
    }
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Call custom error handler if provided
    onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    // Clear all caches before reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    localStorage.removeItem('errorLogs');
    sessionStorage.clear();
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallbackComponent: FallbackComponent, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (FallbackComponent) {
        return <FallbackComponent error={error} resetError={this.resetError} />;
      }

      // Default fallback UI based on level
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
                Oops! Ada yang tidak beres
              </h1>
              <p className="mt-2 text-sm text-center text-gray-600">
                Aplikasi mengalami error. Silakan coba muat ulang atau kembali ke halaman utama.
              </p>
              {import.meta.env.DEV && (
                <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <summary className="cursor-pointer font-medium">Detail Error (Dev Only)</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
                </details>
              )}
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ke Beranda
                </Button>
              </div>
              {errorCount > 2 && (
                <p className="mt-4 text-xs text-center text-red-600">
                  Error berulang terdeteksi. Mohon hubungi support jika masalah berlanjut.
                </p>
              )}
            </div>
          </div>
        );
      }

      // Component level error
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Komponen mengalami error
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Bagian ini tidak dapat dimuat. 
              </p>
              <Button
                onClick={this.resetError}
                size="sm"
                variant="outline"
                className="mt-3"
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
