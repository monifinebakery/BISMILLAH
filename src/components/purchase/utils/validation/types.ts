// src/components/purchase/utils/validation/types.ts

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors?: Record<string, string>;
}

/**
 * Field validation result
 */
export interface FieldValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Numeric validation constraints
 */
export interface NumericConstraints {
  min?: number;
  max?: number;
  integer?: boolean;
  required?: boolean;
}

/**
 * Date validation constraints
 */
export interface DateConstraints {
  required?: boolean;
  allowFuture?: boolean;
  allowPast?: boolean;
  maxYearsInFuture?: number;
  maxYearsInPast?: number;
}