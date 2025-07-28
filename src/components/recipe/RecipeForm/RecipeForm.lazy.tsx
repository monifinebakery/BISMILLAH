import { lazy, Suspense } from 'react';
import { RecipeFormSkeleton } from '../shared/components/LoadingStates';

const RecipeFormComponent = lazy(() => import('./index'));

export const RecipeFormLazy: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<RecipeFormSkeleton />}>
      <RecipeFormComponent {...props} />
    </Suspense>
  );
};

export default RecipeFormLazy