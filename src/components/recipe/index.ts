// src/components/recipe/index.ts
// Main exports for recipe components with dynamic imports

import { lazy } from 'react';

// Types
export * from './types';

// Services
export { recipeApi } from './services/recipeApi';
export * from './services/recipeUtils';

// Hooks
export { useRecipeOperations } from './hooks/useRecipeOperations';
export { useRecipeFiltering } from './hooks/useRecipeFiltering';
export { useRecipeStats } from './hooks/useRecipeStats';

// Lazy-loaded components for code splitting
export const RecipeList = lazy(() => import('./components/RecipeList'));
export const RecipeForm = lazy(() => import('./components/RecipeForm'));

// Lazy-loaded dialogs
export const DeleteRecipeDialog = lazy(() => import('./dialogs/DeleteRecipeDialog'));
export const DuplicateRecipeDialog = lazy(() => import('./dialogs/DuplicateRecipeDialog'));
export const CategoryManagerDialog = lazy(() => import('./dialogs/CategoryManagerDialog'));

// Shared components (not lazy - used frequently)
export { default as RecipeCard } from './components/shared/RecipeCard';
export { default as LoadingState } from './components/shared/LoadingState';
export { default as EmptyState } from './components/shared/EmptyState';