// 🔥 REFACTORED - Using Modular Components

import React, { Suspense } from 'react';
import { RecipePageLoadingState } from '@/components/recipe/shared/components/LoadingStates';

// Lazy load the main component for better code splitting
const RecipesPageComponent = React.lazy(() => import('@/components/recipe/RecipesPage'));

const RecipesPage: React.FC = () => {
  return (
    <Suspense fallback={<RecipePageLoadingState />}>
      <RecipesPageComponent />
    </Suspense>
  );
};

export default RecipesPage;