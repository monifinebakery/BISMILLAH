// src/components/warehouse/hooks/index.ts
/**
 * Warehouse Hooks Barrel Export
 * Core hooks and lazy-loaded hooks
 */

// Core Hook (Always Available)
export { useWarehouseCore } from './useWarehouseCore';
export { useImportExport } from './useImportExport';
export { useWarehouseSelection } from './useWarehouseSelection';

// Dynamic Hook Loader
export const useBulkOperations = () => import('./useWarehouseBulk').then(m => m.useWarehouseBulk);

// Type exports
export type {
  BulkOperationsConfig,
  BulkEditData
} from './useWarehouseBulk';