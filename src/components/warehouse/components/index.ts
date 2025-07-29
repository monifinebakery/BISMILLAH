// src/components/warehouse/components/index.ts
/**
 * Warehouse Components Barrel Export
 * HANYA untuk static components yang always loaded
 */

// ✅ Static Components (Always loaded - frequent use)
export { default as WarehouseHeader } from './WarehouseHeader';
export { default as WarehouseTable } from './WarehouseTable';
export { default as WarehouseFilters } from './WarehouseFilters';
export { default as BulkActions } from './BulkActions';

// ❌ REMOVED: DialogManager - akan di-lazy load
// export { default as DialogManager } from './DialogManager';

// ✅ Type-only exports (tidak mempengaruhi bundle)
export type {
  WarehouseHeaderProps,
  WarehouseTableProps,
  WarehouseFiltersProps,
  BulkActionsProps,
} from '../types';

// ✅ OPTIONAL: Export DialogManagerProps sebagai type saja
export type { DialogManagerProps } from '../types';