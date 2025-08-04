// src/components/purchase/index.ts - Optimized Dependencies (5 → 3)
/**
 * Purchase Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 5 to 3
 */

// ✅ CORE EXPORTS ONLY
export { default as PurchasePage } from './PurchasePage';

// ✅ ESSENTIAL CONTEXT
export {
  PurchaseProvider,
  usePurchase
} from './context/PurchaseContext';

// ✅ ESSENTIAL TYPES ONLY
export type {
  Purchase,
  PurchaseStatus,
  PurchaseContextType
} from './types/purchase.types';

// ❌ REMOVED - Reduce dependencies:
// - PurchaseTableProvider (internal use only)
// - All individual components (use direct imports if needed)
// - All utility functions (use direct imports)
// - Detailed types (import from ./types if needed)

// ✅ OPTIONAL: Advanced imports for power users
export const PURCHASE_ADVANCED = {
  context: () => import('./context'),
  components: () => import('./components'),
  utils: () => import('./utils'),
  types: () => import('./types/purchase.types'),
  hooks: () => import('./hooks')
} as const;