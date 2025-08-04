// src/components/purchase/index.ts - Optimized Dependencies (8 → 4)
/**
 * Purchase Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 8 to 4
 */

// ✅ CORE COMPONENT: Main page component
export { default as PurchasePage } from './PurchasePage';

// ✅ ESSENTIAL CONTEXT: Provider and hook
export {
  PurchaseProvider,
  usePurchase
} from './context/PurchaseContext';

// ✅ CORE TYPES: Most commonly used types
export type {
  Purchase,
  PurchaseStatus,
  PurchaseItem,
  PurchaseContextType
} from './types/purchase.types';

// ✅ CONSOLIDATED: Single service export for external use
export { purchaseApi } from './services/purchaseApi';

// ❌ REMOVED - Reduce dependencies:
// - PurchaseTableProvider (internal use only in PurchasePage)
// - Individual component exports (use direct imports if needed)
// - Individual utility exports (use direct imports or purchaseApi methods)
// - Detailed types (import from ./types if needed)
// - Individual hook exports (use direct imports if needed)

// ✅ OPTIONAL: Advanced imports for power users (lazy-loaded)
export const PURCHASE_ADVANCED = {
  // Lazy load advanced modules only when needed
  context: () => import('./context'),
  components: () => import('./components'),
  utils: () => import('./utils'),
  types: () => import('./types/purchase.types'),
  hooks: () => import('./hooks'),
  services: () => import('./services')
} as const;

// ✅ INTERNAL: For migration and backward compatibility
export const PURCHASE_INTERNAL = {
  // Table context for internal component communication
  PurchaseTableProvider: () => import('./context/PurchaseTableContext').then(m => m.PurchaseTableProvider),
  // Core utilities frequently needed
  helpers: () => import('./utils/purchaseHelpers'),
  transformers: () => import('./utils/purchaseTransformers')
} as const;