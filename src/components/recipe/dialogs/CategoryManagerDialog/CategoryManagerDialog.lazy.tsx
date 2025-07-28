import { lazy } from 'react';

export const CategoryManagerDialogLazy = lazy(() => 
  import('./index').then(module => ({ default: module.CategoryManagerDialog }))
);