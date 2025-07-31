// src/components/purchase/utils/validation/index.ts

// Type exports
export type {
  ValidationResult,
  FieldValidation,
  NumericConstraints,
  DateConstraints,
} from './types';

// Form validation
export {
  validatePurchaseForm,
  validateForSubmission,
  getValidationWarnings,
} from './formValidation';

// Field validation
export {
  validateSupplier,
  validateCalculationMethod,
  validateRequiredString,
  validateOptionalString,
  validateUnit,
  validateItemName,
  validateDescription,
} from './fieldValidation';

// Date validation
export {
  validatePurchaseDate,
  validateDate,
  validateDateRange,
} from './dateValidation';

// Numeric validation
export {
  validateNumericInput,
  validateQuantity,
  validatePrice,
  checkPriceReasonableness,
} from './numericValidation';

// Item validation
export {
  validatePurchaseItem,
  validatePurchaseItems,
  checkDuplicateItems,
} from './itemValidation';

// Helper functions
export {
  sanitizeInput,
  isEmpty,
  isValidUUID,
  formatValidationErrors,
  createValidationSummary,
  cloneValidationResult,
} from './helpers';