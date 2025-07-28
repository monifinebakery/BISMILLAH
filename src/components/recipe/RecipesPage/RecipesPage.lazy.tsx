import { lazy, Suspense } from 'react';
import { RecipePageLoadingState } from '../shared/components/LoadingStates';

const RecipesPageComponent = lazy(() => import('./index'));

export const RecipesPageLazy: React.FC = () => {
  return (
    <Suspense fallback={<RecipePageLoadingState />}>
      <RecipesPageComponent />
    </Suspense>
  );
};

export default RecipesPageLazy;