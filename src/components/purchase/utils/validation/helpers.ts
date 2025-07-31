// src/components/purchase/utils/validation/helpers.ts

/**
 * Sanitize and normalize input values
 */
export const sanitizeInput = (value: any, type: 'string' | 'number' | 'date'): any => {
  switch (type) {
    case 'string':
      return typeof value === 'string' ? value.trim() : String(value || '').trim();
    
    case 'number':
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    
    case 'date':
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
      }
      return new Date();
    
    default:
      return value;
  }
};

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Check if string is valid UUID
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return errors
    .map((error, index) => `${index + 1}. ${error}`)
    .join('\n');
};

/**
 * Create validation summary
 */
export const createValidationSummary = (errors: string[], warnings: string[]): string => {
  const parts: string[] = [];
  
  if (errors.length > 0) {
    parts.push(`❌ ${errors.length} error${errors.length > 1 ? 's' : ''}`);
  }
  
  if (warnings.length > 0) {
    parts.push(`⚠️ ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return '✅ Validasi berhasil';
  }

  return parts.join(', ');
};

/**
 * Deep clone validation result
 */
export const cloneValidationResult = (result: { errors: string[]; warnings: string[] }): { errors: string[]; warnings: string[] } => {
  return {
    errors: [...result.errors],
    warnings: [...result.warnings],
  };
};