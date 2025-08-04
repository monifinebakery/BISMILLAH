// src/components/orders/components/index.ts - Optimized Dependencies (4 → 2)
/**
 * Orders Components - Static Only Exports
 * 
 * HANYA components yang always loaded (essential components)
 * Dependencies reduced from 4 to 2
 */

// ✅ STATIC COMPONENTS ONLY (Always loaded)
export { default as OrdersPage } from './OrdersPage';
export { default as OrderTable } from './OrderTable';
export { default as OrderFilters } from './OrderFilters';
export { default as OrderControls } from './OrderControls';
export { default as RecipeAnalytics } from './RecipeAnalytics';

// ✅ SHARED COMPONENTS
export * from './shared';

// ❌ REMOVED: Heavy exports to reduce dependencies
// - OrderDialogs (use direct import for lazy loading)
// - dialogs subfolder exports (use direct imports)
// - Lazy-loaded component references

// ✅ NOTE: For lazy loading, import directly:
// const OrderDialogs = lazy(() => import('./OrderDialogs'));