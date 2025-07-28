// src/components/warehouse/index.ts
/**
 * Main Warehouse Module Export
 * Clean and simple barrel export for external usage
 */

// Main Components
export { default as WarehousePage } from './WarehousePage';
export { WarehouseProvider, useWarehouseContext } from './WarehouseContext';

// Types
export type * from './types';