// components/LoadingStates.tsx - Loading & Error States

import React from 'react';
import { 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  Server, 
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Zap
} from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  text?: string;
  className?: string;
}

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  type?: 'network' | 'server' | 'notFound' | 'unauthorized' | 'generic';
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
  className?: string;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

interface StatusBadgeProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'info';
  text: string;
  size?: 'sm' | 'md';
  className?: string;
}

// ⏳ Loading Spinner Component
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  className = ""
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-orange-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
      {text && (
        <p className={`text-gray-600 ${textSizeClasses[size]} text-center`}>
          {text}
        </p>
      )}
    </div>
  );
};

// 💀 Skeleton Component for loading placeholders
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = ""
}) => {
  const baseClasses = "bg-gray-200 animate-pulse";

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4 rounded`}
            style={{
              width: width || (index === lines - 1 ? '75%' : '100%'),
              height: height || '1rem'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{
          width: width || '3rem',
          height: height || '3rem'
        }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} rounded-lg p-4 space-y-3 ${className}`}>
        <div className="flex items-center space-y-0 space-x-4">
          <div className="bg-gray-300 rounded-full h-10 w-10"></div>
          <div className="space-y-2 flex-1">
            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
            <div className="bg-gray-300 h-3 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="bg-gray-300 h-4 rounded"></div>
          <div className="bg-gray-300 h-4 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} rounded ${className}`}
      style={{
        width: width || '100%',
        height: height || '2rem'
      }}
    />
  );
};

// 🚨 Error State Component
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  type = 'generic',
  onRetry,
  retryText = 'Coba Lagi',
  showIcon = true,
  className = ""
}) => {
  const getIconAndContent = () => {
    switch (type) {
      case 'network':
        return {
          icon: <WifiOff className="h-12 w-12 text-red-400" />,
          defaultTitle: 'Koneksi Bermasalah',
          defaultMessage: 'Periksa koneksi internet Anda dan coba lagi'
        };
      case 'server':
        return {
          icon: <Server className="h-12 w-12 text-red-400" />,
          defaultTitle: 'Server Error',
          defaultMessage: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi'
        };
      case 'notFound':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-yellow-400" />,
          defaultTitle: 'Tidak Ditemukan',
          defaultMessage: 'Data yang Anda cari tidak ditemukan'
        };
      case 'unauthorized':
        return {
          icon: <XCircle className="h-12 w-12 text-red-400" />,
          defaultTitle: 'Akses Ditolak',
          defaultMessage: 'Anda tidak memiliki izin untuk mengakses halaman ini'
        };
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-red-400" />,
          defaultTitle: 'Terjadi Kesalahan',
          defaultMessage: 'Terjadi kesalahan yang tidak terduga'
        };
    }
  };

  const { icon, defaultTitle, defaultMessage } = getIconAndContent();

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {showIcon && (
        <div className="mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || defaultTitle}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message || defaultMessage}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
        >
          <RefreshCw className="h-4 w-4" />
          {retryText}
        </button>
      )}
    </div>
  );
};

// 🚫 Empty State Component
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {icon && (
        <div className="mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// 📊 Progress Component
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary',
  className = ""
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-orange-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// 🏷️ Status Badge Component
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'md',
  className = ""
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          icon: <XCircle className="h-3 w-3" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          icon: <Info className="h-3 w-3" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: null,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const { icon, bgColor, textColor, borderColor } = getStatusConfig();

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full border font-medium
      ${sizeClasses[size]} ${bgColor} ${textColor} ${borderColor} ${className}
    `}>
      {icon}
      {text}
    </span>
  );
};

// 🎭 Loading Overlay Component
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  text?: string;
  className?: string;
}> = ({
  isVisible,
  text = "Memuat...",
  className = ""
}) => {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 ${className}`}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

// 📱 Skeleton Loaders for specific components
export const PromoCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
          <div className="flex-1 space-y-2">
            <Skeleton width="75%" height="1rem" />
            <Skeleton width="50%" height="0.75rem" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="space-y-1">
            <Skeleton width="40%" height="0.75rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
          <div className="space-y-1">
            <Skeleton width="40%" height="0.75rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
        </div>
        <div className="flex justify-between">
          <Skeleton width="30%" height="0.75rem" />
          <Skeleton width="25%" height="1.5rem" />
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="60%" height="1rem" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="80%" height="1rem" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// 🎯 Timeout Component
export const TimeoutState: React.FC<{
  onRetry: () => void;
  timeout?: number;
  className?: string;
}> = ({
  onRetry,
  timeout = 30,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <Clock className="h-12 w-12 text-yellow-400 mb-4" />
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Koneksi Timeout
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        Permintaan membutuhkan waktu lebih dari {timeout} detik. Silakan coba lagi.
      </p>
      
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
      >
        <RefreshCw className="h-4 w-4" />
        Coba Lagi
      </button>
    </div>
  );
};

// 🚀 Performance Component
export const PerformanceIndicator: React.FC<{
  isOptimized: boolean;
  metrics?: {
    loadTime: number;
    renderTime: number;
  };
  className?: string;
}> = ({
  isOptimized,
  metrics,
  className = ""
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOptimized 
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        <Zap className="h-3 w-3" />
        {isOptimized ? 'Optimal' : 'Perlu Optimasi'}
      </div>
      
      {metrics && (
        <div className="text-xs text-gray-500">
          Load: {metrics.loadTime}ms | Render: {metrics.renderTime}ms
        </div>
      )}
    </div>
  );
};

export default {
  LoadingSpinner,
  Skeleton,
  ErrorState,
  EmptyState,
  Progress,
  StatusBadge,
  LoadingOverlay,
  PromoCardSkeleton,
  TableSkeleton,
  TimeoutState,
  PerformanceIndicator
};