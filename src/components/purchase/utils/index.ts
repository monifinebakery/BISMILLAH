// src/components/purchase/utils/index.ts

// Purchase helpers
export {
  calculatePurchaseStats,
  filterPurchasesByStatus,
  searchPurchases,
  sortPurchases,
  getStatusDisplayText,
  getStatusColor,
  calculateTotalItems,
  calculateUniqueItemTypes,
  groupPurchasesByDateRange,
  canEditPurchase,
  canDeletePurchase,
  generatePurchaseSummary,
  validatePurchaseData,
  exportPurchasesToCSV,
  debounce,
} from './purchaseHelpers';

// Purchase transformers
export {
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB,
  transformPurchasesFromDB,
  transformRealtimePayload,
  calculateItemSubtotal,
  calculatePurchaseTotal,
  normalizePurchaseFormData,
  sanitizePurchaseData,
} from './purchaseTransformers';

// Validation utilities
export {
  validatePurchaseForm,
  validatePurchaseItem,
  validateSupplier,
  validatePurchaseDate,
  validatePurchaseItems,
  validateCalculationMethod,
  validateNumericInput,
  validateDateRange,
  checkDuplicateItems,
  sanitizeInput,
} from './purchaseValidation';

// Export validation types
export type {
  ValidationResult,
  FieldValidation,
} from './purchaseValidation';