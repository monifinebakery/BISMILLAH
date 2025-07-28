// src/components/warehouse/components/index.ts
/**
 * Warehouse Components Barrel Export
 * Static components that are always loaded
 */

// Core Components
export { default as WarehouseHeader } from './WarehouseHeader';
export { default as WarehouseTable } from './WarehouseTable';
export { default as WarehouseFilters } from './WarehouseFilters';
export { default as BulkActions } from './BulkActions';
export { default as DialogManager } from './DialogManager';

// Type-only exports for components
export type {
  WarehouseHeaderProps,
  WarehouseTableProps,
  WarehouseFiltersProps,
  BulkActionsProps,
  DialogManagerProps
} from '../types';