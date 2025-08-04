// src/components/orders/components/index.ts
// 🎯 Components only - NO context/hooks exports

// Main page component
export { default as OrdersPage } from './OrdersPage';

// Core components
export { default as OrderTable } from './OrderTable';
export { default as OrderFilters } from './OrderFilters';
export { default as OrderControls } from './OrderControls';
export { default as RecipeAnalytics } from './RecipeAnalytics';

// Lazy-loaded dialog exports (dynamic imports)
export const OrderDialogs = () => import('./OrderDialogs');

// Re-export from dialogs subfolder (not duplicating here)
export * from './dialogs';

// Re-export from shared subfolder
export * from './shared';