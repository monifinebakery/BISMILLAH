import React from 'react';
import { logger } from '@/utils/logger';

// Lazy loaded components with error handling
export const DeleteRecipeDialog = React.lazy(() =>
  import('../dialogs/DeleteRecipeDialog')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load DeleteRecipeDialog:', error);
      return { default: () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-red-600">Error loading dialog</p>
          </div>
        </div>
      )};
    })
);

export const DuplicateRecipeDialog = React.lazy(() =>
  import('../dialogs/DuplicateRecipeDialog')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load DuplicateRecipeDialog:', error);
      return { default: () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-red-600">Error loading dialog</p>
          </div>
        </div>
      )};
    })
);

export const CategoryManagerDialog = React.lazy(() =>
  import('../dialogs/CategoryManagerDialog')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load CategoryManagerDialog:', error);
      return { default: () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-red-600">Error loading dialog</p>
          </div>
        </div>
      )};
    })
);

export const RecipeTable = React.lazy(() =>
  import('./RecipeList/RecipeTable')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load RecipeTable:', error);
      return { default: () => (
        <div className="p-6 text-center">
          <p className="text-red-600">Error loading table</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Reload Page
          </button>
        </div>
      )};
    })
);

export const RecipeFilters = React.lazy(() =>
  import('./RecipeList/RecipeFilters')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load RecipeFilters:', error);
      return { default: () => (
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-red-600">Error loading filters</p>
        </div>
      )};
    })
);

export const RecipeStats = React.lazy(() =>
  import('./RecipeList/RecipeStats')
    .then(module => ({ default: module.default }))
    .catch(error => {
      logger.error('Failed to load RecipeStats:', error);
      return { default: () => (
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-red-600">Error loading stats</p>
        </div>
      )};
    })
);

// Wrapper component
export const LazyComponentWrapper: React.FC<{ children: React.ReactNode; loadingMessage?: string }> = ({ children, loadingMessage }) => {
  return (
    <React.Suspense fallback={<div className="animate-pulse p-4 bg-gray-100 rounded">{loadingMessage || 'Loading...'}</div>}>
      {children}
    </React.Suspense>
  );
};
