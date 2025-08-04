// src/components/recipe/index.ts - Optimized Dependencies (13 → 6)
/**
 * Recipe Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 13 to 6
 */

import { lazy } from 'react';

// ✅ ESSENTIAL TYPES ONLY
export * from './types';

// ✅ CORE SERVICE
export { recipeApi } from './services/recipeApi';

// ✅ CONSOLIDATED HOOKS (single import)
export * from './hooks';

// ✅ LAZY-LOADED MAIN COMPONENTS
export const RecipeList = lazy(() => import('./components/RecipeList'));
export const RecipeForm = lazy(() => import('./components/RecipeForm'));

// ✅ ESSENTIAL SHARED COMPONENTS (frequently used)
export { default as RecipeCard } from './components/shared/RecipeCard';
export { default as LoadingState } from './components/shared/LoadingState';
export { default as EmptyState } from './components/shared/EmptyState';

// ❌ REMOVED - Reduce dependencies:
// - Individual service utils (use direct imports if needed)
// - Individual hook exports (now consolidated in ./hooks)
// - Lazy-loaded dialogs (use direct imports in components)

// ✅ OPTIONAL: Advanced imports for power users
export const RECIPE_ADVANCED = {
  services: () => import('./services'),
  dialogs: () => import('./dialogs'),
  components: () => import('./components')
} as const;