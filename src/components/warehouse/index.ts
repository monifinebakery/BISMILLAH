// src/components/warehouse/index.ts
/**
 * Main Warehouse Module Export
 * 
 * Clean barrel export for external consumers
 * Provides all necessary components, hooks, and utilities
 */

// Main Components (Static)
export { default as WarehousePage } from './WarehousePage';
export { 
  WarehouseProvider, 
  useWarehouseContext,
  // Backward Compatibility Exports
  BahanBakuProvider,
  useBahanBaku
} from './WarehouseContext';

// Core Types (Re-export from types.ts)
export type {
  BahanBaku,
  FilterState,
  SortConfig,
  DialogState,
  WarehouseContextType,
  // Backward Compatibility Types
  BahanBakuContextType,
  ComponentProps,
  WarehouseHeaderProps,
  WarehouseTableProps,
  WarehouseFiltersProps,
  BulkActionsProps,
  DialogManagerProps,
  DialogProps,
  AddEditDialogProps,
  BulkOperationsDialogProps,
  ImportExportDialogProps,
  ServiceConfig,
  ValidationResult,
  ExportFormat,
  ImportResult,
  BulkOperationsConfig,
  BulkEditData,
  PerformanceMetrics,
  WarehouseProviderOptions
} from './types';

// Core Hooks
export { useWarehouseCore } from './hooks';

// Core Components (for custom implementations)
export {
  WarehouseHeader,
  WarehouseTable,
  WarehouseFilters,
  BulkActions,
  DialogManager
} from './components';

// Services & Utilities (for advanced usage)
export { warehouseApi, warehouseUtils, createWarehouseService } from './services';

// Dynamic Imports (for manual lazy loading)
export const lazyImports = {
  // Hooks
  useBulkOperations: () => import('./hooks/useWarehouseBulk'),
  
  // Dialogs
  AddEditDialog: () => import('./dialogs/AddEditDialog'),
  BulkOperationsDialog: () => import('./dialogs/BulkOperationsDialog'),
  ImportExportDialog: () => import('./dialogs/ImportExportDialog'),
};

// Dialog Preloader (for performance optimization)
export { preloadDialogs } from './dialogs';