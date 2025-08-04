// src/components/orders/index.ts - Optimized Dependencies (8 → 4)
/**
 * Orders Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 8 to 4
 */

// ✅ CORE EXPORTS ONLY
export { default as OrdersPage } from './components/OrdersPage';

// ✅ ESSENTIAL CONTEXT
export { OrderProvider } from './context/OrderProvider';
export { useOrder } from './context/OrderContext';

// ✅ ESSENTIAL HOOKS
export { useOrderData, useOrderUI } from './hooks';

// ✅ ESSENTIAL TYPES ONLY
export type {
  Order,
  NewOrder,
  OrderStatus
} from './types';

// ❌ REMOVED - Reduce dependencies:
// - All detailed types (use direct imports if needed)
// - All constants (use direct imports if needed)
// - All utilities (use direct imports if needed)
// - Individual hook exports (now consolidated)

// ✅ OPTIONAL: Advanced imports for power users
export const ORDERS_ADVANCED = {
  types: () => import('./types'),
  constants: () => import('./constants'),
  utils: () => import('./utils'),
  components: () => import('./components'),
  dialogs: () => import('./components/dialogs')
} as const;