// src/components/purchase/utils/validation/index.ts - Optimized Dependencies (20+ → 5)
/**
 * Purchase Validation - Essential Only Exports
 * 
 * HANYA export validations yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 20+ to 5
 */

// ✅ CORE VALIDATION: Most commonly used (3 exports)
export { validatePurchaseForm } from './formValidation';
export { validatePurchaseItem } from './itemValidation';
export { validateSupplier } from './fieldValidation';

// ✅ ESSENTIAL TYPES: Most commonly used types (2 exports)
export type { 
  ValidationResult,
  FieldValidation 
} from './types';

// ❌ REMOVED - Reduce dependencies (15+ exports removed):
// - validateForSubmission, getValidationWarnings (use validatePurchaseForm)
// - validateCalculationMethod, validateRequiredString, validateOptionalString, validateUnit, validateItemName, validateDescription
// - validatePurchaseDate, validateDate, validateDateRange
// - validateNumericInput, validateQuantity, validatePrice, checkPriceReasonableness
// - validatePurchaseItems, checkDuplicateItems
// - sanitizeInput, isEmpty, isValidUUID, formatValidationErrors, createValidationSummary, cloneValidationResult
// - NumericConstraints, DateConstraints types
//
// Use direct imports if these are needed:
// import { validateQuantity } from './numericValidation';
// import { validateDate } from './dateValidation';

// ✅ REMOVED: Dynamic import utilities that conflict with static imports
// Use direct imports instead:
// import { validateQuantity } from './numericValidation';
// import { validateDate } from './dateValidation';

// ✅ REMOVED: Validation presets that use dynamic imports
// Use direct imports instead:
// import { validatePurchaseForm } from './formValidation';
// import { validatePurchaseItem } from './itemValidation';

// ✅ REMOVED: Dynamic import factory function
// Use direct imports instead for better performance

// ✅ MIGRATION HELPER: Clean imports only
export const PURCHASE_VALIDATION_MIGRATION = {
  instructions: `
    // RECOMMENDED (direct imports - best performance):
    import { validatePurchaseForm } from '@/components/purchase/utils/validation/formValidation';
    import { validateQuantity } from '@/components/purchase/utils/validation/numericValidation';
    import { validateDate } from '@/components/purchase/utils/validation/dateValidation';
    
    // For lazy loading:
    const validateForm = React.lazy(() => import('@/components/purchase/utils/validation/formValidation'));
  `
} as const;
