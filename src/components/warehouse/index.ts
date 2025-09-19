// src/components/warehouse/index.ts
/**
 * Warehouse Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan oleh external consumers
 * Dependencies: 6 (reduced from 11)
 */

// ✅ CORE EXPORTS ONLY (Most Used) - Updated to use refactored version
export { default as WarehousePage } from './WarehousePageRefactored';
export { 
  WarehouseProvider, 
  useWarehouseContext,
  // ✅ BACKWARD COMPATIBILITY: Clear naming for legacy support
  WarehouseProvider as BahanBakuProvider,
  useWarehouseContext as useBahanBaku
} from './context/WarehouseContext';

// ✅ ESSENTIAL TYPES ONLY
export type {
  BahanBaku,
  WarehouseContextType,
  FilterState,
  SortConfig
} from './types';

// ✅ CORE COMPONENTS (Static only)
export {
  WarehouseHeader,
  WarehouseTable,
  WarehouseFilters,
  BulkActions
} from './components';

// ✅ CORE HOOK
export { useWarehouseCore } from './hooks/useWarehouseCore';

// ❌ REMOVED - Reduce dependencies:
// - Backward compatibility exports (BahanBakuProvider, useBahanBaku)
// - All detailed types (consumers can import from ./types if needed)
// - DialogManager (lazy-loaded, not for barrel export)
// - Services (advanced usage, import directly)
// - lazyImports object (consumers can import directly)
// - preloadDialogs (advanced usage)

// ✅ OPTIONAL: Advanced imports (for power users)
// These don't increase dependencies since they're just references
export const ADVANCED_IMPORTS = {
  types: () => import('./types'),
  services: () => import('./services'),
  dialogs: () => import('./dialogs'),
  hooks: () => import('./hooks')
} as const;