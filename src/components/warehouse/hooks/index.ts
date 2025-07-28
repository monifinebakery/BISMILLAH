// src/components/warehouse/hooks/index.ts
// Core Hook
export { useWarehouseCore } from './useWarehouseCore';

// Dynamic Hook (Lazy Loaded)
export const useWarehouseBulk = () => import('./useWarehouseBulk');