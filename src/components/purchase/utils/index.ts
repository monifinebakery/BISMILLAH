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

// Validation utilities (from modular validation)
export {
  // Types
  type ValidationResult,
  type FieldValidation,
  type NumericConstraints,
  type DateConstraints,
  
  // Form validation
  validatePurchaseForm,
  validateForSubmission,
  getValidationWarnings,
  
  // Field validation
  validateSupplier,
  validateCalculationMethod,
  validateRequiredString,
  validateOptionalString,
  validateUnit,
  validateItemName,
  validateDescription,
  
  // Date validation
  validatePurchaseDate,
  validateDate,
  validateDateRange,
  
  // Numeric validation
  validateNumericInput,
  validateQuantity,
  validatePrice,
  checkPriceReasonableness,
  
  // Item validation
  validatePurchaseItem,
  validatePurchaseItems,
  checkDuplicateItems,
  
  // Helpers
  sanitizeInput,
  isEmpty,
  isValidUUID,
  formatValidationErrors,
  createValidationSummary,
  cloneValidationResult,
} from './validation';,
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
} from './validation';

// Export validation types
export type {
  ValidationResult,
  FieldValidation,
} from './validation';