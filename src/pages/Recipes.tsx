// src/pages/Recipes.tsx - Breadcrumb Navigation Implementation

import React, { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Plus, List } from 'lucide-react';

// Main navigation container
import RecipeNavigationContainer from '@/components/recipe/components/RecipeNavigationContainer';

// Loading fallback component
import { LoadingState } from '@/components/recipe/components/shared/LoadingState';

// Lazy loaded components for dialogs that might be needed at page level
const CategoryManagerDialog = React.lazy(() =>
  import('@/components/recipe/dialogs/CategoryManagerDialog')
    .catch(() => ({ default: () => <div>Error loading dialog</div> }))
);



// Main Recipes Component with Breadcrumb Navigation
const Recipes: React.FC = () => {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white shadow-lg mx-4 mt-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Manajemen Resep
              </h1>
              <p className="text-white text-opacity-90">
                Kelola resep dan hitung HPP dengan mudah
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-3">
            <Button
              onClick={() => setShowCategoryDialog(true)}
              className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
            >
              <List className="h-4 w-4" />
              Kelola Kategori
            </Button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-3 mt-6">
          <Button
            onClick={() => setShowCategoryDialog(true)}
            className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
          >
            <List className="h-4 w-4" />
            Kelola Kategori
          </Button>
        </div>
      </div>

      {/* Main Navigation Container */}
      <Suspense fallback={<LoadingState />}>
        <RecipeNavigationContainer />
      </Suspense>

      {/* Global Category Dialog */}
      <Suspense fallback={<div />}>
        {showCategoryDialog && (
          <CategoryManagerDialog
            isOpen={true}
            onOpenChange={() => setShowCategoryDialog(false)}
            recipes={[]} // Empty for now, will be populated by the dialog
            updateRecipe={async (id: string, data: any) => {
              // Implementation would go here if needed
              return true;
            }}
            refreshRecipes={() => {
              // Refresh will be handled by the navigation container
              window.location.reload();
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default Recipes;