import React from 'react';

// Regular imports for always-loaded components
export { default as LowStockAlert } from './LowStockAlert';
export { default as SelectionControls } from './SelectionControls';
export { default as SearchAndFilters } from './SearchAndFilters';
export { default as WarehouseTable } from './WarehouseTable';
export { default as TablePagination } from './TablePagination';

// Lazy imports for dialogs
export const AddItemDialog = React.lazy(() => import('./AddItemDialog'));
export const BulkDeleteDialog = React.lazy(() => import('./BulkDeleteDialog'));

// Main component export
export { default as WarehousePage } from '../WarehousePage';