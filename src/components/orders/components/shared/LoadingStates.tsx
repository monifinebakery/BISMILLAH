// 🎯 80 lines - All loading states
import React from 'react';

// Page Loading Component
export const PageLoading: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-gray-500 to-gray-500 rounded-xl p-6 mb-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-xl"></div>
            <div>
              <div className="h-6 bg-gray-500 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-500 rounded w-64"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-500 rounded w-32"></div>
            <div className="h-10 bg-gray-500 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-gray-500/80 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-500 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Dialog Loader Component
export const DialogLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b border-orange-500"></div>
        <p className="text-sm text-gray-600">Memuat...</p>
      </div>
    </div>
  );
};

// Table Skeleton Component
export const TableSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-500/80 overflow-hidden">
      <div className="p-6">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-500 rounded animate-pulse"></div>
            ))}
          </div>
          
          {/* Row skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-8 bg-gray-400 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Button Loading Component
export const ButtonLoading: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`animate-spin rounded-full border-b border-current ${sizeClasses[size]}`}></div>
  );
};