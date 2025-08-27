// src/components/recipe/index.ts - Optimized Dependencies (13 → 6)
/**
 * Recipe Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 13 to 6
 */

import { lazy } from 'react';
import React from 'react';

// ✅ ESSENTIAL TYPES ONLY
export type {
  Recipe,
  NewRecipe,
  RecipeStats,
  RecipeSortField,
  BahanResep
} from './types';

// ✅ CORE SERVICE (most commonly used)
export { recipeApi } from './services/recipeApi';

// ✅ ESSENTIAL HOOKS (commonly used externally)
export { useRecipeOperations } from './hooks/useRecipeOperations';
export { useRecipeFiltering } from './hooks/useRecipeFiltering';
export { useRecipeStats } from './hooks/useRecipeStats';

// ✅ LAZY-LOADED MAIN COMPONENTS (better code splitting)
export const RecipeList = lazy(() => 
  import('./components/RecipeList').catch(() => ({
    default: () => React.createElement('div', { className: "p-4 text-center text-red-500" }, 'Gagal memuat daftar resep')
  }))
);

export const RecipeForm = lazy(() => 
  import('./components/RecipeForm').catch(() => ({
    default: () => React.createElement('div', { className: "p-4 text-center text-red-500" }, 'Gagal memuat form resep')
  }))
);

// ✅ ESSENTIAL SHARED COMPONENTS (frequently used externally)
export { default as RecipeCard } from './components/shared/RecipeCard';
export { default as LoadingState } from './components/shared/LoadingState';
export { default as EmptyState } from './components/shared/EmptyState';

// ❌ REMOVED - Reduce dependencies:
// - Individual service utils (use recipeApi.* or direct imports if needed)
// - Less commonly used hooks (import directly if needed)
// - Individual dialog components (use direct imports in components)
// - Internal utilities (access via recipeApi or direct import)
// - Constants (import directly from ./constants if needed)

// ✅ OPTIONAL: Advanced imports for power users (lazy-loaded)
export const RECIPE_ADVANCED = {
  // Lazy load advanced modules only when needed
  services: () => import('./services'),
  dialogs: () => import('./dialogs'),
  components: () => import('./components'),
  utils: () => import('./services/recipeUtils'),
  constants: () => import('./constants'),
  hooks: () => import('./hooks')
} as const;

// ✅ UTILITY: For migration and backward compatibility
export const RECIPE_LEGACY = {
  // Deprecated exports - will be removed in future versions
  // Use direct imports instead
} as const;