// src/components/operational-costs/components/LoadingState.tsx

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-20" />
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
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-8 w-full mb-3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-6 w-16 rounded-full" />
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
            <Skeleton className="h-3" />
            <Skeleton className="h-3" />
            <Skeleton className="h-3" />
            <Skeleton className="h-3" />
            <Skeleton className="h-3" />
          </div>
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="grid grid-cols-5 gap-4 items-center">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
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
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <Skeleton className="h-10 w-24" />
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