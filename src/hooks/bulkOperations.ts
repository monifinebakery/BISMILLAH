// src/hooks/bulkOperations.ts
/**
 * Barrel export untuk bulk operations hooks dan context
 */

// Bulk Operations Hooks
export { useBulkOperations } from './useBulkOperations';
export type {
  BulkOperationsConfig,
  BulkEditData,
  BulkOperationsResult,
  ValidationRule
} from './useBulkOperations';

// Table Selection Hooks
export { useTableSelection } from './useTableSelection';
export type {
  SelectableItem,
  TableSelectionResult
} from './useTableSelection';

// Re-export context untuk kemudahan akses
export {
  BulkOperationsProvider,
  useBulkOperationsContext,
  withBulkOperations
} from '../contexts/BulkOperationsContext';
export type {
  BulkOperationsContextType,
  BulkOperationsProviderProps
} from '../contexts/BulkOperationsContext';