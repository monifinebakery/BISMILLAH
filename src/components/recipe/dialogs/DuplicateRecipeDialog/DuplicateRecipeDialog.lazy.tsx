import { lazy } from 'react';

export const DuplicateRecipeDialogLazy = lazy(() => 
  import('./index').then(module => ({ default: module.DuplicateRecipeDialog }))
);