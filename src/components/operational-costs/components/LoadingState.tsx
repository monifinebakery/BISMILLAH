// src/components/operational-costs/components/LoadingState.tsx

import React from 'react';

interface LoadingStateProps {
  type?: 'list' | 'card' | 'table' | 'form';
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'list',
  rows = 3,
  showHeader = true,
  className = '',
}) => {
  const renderListSkeleton = () => (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index}>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCardSkeleton = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index}>
          <div className="bg-white p-6 rounded-lg border">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full mb-3"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`bg-white rounded-lg border ${className}`}>
      {showHeader && (
        <div className="border-b p-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              <div className="flex justify-end space-x-2">
                <div className="h-8 bg-gray-200 rounded w-8"></div>
                <div className="h-8 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className={`space-y-6 ${className}`}>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );

  switch (type) {
    case 'card':
      return renderCardSkeleton();
    case 'table':
      return renderTableSkeleton();
    case 'form':
      return renderFormSkeleton();
    case 'list':
    default:
      return renderListSkeleton();
  }
};

export default LoadingState;