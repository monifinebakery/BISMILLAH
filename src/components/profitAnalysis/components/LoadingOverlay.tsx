// src/components/profitAnalysis/components/LoadingOverlay.tsx
// Unified loading overlay for profit analysis operations

import React from 'react';
import { RefreshCw, BarChart3 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
  description?: string;
  type?: 'analysis' | 'calculation' | 'refresh' | 'dateRange' | 'wac';
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message,
  description,
  type = 'analysis',
  className = ''
}) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'refresh':
        return <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />;
      case 'calculation':
        return <BarChart3 className="w-8 h-8 text-orange-500 animate-pulse" />;
      case 'wac':
        return (
          <div className="relative">
            <div className="w-8 h-8 border-4 border-orange-200 rounded-full" />
            <div className="absolute top-0 left-0 w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        );
      default:
        return (
          <div className="relative">
            <div className="w-8 h-8 border-4 border-orange-200 rounded-full" />
            <div className="absolute top-0 left-0 w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="text-center max-w-sm mx-4">
        <div className="mb-6 flex justify-center">
          {getIcon()}
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {message}
        </h3>
        
        {description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {description}
          </p>
        )}
        
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
