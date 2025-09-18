// 🎯 80 lines - All loading states
import React from 'react';

// Page Loading Component
export const PageLoading: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 mb-6 motion-safe:animate-pulse">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-300 rounded-xl"></div>
            <div>
              <div className="h-5 bg-gray-300 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-56"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 bg-gray-300 rounded w-28"></div>
            <div className="h-8 bg-gray-300 rounded w-28"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton (lite) */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4">
        <div className="space-y-3 motion-safe:animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <p className="text-sm text-gray-600">Memuat...</p>
      </div>
    </div>
  );
};

// Table Skeleton Component
export const TableSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
      <div className="p-4">
        <div className="space-y-3">
          {/* Header skeleton */}
          <div className="grid grid-cols-6 gap-3 motion-safe:animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          
          {/* Row skeletons (lite) */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-3">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-8 bg-gray-100 rounded"></div>
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
    <div className={`animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]}`}></div>
  );
};