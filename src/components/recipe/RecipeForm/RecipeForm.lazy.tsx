// src/components/recipe/RecipeForm.lazy.tsx
import React, { lazy, Suspense } from 'react';
import { RecipeFormSkeleton } from './shared/components/LoadingStates';

const RecipeFormComponent = lazy(() => import('./RecipeForm'));

export const RecipeFormLazy: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<RecipeFormSkeleton />}>
      <RecipeFormComponent {...props} />
    </Suspense>
  );
};

export default RecipeFormLazy;