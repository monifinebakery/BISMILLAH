import React from 'react';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import { AppLoader, AppError } from '@/components/loaders';

interface RouteWrapperProps {
  children: React.ReactNode;
  title?: string;
  specialErrorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
}

export const RouteWrapper: React.FC<RouteWrapperProps> = ({ children, title, specialErrorBoundary: SpecialErrorBoundary }) => {
  const ErrorBoundaryComponent = SpecialErrorBoundary || ErrorBoundary;

  return (
    <React.Suspense fallback={null}>
      <ErrorBoundaryComponent fallback={() => <AppError title={`Gagal Memuat ${title || 'Halaman'}`} />}>
        {children}
      </ErrorBoundaryComponent>
    </React.Suspense>
  );
};

export default RouteWrapper;
