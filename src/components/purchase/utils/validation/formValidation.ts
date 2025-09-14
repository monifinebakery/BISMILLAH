// src/components/purchase/utils/validation/formValidation.ts

import { ValidationResult } from './types';
import { PurchaseFormData } from '../../types/purchase.types';
import { validateSupplier, validateCalculationMethod } from './fieldValidation';
import { validatePurchaseDate } from './dateValidation';
import { validatePurchaseItems } from './itemValidation';

/**
 * Validate purchase form data comprehensively
 */
export const validatePurchaseForm = (data: Partial<PurchaseFormData>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Supplier validation
  const supplierValidation = validateSupplier(data.supplier);
  if (!supplierValidation.isValid && supplierValidation.error) {
    errors.push(supplierValidation.error);
  }

  // Date validation
  const dateValidation = validatePurchaseDate(data.tanggal);
  if (!dateValidation.isValid && dateValidation.error) {
    errors.push(dateValidation.error);
  }
  if (dateValidation.warning) {
    warnings.push(dateValidation.warning);
  }

  // Items validation
  const itemsValidation = validatePurchaseItems(data.items || []);
  errors.push(...itemsValidation.errors);
  warnings.push(...itemsValidation.warnings);

  // Calculation method validation
  const methodValidation = validateCalculationMethod(data.metode_perhitungan);
  if (!methodValidation.isValid && methodValidation.error) {
    errors.push(methodValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Quick validation for form submission
 */
export const validateForSubmission = (data: Partial<PurchaseFormData>): string[] => {
  const result = validatePurchaseForm(data);
  return result.errors;
};

/**
 * Get validation warnings only
 */
export const getValidationWarnings = (data: Partial<PurchaseFormData>): string[] => {
  const result = validatePurchaseForm(data);
  return result.warnings;
};
