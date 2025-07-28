// src/components/warehouse/index.ts

// Main Page
export { default as WarehousePage } from './pages/WarehousePage';

// Context
export { BahanBakuProvider, useBahanBaku } from './context/BahanBakuContext';

// Types
export type * from './types/warehouse';

// Core Hooks
export { useWarehouseSelection } from './hooks/useWarehouseSelection';
export { useWarehousePagination, ITEMS_PER_PAGE_OPTIONS } from './hooks/useWarehousePagination';
export { useWarehouseFilters } from './hooks/useWarehouseFilters';
export { useBulkOperations } from './hooks/useBulkOperations';

// Context Hooks
export { useConnectionManager } from './context/hooks/useConnectionManager';
export { useNotificationDeduplicator } from './context/hooks/useNotificationDeduplicator';
export { useInventoryAnalysis } from './context/hooks/useInventoryAnalysis';

// Core Components
export { default as WarehouseTable } from './components/core/WarehouseTable';
export { default as TablePagination } from './components/core/TablePagination';
export { default as SearchAndFilters } from './components/core/SearchAndFilters';

// Dialog Components
export { default as AddItemDialog } from './components/dialogs/AddItemDialog';
export { default as EditItemDialog } from './components/dialogs/EditItemDialog';
export { default as BulkEditDialog } from './components/dialogs/BulkEditDialog';
export { default as BulkDeleteDialog } from './components/dialogs/BulkDeleteDialog';
export { default as ExportDialog } from './components/dialogs/ExportDialog';
export { default as ImportDialog } from './components/dialogs/ImportDialog';

// Alert Components
export { default as LowStockAlert } from './components/alerts/LowStockAlert';

// Mobile Components
export { default as MobileCard } from './components/mobile/MobileCard';

// Services
export { CrudService } from './context/services/crudService';
export { SubscriptionService } from './context/services/subscriptionService';
export { AlertService } from './context/services/alertService';

// Utility Functions
export * from './utils/formatters';
export * from './context/utils/transformers';