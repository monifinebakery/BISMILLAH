// src/components/recipe/RecipesPage.lazy.tsx
import React, { lazy, Suspense } from 'react';
import { RecipePageLoadingState } from './shared/components/LoadingStates';

const RecipesPageComponent = lazy(() => import('./RecipesPage'));

export const RecipesPageLazy: React.FC = () => {
  return (
    <Suspense fallback={<RecipePageLoadingState />}>
      <RecipesPageComponent />
    </Suspense>
  );
};

export default RecipesPageLazy;