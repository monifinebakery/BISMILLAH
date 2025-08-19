// src/components/purchase/hooks/index.ts - Optimized Dependencies (8 → 4)
/**
 * Purchase Hooks - Clean Barrel Export
 * 
 * HANYA export hooks yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 8 to 4
 */

import { logger } from '@/utils/logger';

// ✅ CORE HOOK: Consolidated purchase operations
export { usePurchaseCore } from './usePurchaseCore';

// ✅ ESSENTIAL HOOKS: Most commonly used hooks
export { usePurchaseForm } from './usePurchaseForm';
export { usePurchaseTable } from './usePurchaseTable';
export { usePurchaseStats } from './usePurchaseStats';

// ✅ CONTEXT HOOK: Re-export main purchase hook for convenience
export { usePurchase } from '../context/PurchaseContext';

// ✅ ESSENTIAL TYPES: Most commonly used types
export type {
  UsePurchaseReturn,
  UsePurchaseFormReturn,
  UsePurchaseTableReturn,
  UsePurchaseStatsReturn,
} from '../types/purchase.types';

// ❌ REMOVED - Reduce dependencies:
// - usePurchaseStats (consolidated into usePurchaseCore)
// - usePurchaseStatus (consolidated into usePurchaseCore)  
// - Individual utility hooks (use direct imports if needed)
// - Less commonly used types (import from ../types if needed)

// ✅ OPTIONAL: Advanced hooks for power users (lazy-loaded)
export const PURCHASE_HOOKS_ADVANCED = {
  // Core hook - already exported above
  core: () => import('./usePurchaseCore').then(m => ({ usePurchaseCore: m.usePurchaseCore })),
  
  // Table context hook for internal use
  tableContext: () => import('../context/PurchaseTableContext').then(m => ({ usePurchaseTable: m.usePurchaseTable })),
  
  // Import hook for purchase data
  import: () => import('./usePurchaseImport').then(m => ({ usePurchaseImport: m.usePurchaseImport })),
  
  // All types for advanced usage
  types: () => import('../types/purchase.types')
} as const;

// ✅ MIGRATION: For backward compatibility
export const PURCHASE_HOOKS_LEGACY = {
  // Note: usePurchaseStats is now included in main exports
  // These are truly deprecated hooks
  usePurchaseStatus: () => {
    logger.warn('usePurchaseStatus is deprecated. Use usePurchaseCore instead.');
    return import('./usePurchaseStatus').then(m => m.usePurchaseStatus);
  }
} as const;