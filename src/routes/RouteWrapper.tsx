import React from 'react';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';
import { AppError } from '@/components/loaders';

interface RouteWrapperProps {
  children: React.ReactNode;
  title?: string;
  specialErrorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
}

export const RouteWrapper: React.FC<RouteWrapperProps> = ({ children, title, specialErrorBoundary: SpecialErrorBoundary }) => {
  const ErrorBoundaryComponent = SpecialErrorBoundary || ErrorBoundary;

  return (
    <SafeSuspense 
      loadingMessage={`Memuat ${title || 'halaman'}...`} 
      size="lg"
      errorFallback={<AppError title={`Gagal Memuat ${title || 'Halaman'}`} />}
    >
      <ErrorBoundaryComponent>
        {children}
      </ErrorBoundaryComponent>
    </SafeSuspense>
  );
};

export default RouteWrapper;
