// src/components/orders/components/LoadingStates.tsx
import React, { Component } from 'react';
import { AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Terjadi Kesalahan</span>
          </div>
          <p className="text-sm text-red-600 mb-3">
            {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga'}
          </p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Coba Lagi
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading spinner component
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Memuat data...', 
  size = 'md',
  className = ''
}) => {
  const iconSize = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Loader2 className={`${iconSize[size]} animate-spin text-orange-500`} />
      <span className="text-gray-600 font-medium text-sm">{message}</span>
    </div>
  );
};

// Full page loading component
export const PageLoading: React.FC<{ message?: string }> = ({ 
  message = 'Memuat data pesanan...' 
}) => {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message={message} size="lg" />
      </div>
    </div>
  );
};

// Table loading component
export const TableLoading: React.FC = () => {
  return (
    <div className="text-center py-12">
      <LoadingSpinner message="Memuat data pesanan..." size="md" />
    </div>
  );
};