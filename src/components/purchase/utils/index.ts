// src/components/purchase/utils/index.ts - Optimized Dependencies (25+ → 8)
/**
 * Purchase Utils - Essential Only Exports
 * 
 * HANYA export utilities yang benar-benar diperlukan untuk external consumers
 * Dependencies dramatically reduced from 25+ to 8
 */

// ✅ CORE HELPERS: Most commonly used utilities (4 exports)
export {
  validatePurchaseData,
  getStatusDisplayText,
  getStatusColor,
  exportPurchasesToCSV
} from './purchaseHelpers';

// ✅ CORE TRANSFORMERS: Essential data transformation (2 exports)
export {
  transformPurchaseFromDB,
  transformPurchaseForDB
} from './purchaseTransformers';

// ✅ CORE VALIDATION: Essential validation only (1 export)
export { validatePurchaseForm } from './validation';

// ✅ ESSENTIAL TYPES: Most commonly used types (1 export)
export type { ValidationResult } from './validation';

// ❌ REMOVED - Reduce dependencies (17+ exports removed):
// - calculatePurchaseStats, filterPurchasesByStatus, searchPurchases, sortPurchases
// - calculateTotalItems, calculateUniqueItemTypes, groupPurchasesByDateRange
// - canEditPurchase, canDeletePurchase, generatePurchaseSummary, debounce
// - transformPurchaseUpdateForDB, transformPurchasesFromDB, transformRealtimePayload
// - calculateItemSubtotal, calculatePurchaseTotal, normalizePurchaseFormData, sanitizePurchaseData
// - All detailed validation functions (validateSupplier, validateCalculationMethod, etc.)
// - All detailed validation types (FieldValidation, NumericConstraints, etc.)
// 
// Use direct imports if these are needed:
// import { calculatePurchaseStats } from './purchaseHelpers';
// import { validateSupplier } from './validation';

// ✅ OPTIONAL: Advanced utilities for power users (lazy-loaded)
export const PURCHASE_UTILS_ADVANCED = {
  // All helpers for advanced usage
  helpers: () => import('./purchaseHelpers'),
  
  // All transformers for data processing
  transformers: () => import('./purchaseTransformers'),
  
  // All validation utilities
  validation: () => import('./validation'),
  
  // Specific utility groups
  stats: () => import('./purchaseHelpers').then(m => ({
    calculatePurchaseStats: m.calculatePurchaseStats,
    calculateTotalItems: m.calculateTotalItems,
    calculateUniqueItemTypes: m.calculateUniqueItemTypes,
    generatePurchaseSummary: m.generatePurchaseSummary
  })),
  
  filters: () => import('./purchaseHelpers').then(m => ({
    filterPurchasesByStatus: m.filterPurchasesByStatus,
    searchPurchases: m.searchPurchases,
    sortPurchases: m.sortPurchases,
    groupPurchasesByDateRange: m.groupPurchasesByDateRange
  })),
  
  permissions: () => import('./purchaseHelpers').then(m => ({
    canEditPurchase: m.canEditPurchase,
    canDeletePurchase: m.canDeletePurchase
  }))
} as const;

// ✅ VALIDATION UTILITIES: Grouped for convenience
export const PURCHASE_VALIDATION_UTILS = {
  // Field validators
  fields: () => import('./validation').then(m => ({
    validateSupplier: m.validateSupplier,
    validateCalculationMethod: m.validateCalculationMethod,
    validateRequiredString: m.validateRequiredString,
    validateOptionalString: m.validateOptionalString,
    validateUnit: m.validateUnit,
    validateItemName: m.validateItemName,
    validateDescription: m.validateDescription
  })),
  
  // Date validators
  dates: () => import('./validation').then(m => ({
    validatePurchaseDate: m.validatePurchaseDate,
    validateDate: m.validateDate,
    validateDateRange: m.validateDateRange
  })),
  
  // Numeric validators
  numbers: () => import('./validation').then(m => ({
    validateNumericInput: m.validateNumericInput,
    validateQuantity: m.validateQuantity,
    validatePrice: m.validatePrice,
    checkPriceReasonableness: m.checkPriceReasonableness
  })),
  
  // Item validators
  items: () => import('./validation').then(m => ({
    validatePurchaseItem: m.validatePurchaseItem,
    validatePurchaseItems: m.validatePurchaseItems,
    checkDuplicateItems: m.checkDuplicateItems
  })),
  
  // Helper utilities
  helpers: () => import('./validation').then(m => ({
    sanitizeInput: m.sanitizeInput,
    isEmpty: m.isEmpty,
    isValidUUID: m.isValidUUID,
    formatValidationErrors: m.formatValidationErrors,
    createValidationSummary: m.createValidationSummary,
    cloneValidationResult: m.cloneValidationResult
  }))
} as const;

// ✅ TRANSFORMER UTILITIES: Grouped for convenience
export const PURCHASE_TRANSFORMER_UTILS = {
  // Database transformers
  database: () => import('./purchaseTransformers').then(m => ({
    transformPurchaseFromDB: m.transformPurchaseFromDB,
    transformPurchaseForDB: m.transformPurchaseForDB,
    transformPurchaseUpdateForDB: m.transformPurchaseUpdateForDB,
    transformPurchasesFromDB: m.transformPurchasesFromDB,
    transformRealtimePayload: m.transformRealtimePayload
  })),
  
  // Calculation transformers
  calculations: () => import('./purchaseTransformers').then(m => ({
    calculateItemSubtotal: m.calculateItemSubtotal,
    calculatePurchaseTotal: m.calculatePurchaseTotal
  })),
  
  // Data normalization
  normalization: () => import('./purchaseTransformers').then(m => ({
    normalizePurchaseFormData: m.normalizePurchaseFormData,
    sanitizePurchaseData: m.sanitizePurchaseData
  }))
} as const;

// ✅ MIGRATION HELPER: For upgrading from full exports
export const PURCHASE_UTILS_MIGRATION = {
  // Instructions for migrating from full exports
  instructions: `
    // OLD (full import - loads all utilities):
    import { calculatePurchaseStats, validateSupplier } from '@/components/purchase/utils';
    
    // NEW (advanced import - lazy loaded):
    const { calculatePurchaseStats } = await PURCHASE_UTILS_ADVANCED.stats();
    const { validateSupplier } = await PURCHASE_VALIDATION_UTILS.fields();
    
    // OR (direct import - best performance):
    import { calculatePurchaseStats } from '@/components/purchase/utils/purchaseHelpers';
    import { validateSupplier } from '@/components/purchase/utils/validation';
  `
} as const;