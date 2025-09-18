// src/pages/Recipes.tsx - Breadcrumb Navigation Implementation

import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChefHat, Plus, List } from 'lucide-react';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

// Main navigation container
import RecipeNavigationContainer from '@/components/recipe/components/RecipeNavigationContainer';
// Warehouse provider for recipe ingredients
import { WarehouseProvider } from '@/components/warehouse/context/WarehouseContext';

// Loading fallback component
import { LoadingState } from '@/components/recipe/components/shared/LoadingState';
import RecipeErrorBoundary from '@/components/recipe/components/shared/RecipeErrorBoundary';

// Safe lazy component wrapper
const SafeLazyWrapper: React.FC<{ children: React.ReactNode; loadingMessage?: string }> = ({ children, loadingMessage }) => {
  return (
    <Suspense fallback={
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-6 w-32" />
      </div>
    }>
      {children}
    </Suspense>
  );
};




// Main Recipes Component with Breadcrumb Navigation
const Recipes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <RecipeErrorBoundary>
      <div className="min-h-screen bg-white">

        {/* Main Navigation Container */}
        <RecipeErrorBoundary>
          <Suspense fallback={
            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-96" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          }>
            <WarehouseProvider>
              <RecipeNavigationContainer />
            </WarehouseProvider>
          </Suspense>
        </RecipeErrorBoundary>

      </div>
    </RecipeErrorBoundary>
  );
};

export default Recipes;
