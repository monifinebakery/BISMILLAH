// 🎯 80 lines - All loading states
import React from 'react';

// Page Loading Component (compact)
import { LoadingSpinner } from '@/components/ui/loading-spinner';
export const PageLoading: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-xl border border-gray-200/80 p-8 flex items-center justify-center">
        <LoadingSpinner size="md" showText text="Memuat halaman..." />
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

// Table Loading Component (compact)
export const TableLoading: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
      <div className="p-6 flex items-center justify-center">
        <LoadingSpinner size="sm" showText text="Memuat tabel..." />
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