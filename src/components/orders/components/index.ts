// src/components/orders/components/index.ts - Optimized Dependencies (6 → 4)
/**
 * Orders Components - Essential Components Only
 * 
 * HANYA components yang essential untuk external consumers
 * Dependencies reduced from 6 to 4 - better code splitting
 */

// ✅ STATIC COMPONENTS: Always loaded (core components)
export { default as OrdersPage } from './OrdersPage';
export { default as OrderTable } from './OrderTable';

// ✅ CONTROL COMPONENTS: Commonly used together
export { default as OrderFilters } from './OrderFilters';
export { default as OrderControls } from './OrderControls';
export { default as ImportButton } from './ImportButton';

// ❌ REMOVED - Reduce dependencies:
// - RecipeAnalytics (import directly if needed)
// - OrderDialogs (use direct import for better lazy loading)
// - shared/* exports (use direct imports)
//
// For better performance, import these directly where needed:
// import RecipeAnalytics from './RecipeAnalytics';
// import OrderDialogs from './OrderDialogs';
// import { DialogLoader } from './shared/LoadingStates';

// ✅ LAZY COMPONENT REFERENCES: For documentation and lazy loading
export const ORDERS_COMPONENTS_LAZY = {
  // Heavy components - lazy load on demand
  OrderDialogs: () => import('./OrderDialogs'),
  RecipeAnalytics: () => import('./RecipeAnalytics'),
  
  // Shared utilities
  shared: () => import('./shared')
} as const;

// ✅ COMPONENT GROUPS: For batch loading
export const ORDERS_COMPONENT_GROUPS = {
  // Core components - main functionality
  core: () => Promise.all([
    import('./OrdersPage'),
    import('./OrderTable')
  ]),
  
  // Control components - filters and actions
  controls: () => Promise.all([
    import('./OrderFilters'),
    import('./OrderControls')
  ]),
  
  // Extended components - analytics and dialogs
  extended: () => Promise.all([
    import('./OrderDialogs'),
    import('./RecipeAnalytics')
  ]),
  
  // All components - for preloading
  all: () => Promise.all(Object.values(ORDERS_COMPONENTS_LAZY).map(fn => fn()))
} as const;

// ✅ SHARED UTILITIES: Grouped access
export const ORDERS_SHARED = {
  // Loading components
  loading: () => import('./shared/LoadingStates'),
  
  // All shared utilities
  all: () => import('./shared')
} as const;

// ✅ MIGRATION HELPER: For upgrading from full exports
export const ORDERS_COMPONENTS_MIGRATION = {
  instructions: `
    // OLD (barrel import - loads all components):
    import { OrderDialogs, RecipeAnalytics } from '@/components/orders/components';
    
    // NEW (direct import - better code splitting):
    import OrderDialogs from '@/components/orders/components/OrderDialogs';
    import RecipeAnalytics from '@/components/orders/components/RecipeAnalytics';
    
    // OR (lazy import - best performance):
    const OrderDialogs = React.lazy(() => import('@/components/orders/components/OrderDialogs'));
    const RecipeAnalytics = React.lazy(() => import('@/components/orders/components/RecipeAnalytics'));
    
    // OR (group import - batch loading):
    const { OrderDialogs, RecipeAnalytics } = await ORDERS_COMPONENT_GROUPS.extended();
  `,
  
  // Quick component access
  getLazyComponent: (componentName: keyof typeof ORDERS_COMPONENTS_LAZY) => {
    return ORDERS_COMPONENTS_LAZY[componentName];
  }
} as const;