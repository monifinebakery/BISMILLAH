// src/components/recipe/shared/components/LoadingStates.tsx

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calculator, Package } from 'lucide-react';

/**
 * Loading skeleton for recipe table rows
 */
export const RecipeTableRowSkeleton: React.FC = () => (
  <tr className="hover:bg-gray-50/50">
    <td className="p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </td>
    <td className="p-4">
      <Skeleton className="h-6 w-20" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-12" />
    </td>
    <td className="p-4 text-right">
      <Skeleton className="h-4 w-20 ml-auto" />
    </td>
    <td className="p-4 text-right">
      <Skeleton className="h-4 w-16 ml-auto" />
    </td>
    <td className="p-4 text-right">
      <Skeleton className="h-4 w-20 ml-auto" />
    </td>
    <td className="p-4 text-right">
      <Skeleton className="h-4 w-16 ml-auto" />
    </td>
    <td className="p-4 text-right">
      <div className="space-y-1">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </td>
    <td className="p-4 text-right">
      <div className="flex justify-end gap-1">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </td>
  </tr>
);

/**
 * Loading skeleton for recipe table
 */
export const RecipeTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-4">
    {/* Controls skeleton */}
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>

    {/* Table skeleton */}
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b">
                {Array.from({ length: 9 }).map((_, i) => (
                  <th key={i} className="p-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <RecipeTableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Loading skeleton for stats cards
 */
export const StatsCardSkeleton: React.FC = () => (
  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Loading skeleton for stats cards grid
 */
export const StatsCardsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <StatsCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Loading skeleton for recipe form
 */
export const RecipeFormSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Basic info section */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>

    {/* Ingredients section */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Pricing section */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-20" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Full page loading state
 */
export const RecipePageLoadingState: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <StatsCardsSkeleton />

      {/* Main content skeleton */}
      <RecipeTableSkeleton />
    </div>
  </div>
);

/**
 * Empty state when no recipes found
 */
export const EmptyRecipeState: React.FC<{ onCreateFirst: () => void }> = ({ onCreateFirst }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-gray-100 p-6 rounded-full mb-4">
      <BookOpen className="h-12 w-12 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada resep</h3>
    <p className="text-gray-600 mb-6 max-w-md">
      Mulai buat resep pertama Anda dan kelola kalkulasi HPP dengan mudah
    </p>
    <button
      onClick={onCreateFirst}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
    >
      <BookOpen className="h-4 w-4" />
      Buat Resep Pertama
    </button>
  </div>
);

/**
 * Search no results state
 */
export const NoSearchResultsState: React.FC<{ searchTerm: string; onClearSearch: () => void }> = ({ 
  searchTerm, 
  onClearSearch 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-gray-100 p-6 rounded-full mb-4">
      <Package className="h-12 w-12 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ditemukan</h3>
    <p className="text-gray-600 mb-6 max-w-md">
      Tidak ada resep yang cocok dengan pencarian "{searchTerm}"
    </p>
    <button
      onClick={onClearSearch}
      className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
    >
      Hapus Filter
    </button>
  </div>
);

/**
 * Error state component
 */
export const ErrorState: React.FC<{ 
  message?: string; 
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({ 
  message = "Terjadi kesalahan saat memuat data", 
  onRetry,
  showRetry = true 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-red-100 p-6 rounded-full mb-4">
      <Package className="h-12 w-12 text-red-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops!</h3>
    <p className="text-gray-600 mb-6 max-w-md">{message}</p>
    {showRetry && onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Coba Lagi
      </button>
    )}
  </div>
);

/**
 * Generic loading spinner
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-orange-200 border-t-orange-500 ${sizeClasses[size]} ${className}`} />
  );
};

/**
 * Inline loading state for buttons
 */
export const ButtonLoadingState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="sm" />
    {children}
  </div>
);