// src/components/loaders/AppLoader.tsx
import React from 'react';

interface AppLoaderProps {
  title?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ 
  title = "Memuat aplikasi..." 
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-50">
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b border-orange-500"></div>
      <div className="text-center">
        <p className="text-base font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-500 mt-1">Sedang memuat...</p>
      </div>
    </div>
  </div>
);