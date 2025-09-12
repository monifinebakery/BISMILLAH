// src/components/warehouse/components/index.ts
/**
 * Warehouse Components - Static Only Exports
 * 
 * HANYA components yang always loaded (frequent use)
 * Dependencies: 4 (reduced from 5)
 */

// ✅ STATIC COMPONENTS ONLY
export { default as WarehouseHeader } from './WarehouseHeader';
export { default as WarehouseTable } from './WarehouseTable';
export { default as VirtualWarehouseTable } from './VirtualWarehouseTable';
export { default as WarehouseFilters } from './WarehouseFilters';
export { default as BulkActions } from './BulkActions';

// ❌ REMOVED: DialogManager
// Reason: Lazy-loaded component, tidak untuk barrel export
// Usage: import DialogManager dari './DialogManager' langsung

// ✅ TYPE-ONLY EXPORTS (zero runtime cost)
// Note: Types akan diekspor langsung dari komponen masing-masing jika diperlukan