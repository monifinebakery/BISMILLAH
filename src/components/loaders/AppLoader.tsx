// src/components/loaders/AppLoader.tsx
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AppLoaderProps {
  title?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ 
  title 
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-50">
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="space-y-3">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-5 w-32 mx-auto" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    </div>
  </div>
);