// src/pages/Recipes.tsx - Breadcrumb Navigation Implementation

import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChefHat, Plus, List } from 'lucide-react';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';
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
    <Suspense fallback={null}>
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
          <Suspense fallback={null}>
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
