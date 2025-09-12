// src/components/loaders/AppLoader.tsx
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AppLoaderProps {
  title?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ 
  title = "Memuat aplikasi..." 
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-50">
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      <div className="text-center space-y-2">
        <Skeleton className="h-5 w-32 mx-auto" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    </div>
  </div>
);