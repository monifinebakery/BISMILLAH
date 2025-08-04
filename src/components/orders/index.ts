// src/components/orders/index.ts - Optimized Dependencies (9 → 4)
/**
 * Orders Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 9 to 4
 */

// ✅ CORE COMPONENT: Main page component
export { default as OrdersPage } from './components/OrdersPage';

// ✅ ESSENTIAL CONTEXT: Provider and hook
export { OrderProvider } from './context/OrderProvider';
export { useOrder } from './context/OrderContext';

// ✅ ESSENTIAL TYPES: Most commonly used types
export type {
  Order,
  NewOrder,
  OrderStatus,
  OrderItem
} from './types';

// ❌ REMOVED - Reduce dependencies (5+ exports removed):
// - useOrderData, useOrderUI (use direct imports if needed)
// - OrderStats, OrderFilters, OrderValidationResult types
// - All constants (ORDER_STATUSES, ORDER_STATUS_LABELS, etc.)
// - All utility functions (getStatusText, getStatusColor, etc.)
// - All detailed types (import from ./types if needed)
//
// Use direct imports if these are needed:
// import { useOrderData } from './hooks/useOrderData';
// import { ORDER_STATUSES } from './constants';

// ✅ OPTIONAL: Advanced imports for power users (lazy-loaded)
export const ORDERS_ADVANCED = {
  // All types for advanced usage
  types: () => import('./types'),
  
  // Constants and utilities
  constants: () => import('./constants'),
  utils: () => import('./utils'),
  
  // Component modules
  components: () => import('./components'),
  dialogs: () => import('./components/dialogs'),
  
  // Hook modules
  hooks: () => import('./hooks'),
  
  // Context modules
  context: () => import('./context')
} as const;

// ✅ HOOK UTILITIES: Grouped for convenience
export const ORDERS_HOOKS = {
  // Data management hooks
  data: () => import('./hooks/useOrderData').then(m => ({ useOrderData: m.useOrderData })),
  ui: () => import('./hooks/useOrderUI').then(m => ({ useOrderUI: m.useOrderUI })),
  
  // All hooks
  all: () => import('./hooks')
} as const;

// ✅ CONSTANTS AND UTILITIES: Grouped for convenience
export const ORDERS_UTILS = {
  // Status utilities
  status: () => import('./types').then(m => ({
    ORDER_STATUSES: m.ORDER_STATUSES,
    ORDER_STATUS_LABELS: m.ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS: m.ORDER_STATUS_COLORS,
    getStatusText: m.getStatusText,
    getStatusColor: m.getStatusColor
  })),
  
  // Recipe integration utilities
  recipe: () => import('./types').then(m => ({
    calculateRecipeStats: m.calculateRecipeStats,
    getRecipeUsageByOrder: m.getRecipeUsageByOrder
  })),
  
  // All constants
  constants: () => import('./constants'),
  
  // All utilities
  utils: () => import('./utils')
} as const;

// ✅ COMPONENT UTILITIES: For advanced component usage
export const ORDERS_COMPONENTS = {
  // Main components
  main: () => Promise.all([
    import('./components/OrdersPage'),
    import('./components/OrderTable'),
    import('./components/OrderDialogs')
  ]).then(([page, table, dialogs]) => ({
    OrdersPage: page.default,
    OrderTable: table.default,
    OrderDialogs: dialogs.default
  })),
  
  // Control components
  controls: () => Promise.all([
    import('./components/OrderControls'),
    import('./components/OrderFilters')
  ]).then(([controls, filters]) => ({
    OrderControls: controls.default,
    OrderFilters: filters.default
  })),
  
  // Dialog components
  dialogs: () => import('./components/dialogs'),
  
  // All components
  all: () => import('./components')
} as const;

// ✅ MIGRATION HELPER: For upgrading from full exports
export const ORDERS_MIGRATION = {
  instructions: `
    // OLD (full import - loads all utilities):
    import { useOrderData, ORDER_STATUSES } from '@/components/orders';
    
    // NEW (advanced import - lazy loaded):
    const { useOrderData } = await ORDERS_HOOKS.data();
    const { ORDER_STATUSES } = await ORDERS_UTILS.status();
    
    // OR (direct import - best performance):
    import { useOrderData } from '@/components/orders/hooks/useOrderData';
    import { ORDER_STATUSES } from '@/components/orders/constants';
  `,

  // Quick access to commonly needed items
  getCommonItems: async () => {
    const [hooks, utils] = await Promise.all([
      ORDERS_HOOKS.all(),
      ORDERS_UTILS.status()
    ]);

    return {
      useOrderData: hooks.useOrderData,
      useOrderUI: hooks.useOrderUI,
      ORDER_STATUSES: utils.ORDER_STATUSES,
      getStatusText: utils.getStatusText,
      getStatusColor: utils.getStatusColor
    };
  }
} as const;