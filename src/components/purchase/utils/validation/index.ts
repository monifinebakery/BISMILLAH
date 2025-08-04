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

// ✅ OPTIONAL: Advanced validation for power users (lazy-loaded)
export const PURCHASE_VALIDATION_ADVANCED = {
  // Form validation utilities
  form: () => import('./formValidation').then(m => ({
    validatePurchaseForm: m.validatePurchaseForm,
    validateForSubmission: m.validateForSubmission,
    getValidationWarnings: m.getValidationWarnings
  })),

  // Field validation utilities
  fields: () => import('./fieldValidation').then(m => ({
    validateSupplier: m.validateSupplier,
    validateCalculationMethod: m.validateCalculationMethod,
    validateRequiredString: m.validateRequiredString,
    validateOptionalString: m.validateOptionalString,
    validateUnit: m.validateUnit,
    validateItemName: m.validateItemName,
    validateDescription: m.validateDescription
  })),

  // Date validation utilities
  dates: () => import('./dateValidation').then(m => ({
    validatePurchaseDate: m.validatePurchaseDate,
    validateDate: m.validateDate,
    validateDateRange: m.validateDateRange
  })),

  // Numeric validation utilities
  numbers: () => import('./numericValidation').then(m => ({
    validateNumericInput: m.validateNumericInput,
    validateQuantity: m.validateQuantity,
    validatePrice: m.validatePrice,
    checkPriceReasonableness: m.checkPriceReasonableness
  })),

  // Item validation utilities
  items: () => import('./itemValidation').then(m => ({
    validatePurchaseItem: m.validatePurchaseItem,
    validatePurchaseItems: m.validatePurchaseItems,
    checkDuplicateItems: m.checkDuplicateItems
  })),

  // Helper utilities
  helpers: () => import('./helpers').then(m => ({
    sanitizeInput: m.sanitizeInput,
    isEmpty: m.isEmpty,
    isValidUUID: m.isValidUUID,
    formatValidationErrors: m.formatValidationErrors,
    createValidationSummary: m.createValidationSummary,
    cloneValidationResult: m.cloneValidationResult
  })),

  // All types for advanced usage
  types: () => import('./types').then(m => ({
    ValidationResult: m.ValidationResult,
    FieldValidation: m.FieldValidation,
    NumericConstraints: m.NumericConstraints,
    DateConstraints: m.DateConstraints
  }))
} as const;

// ✅ VALIDATION PRESETS: Common validation combinations
export const PURCHASE_VALIDATION_PRESETS = {
  // Basic validation - most common use case
  basic: () => Promise.all([
    import('./formValidation').then(m => m.validatePurchaseForm),
    import('./itemValidation').then(m => m.validatePurchaseItem),
    import('./fieldValidation').then(m => m.validateSupplier)
  ]).then(([validateForm, validateItem, validateSupplier]) => ({
    validateForm,
    validateItem,
    validateSupplier
  })),

  // Comprehensive validation - full validation suite
  comprehensive: () => Promise.all([
    import('./formValidation'),
    import('./fieldValidation'),
    import('./itemValidation'),
    import('./numericValidation'),
    import('./dateValidation')
  ]).then(([form, field, item, numeric, date]) => ({
    form,
    field,
    item,
    numeric,
    date
  })),

  // Field-only validation - for form fields
  fieldsOnly: () => Promise.all([
    import('./fieldValidation'),
    import('./numericValidation'),
    import('./dateValidation')
  ]).then(([field, numeric, date]) => ({
    field,
    numeric,
    date
  }))
} as const;

// ✅ VALIDATION FACTORY: Create custom validation combinations
export const createValidationSuite = async (modules: Array<'form' | 'field' | 'item' | 'numeric' | 'date' | 'helpers'>) => {
  const importMap = {
    form: () => import('./formValidation'),
    field: () => import('./fieldValidation'),
    item: () => import('./itemValidation'),
    numeric: () => import('./numericValidation'),
    date: () => import('./dateValidation'),
    helpers: () => import('./helpers')
  };

  const imports = await Promise.all(
    modules.map(module => importMap[module]())
  );

  return modules.reduce((suite, module, index) => {
    suite[module] = imports[index];
    return suite;
  }, {} as Record<string, any>);
};

// ✅ MIGRATION HELPER: For upgrading from full exports
export const PURCHASE_VALIDATION_MIGRATION = {
  instructions: `
    // OLD (full import - loads all validation utilities):
    import { validateQuantity, validateDate } from '@/components/purchase/utils/validation';
    
    // NEW (advanced import - lazy loaded):
    const { validateQuantity } = await PURCHASE_VALIDATION_ADVANCED.numbers();
    const { validateDate } = await PURCHASE_VALIDATION_ADVANCED.dates();
    
    // OR (direct import - best performance):
    import { validateQuantity } from '@/components/purchase/utils/validation/numericValidation';
    import { validateDate } from '@/components/purchase/utils/validation/dateValidation';
    
    // OR (preset import - common combinations):
    const { validateForm, validateItem, validateSupplier } = await PURCHASE_VALIDATION_PRESETS.basic();
  `,

  // Quick access to commonly needed validators
  getCommonValidators: async () => {
    const [form, field, item] = await Promise.all([
      import('./formValidation'),
      import('./fieldValidation'),
      import('./itemValidation')
    ]);

    return {
      validateForm: form.validatePurchaseForm,
      validateSupplier: field.validateSupplier,
      validateItem: item.validatePurchaseItem,
      validateRequired: field.validateRequiredString,
      isEmpty: (await import('./helpers')).isEmpty
    };
  }
} as const;