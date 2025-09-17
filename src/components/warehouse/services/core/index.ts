// src/components/warehouse/services/core/index.ts
// Core services barrel export for easier imports

// WAC Calculation Service
export {
  calculateNewWac,
  calculateEnhancedWac,
  validateWacCalculation,
  type WACCalculationResult
} from './wacCalculationService';

// Material Search Service
export {
  normalizeUnit,
  findExistingMaterialByName,
  findMaterialById,
  getAllMaterials
} from './materialSearchService';

// Purchase Sync Service
export {
  applyPurchaseToWarehouse,
  reversePurchaseFromWarehouse
} from './purchaseSyncService';

// Warehouse Validation Service
export {
  validateWarehouseIntegrity,
  checkWarehouseConsistency,
  validateItemData,
  type WarehouseConsistencyCheck,
  type ValidationResult
} from './warehouseValidationService';